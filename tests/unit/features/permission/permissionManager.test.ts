import { PermissionManager } from '../../../../src/features/permission/permissionManager';
import { ConfigReader } from '../../../../src/features/permission/configReader';
import { PermissionCache } from '../../../../src/features/permission/permissionCache';
import { PermissionWebview } from '../../../../src/features/permission/permissionWebview';
import { ClaudeCodeProvider } from '../../../../src/providers/claudeCodeProvider';
import * as vscode from 'vscode';
import { NotificationUtils } from '../../../../src/utils/notificationUtils';

// Mock dependencies
jest.mock('../../../../src/features/permission/configReader');
jest.mock('../../../../src/features/permission/permissionCache');
jest.mock('../../../../src/features/permission/permissionWebview');
jest.mock('../../../../src/providers/claudeCodeProvider');
jest.mock('../../../../src/utils/notificationUtils');

describe('PermissionManager', () => {
    let permissionManager: PermissionManager;
    let mockContext: vscode.ExtensionContext;
    let mockOutputChannel: vscode.OutputChannel;
    let mockConfigReader: jest.Mocked<ConfigReader>;
    let mockCache: jest.Mocked<PermissionCache>;
    let mockTerminal: vscode.Terminal;
    let cacheEventCallback: (hasPermission: boolean) => void;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock extension context
        mockContext = {
            subscriptions: []
        } as any;

        // Mock output channel
        mockOutputChannel = {
            appendLine: jest.fn()
        } as any;

        // Mock terminal
        mockTerminal = {
            dispose: jest.fn()
        } as any;

        // Mock ConfigReader
        mockConfigReader = {
            getBypassPermissionStatus: jest.fn(),
            setBypassPermission: jest.fn().mockResolvedValue(undefined),
            watchConfigFile: jest.fn(),
            dispose: jest.fn()
        } as any;

        // Mock PermissionCache with event system
        mockCache = {
            get: jest.fn().mockResolvedValue(false),
            refresh: jest.fn().mockResolvedValue(undefined),
            refreshAndGet: jest.fn().mockResolvedValue(false),
            event: jest.fn((callback) => {
                cacheEventCallback = callback;
                return { dispose: jest.fn() };
            }),
            fire: jest.fn(),
            dispose: jest.fn()
        } as any;

        // Mock constructors
        (ConfigReader as jest.Mock).mockImplementation(() => mockConfigReader);
        (PermissionCache as jest.Mock).mockImplementation(() => mockCache);

        // Mock static methods
        (ClaudeCodeProvider.createPermissionTerminal as jest.Mock).mockReturnValue(mockTerminal);
        (PermissionWebview.createOrShow as jest.Mock).mockImplementation(() => { });
        (PermissionWebview.close as jest.Mock).mockImplementation(() => { });

        // Mock vscode APIs
        (vscode.window.showInformationMessage as jest.Mock).mockResolvedValue(undefined);
        (vscode.window.showWarningMessage as jest.Mock).mockResolvedValue(undefined);
        (vscode.commands.executeCommand as jest.Mock).mockResolvedValue(undefined);
        
        // Mock NotificationUtils
        (NotificationUtils.showAutoDismissNotification as jest.Mock).mockResolvedValue(undefined);
    });

    afterEach(() => {
        if (permissionManager) {
            permissionManager.dispose();
        }
    });

    describe('初始化和监控', () => {
        it('PM-01: 初始化权限系统并启动监控', async () => {
            mockCache.refreshAndGet.mockResolvedValue(false);
            (PermissionWebview.createOrShow as jest.Mock).mockImplementation((ctx, callbacks) => {
                // Simulate user accepting
                setTimeout(() => callbacks.onAccept(), 10);
            });

            permissionManager = new PermissionManager(mockContext, mockOutputChannel);
            const result = await permissionManager.initializePermissions();

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[PermissionManager] Initializing permissions...'
            );
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[PermissionManager] Starting file monitoring...'
            );
            expect(mockConfigReader.watchConfigFile).toHaveBeenCalled();
            expect(result).toBe(true);
        });

        it('PM-02: 有权限时初始化直接返回 true', async () => {
            mockCache.refreshAndGet.mockResolvedValue(true);

            permissionManager = new PermissionManager(mockContext, mockOutputChannel);
            const result = await permissionManager.initializePermissions();

            expect(result).toBe(true);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[PermissionManager] Permissions already granted'
            );
            expect(PermissionWebview.createOrShow).not.toHaveBeenCalled();
            // 仍然启动监控
            expect(mockConfigReader.watchConfigFile).toHaveBeenCalled();
        });

        it('PM-03: 无权限时显示权限设置界面', async () => {
            mockCache.refreshAndGet.mockResolvedValue(false);
            let acceptCallback: () => Promise<boolean>;

            (PermissionWebview.createOrShow as jest.Mock).mockImplementation((ctx, callbacks) => {
                acceptCallback = callbacks.onAccept;
            });

            permissionManager = new PermissionManager(mockContext, mockOutputChannel);
            const initPromise = permissionManager.initializePermissions();

            // Simulate user accepting
            await new Promise(resolve => setTimeout(resolve, 10));
            const grantResult = await acceptCallback!();
            expect(grantResult).toBe(true);

            const result = await initPromise;

            expect(ClaudeCodeProvider.createPermissionTerminal).toHaveBeenCalled();
            expect(PermissionWebview.createOrShow).toHaveBeenCalled();
            expect(result).toBe(true);
        });
    });

    describe('事件处理', () => {
        beforeEach(() => {
            permissionManager = new PermissionManager(mockContext, mockOutputChannel);
        });

        it('PM-04: 权限从 false 变为 true 时关闭 UI 并显示通知', async () => {
            // Set up mock webview and terminal
            (permissionManager as any).permissionWebview = { dispose: jest.fn() };
            (permissionManager as any).currentTerminal = mockTerminal;

            // Trigger permission granted event
            await cacheEventCallback(true);

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[PermissionManager] Permission granted detected, closing UI elements'
            );
            expect(PermissionWebview.close).toHaveBeenCalled();
            expect(mockTerminal.dispose).toHaveBeenCalled();
            expect(NotificationUtils.showAutoDismissNotification).toHaveBeenCalledWith(
                '✅ Claude Code permissions detected and verified!'
            );
        });

        it('PM-05: 权限从 true 变为 false 时显示警告和设置界面', async () => {
            // Mock showPermissionSetup to resolve immediately
            (PermissionWebview.createOrShow as jest.Mock).mockImplementation((ctx, callbacks) => {
                // Simulate immediate cancel to resolve the promise
                setTimeout(() => callbacks.onCancel(), 10);
            });

            // Trigger permission revoked event
            await cacheEventCallback(false);

            // Wait for showPermissionSetup to complete
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[PermissionManager] Permission revoked detected, showing setup'
            );
            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                'Claude Code permissions have been revoked. Please grant permissions again.'
            );
            expect(ClaudeCodeProvider.createPermissionTerminal).toHaveBeenCalled();
            expect(PermissionWebview.createOrShow).toHaveBeenCalled();
        });
    });

    describe('权限操作', () => {
        beforeEach(() => {
            permissionManager = new PermissionManager(mockContext, mockOutputChannel);
        });

        it('PM-06: 检查权限使用缓存', async () => {
            mockCache.get.mockResolvedValue(true);

            const result = await permissionManager.checkPermission();

            expect(mockCache.get).toHaveBeenCalled();
            expect(result).toBe(true);
            expect(mockConfigReader.getBypassPermissionStatus).not.toHaveBeenCalled();
        });

        it('PM-07: 授予权限更新配置和缓存', async () => {
            const result = await permissionManager.grantPermission();

            expect(mockConfigReader.setBypassPermission).toHaveBeenCalledWith(true);
            expect(mockCache.refresh).toHaveBeenCalled();
            expect(result).toBe(true);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[PermissionManager] Permission granted via WebView'
            );
        });

        it('PM-07-2: 授予权限失败时返回 false', async () => {
            const error = new Error('Failed to write config');
            mockConfigReader.setBypassPermission.mockRejectedValue(error);

            const result = await permissionManager.grantPermission();

            expect(result).toBe(false);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                `[PermissionManager] Failed to grant permission: Error: Failed to write config`
            );
        });

        it('PM-10: 重置权限触发事件并显示设置界面', async () => {
            const result = await permissionManager.resetPermission();

            expect(mockConfigReader.setBypassPermission).toHaveBeenCalledWith(false);
            expect(mockCache.refresh).toHaveBeenCalled();
            expect(result).toBe(true);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[PermissionManager] Permission reset completed'
            );
        });
    });

    describe('重试机制', () => {
        it('PM-08: 重试机制处理权限拒绝', async () => {
            mockCache.refreshAndGet.mockResolvedValue(false);
            let cancelCallback: () => void;
            let acceptCallback: () => Promise<boolean>;

            // First time: user cancels
            (PermissionWebview.createOrShow as jest.Mock)
                .mockImplementationOnce((ctx, callbacks) => {
                    cancelCallback = callbacks.onCancel;
                    acceptCallback = callbacks.onAccept;
                })
                .mockImplementationOnce((ctx, callbacks) => {
                    // Second time: user accepts
                    setTimeout(() => callbacks.onAccept(), 10);
                });

            // Mock user clicking "Try Again"
            (vscode.window.showWarningMessage as jest.Mock).mockResolvedValueOnce('Try Again');

            permissionManager = new PermissionManager(mockContext, mockOutputChannel);
            const initPromise = permissionManager.initializePermissions();

            // Simulate user canceling first time
            await new Promise(resolve => setTimeout(resolve, 10));
            cancelCallback!();

            // Wait for retry
            await new Promise(resolve => setTimeout(resolve, 20));

            const result = await initPromise;

            expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
                'Claude Code permissions not granted. The extension will not work. Please approve or uninstall.',
                'Try Again',
                'Uninstall'
            );
            expect(PermissionWebview.createOrShow).toHaveBeenCalledTimes(2);
            expect(result).toBe(true);
        });

        it('PM-09: 用户选择卸载扩展', async () => {
            mockCache.refreshAndGet.mockResolvedValue(false);

            (PermissionWebview.createOrShow as jest.Mock).mockImplementation((ctx, callbacks) => {
                setTimeout(() => callbacks.onCancel(), 10);
            });

            // Mock user clicking "Uninstall" then confirming
            (vscode.window.showWarningMessage as jest.Mock)
                .mockResolvedValueOnce('Uninstall')
                .mockResolvedValueOnce('Uninstall');

            permissionManager = new PermissionManager(mockContext, mockOutputChannel);
            const result = await permissionManager.initializePermissions();

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[PermissionManager] User chose to uninstall'
            );
            expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
                'workbench.extensions.uninstallExtension',
                'heisebaiyun.kiro-for-cc'
            );
            expect(result).toBe(false);
        });
    });

    describe('UI 管理', () => {
        it('PM-UI-01: 正确管理 WebView 引用', () => {
            const mockPanel = { dispose: jest.fn() };

            // Mock PermissionWebview.currentPanel getter
            Object.defineProperty(PermissionWebview, 'currentPanel', {
                get: jest.fn(() => mockPanel),
                configurable: true
            });

            (PermissionWebview.createOrShow as jest.Mock).mockImplementation(() => { });

            permissionManager = new PermissionManager(mockContext, mockOutputChannel);

            // Call showPermissionSetup synchronously (don't await since we're testing the reference)
            const promise = (permissionManager as any).showPermissionSetup();

            // Check that webview reference was saved
            expect((permissionManager as any).permissionWebview).toBe(mockPanel);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[PermissionManager] WebView reference saved: Yes'
            );

            // Clean up - resolve the promise
            promise.then(() => { });
        });

        it('PM-UI-02: showPermissionSetup 处理错误', async () => {
            (ClaudeCodeProvider.createPermissionTerminal as jest.Mock).mockImplementation(() => {
                throw new Error('Terminal creation failed');
            });

            permissionManager = new PermissionManager(mockContext, mockOutputChannel);
            const result = await (permissionManager as any).showPermissionSetup();

            expect(result).toBe(false);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('[PermissionManager] Error in showPermissionSetup:')
            );
        });
    });

    describe('资源清理', () => {
        it('PM-11: dispose 清理所有资源', () => {
            const mockWebview = { dispose: jest.fn() };
            const mockDisposable = { dispose: jest.fn() };

            permissionManager = new PermissionManager(mockContext, mockOutputChannel);
            (permissionManager as any).permissionWebview = mockWebview;
            (permissionManager as any).currentTerminal = mockTerminal;
            (permissionManager as any).disposables = [mockDisposable];

            permissionManager.dispose();

            expect(mockDisposable.dispose).toHaveBeenCalled();
            expect(mockConfigReader.dispose).toHaveBeenCalled();
            expect(mockWebview.dispose).toHaveBeenCalled();
            expect(mockTerminal.dispose).toHaveBeenCalled();
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[PermissionManager] Disposed'
            );
        });
    });
});