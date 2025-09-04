import { UpdateChecker } from '../../../src/utils/updateChecker';
import * as vscode from 'vscode';

// Mock fetch globally
global.fetch = jest.fn();

// Mock vscode.env
(vscode as any).env = {
    openExternal: jest.fn()
};

// Mock NotificationUtils
jest.mock('../../../src/utils/notificationUtils', () => ({
    NotificationUtils: {
        showAutoDismissNotification: jest.fn().mockResolvedValue(undefined)
    }
}));

describe('UpdateChecker', () => {
    let updateChecker: UpdateChecker;
    let mockContext: vscode.ExtensionContext;
    let mockOutputChannel: vscode.OutputChannel;
    let mockGlobalState: any;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockClear();

        // Mock global state
        mockGlobalState = {
            get: jest.fn(),
            update: jest.fn().mockResolvedValue(undefined)
        };

        // Mock extension context
        mockContext = {
            globalState: mockGlobalState
        } as any;

        // Mock output channel
        mockOutputChannel = {
            appendLine: jest.fn()
        } as any;

        // Mock vscode.extensions
        const mockExtension = {
            packageJSON: {
                version: '0.1.8'
            }
        };
        (vscode.extensions.getExtension as jest.Mock).mockReturnValue(mockExtension);

        // Mock showInformationMessage
        (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue(undefined);

        updateChecker = new UpdateChecker(mockContext, mockOutputChannel);
    });

    describe('GitHub API Integration', () => {
        it('should fetch latest release from GitHub API', async () => {
            const mockRelease = {
                tag_name: 'v0.1.8',
                name: 'Release v0.1.8',
                html_url: 'https://github.com/notdp/kiro-for-cc/releases/tag/v0.1.8',
                body: 'Release notes'
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockRelease
            });

            await updateChecker.checkForUpdates();

            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.github.com/repos/notdp/kiro-for-cc/releases/latest'
            );
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[UpdateChecker] Fetching latest release from GitHub...'
            );
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[UpdateChecker] Latest release: v0.1.8'
            );
        });

        it('should handle API errors gracefully', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

            await updateChecker.checkForUpdates();

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[UpdateChecker] ERROR: Failed to fetch latest release: Error: Network error'
            );
        });

        it('should handle non-OK responses', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404,
                statusText: 'Not Found'
            });

            await updateChecker.checkForUpdates();

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[UpdateChecker] GitHub API returned 404: Not Found'
            );
        });
    });

    describe('Version Comparison', () => {
        const testCases = [
            { current: '0.1.8', latest: 'v0.1.9', shouldUpdate: true },
            { current: '0.1.8', latest: 'v0.2.0', shouldUpdate: true },
            { current: '0.1.8', latest: 'v1.0.0', shouldUpdate: true },
            { current: '0.1.8', latest: 'v0.1.8', shouldUpdate: false },
            { current: '0.1.9', latest: 'v0.1.8', shouldUpdate: false },
            { current: '1.0.0', latest: 'v0.9.9', shouldUpdate: false },
        ];

        testCases.forEach(({ current, latest, shouldUpdate }) => {
            it(`should ${shouldUpdate ? 'show' : 'not show'} update for ${current} -> ${latest}`, async () => {
                // Mock current version
                (vscode.extensions.getExtension as jest.Mock).mockReturnValue({
                    packageJSON: { version: current }
                });

                // Create new instance with mocked version
                updateChecker = new UpdateChecker(mockContext, mockOutputChannel);

                // Mock API response
                const mockRelease = {
                    tag_name: latest,
                    name: `Release ${latest}`
                };

                (global.fetch as jest.Mock).mockResolvedValueOnce({
                    ok: true,
                    json: async () => mockRelease
                });

                await updateChecker.checkForUpdates();

                if (shouldUpdate) {
                    expect(vscode.window.showInformationMessage).toHaveBeenCalled();
                } else {
                    expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
                }
            });
        });
    });

    describe('User Interactions', () => {
        beforeEach(() => {
            // Mock NotificationUtils
            jest.mock('../../../src/utils/notificationUtils');
        });

        it('should open changelog when "View Changelog" is clicked', async () => {
            const mockRelease = {
                tag_name: 'v0.1.9',
                name: 'Release v0.1.9'
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockRelease
            });

            // Mock user clicking "View Changelog"
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValueOnce('View Changelog');

            await updateChecker.checkForUpdates();

            // Wait for the promise to resolve
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(vscode.env.openExternal).toHaveBeenCalledWith(
                vscode.Uri.parse('https://github.com/notdp/kiro-for-cc/releases/latest')
            );
        });

        it('should skip version when "Skip" is clicked', async () => {
            const mockRelease = {
                tag_name: 'v0.1.9',
                name: 'Release v0.1.9'
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockRelease
            });

            // Mock user clicking "Skip"
            (vscode.window.showInformationMessage as jest.Mock).mockResolvedValueOnce('Skip');

            await updateChecker.checkForUpdates();

            // Wait for the promise to resolve
            await new Promise(resolve => setTimeout(resolve, 0));

            expect(mockGlobalState.update).toHaveBeenCalledWith('kfc.skipVersion', '0.1.9');
        });

        it('should not show notification for skipped version', async () => {
            // Set up skipped version
            mockGlobalState.get.mockImplementation((key: string) => {
                if (key === 'kfc.skipVersion') return '0.1.9';
                return undefined;
            });

            const mockRelease = {
                tag_name: 'v0.1.9',
                name: 'Release v0.1.9'
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockRelease
            });

            await updateChecker.checkForUpdates();

            expect(vscode.window.showInformationMessage).not.toHaveBeenCalled();
        });
    });

    describe('Rate Limiting', () => {
        it('should not check if already checked within 24 hours', async () => {
            // Set last check to 1 hour ago
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            mockGlobalState.get.mockImplementation((key: string) => {
                if (key === 'kfc.lastUpdateCheck') return oneHourAgo;
                return undefined;
            });

            await updateChecker.checkForUpdates();

            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should check if force parameter is true', async () => {
            // Set last check to 1 hour ago
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            mockGlobalState.get.mockImplementation((key: string) => {
                if (key === 'kfc.lastUpdateCheck') return oneHourAgo;
                return undefined;
            });

            const mockRelease = {
                tag_name: 'v0.1.8',
                name: 'Release v0.1.8'
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => mockRelease
            });

            await updateChecker.checkForUpdates(true); // Force check

            expect(global.fetch).toHaveBeenCalled();
        });
    });

    describe('Real API Test (Manual)', () => {
        it.skip('should actually fetch from GitHub API', async () => {
            // This test actually calls the GitHub API - skip in CI
            const response = await fetch('https://api.github.com/repos/notdp/kiro-for-cc/releases/latest');
            const data = await response.json() as any;

            console.log('Latest release:', data.tag_name);
            console.log('Published:', new Date(data.published_at).toLocaleString());
            console.log('URL:', data.html_url);

            expect(response.ok).toBe(true);
            expect(data.tag_name).toBeDefined();
        });
    });
});