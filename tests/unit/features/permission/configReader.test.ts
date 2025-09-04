import { ConfigReader } from '../../../../src/features/permission/configReader';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Mock fs module
jest.mock('fs', () => ({
    existsSync: jest.fn(),
    watchFile: jest.fn(),
    unwatchFile: jest.fn(),
    promises: {
        readFile: jest.fn(),
        writeFile: jest.fn(),
        mkdir: jest.fn()
    }
}));

// Mock os module
jest.mock('os');

describe('ConfigReader', () => {
    let configReader: ConfigReader;
    let mockOutputChannel: vscode.OutputChannel;
    const mockHomePath = '/Users/test';
    const mockConfigPath = path.join(mockHomePath, '.claude.json');

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock os.homedir
        (os.homedir as jest.Mock).mockReturnValue(mockHomePath);

        // Mock output channel
        mockOutputChannel = {
            appendLine: jest.fn()
        } as any;

        // Create instance
        configReader = new ConfigReader(mockOutputChannel);
    });

    afterEach(() => {
        // Clean up any file watchers
        if (configReader) {
            configReader.dispose();
        }
    });

    describe('读取配置文件', () => {
        it('CR-01: 读取存在的配置文件并返回权限状态', async () => {
            const mockConfig = {
                bypassPermissionsModeAccepted: true,
                otherField: 'value'
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

            const result = await configReader.getBypassPermissionStatus();

            expect(result).toBe(true);
            expect(fs.existsSync).toHaveBeenCalledWith(mockConfigPath);
            expect(fs.promises.readFile).toHaveBeenCalledWith(mockConfigPath, 'utf8');
            expect(mockOutputChannel.appendLine).not.toHaveBeenCalledWith(
                expect.stringContaining('Error')
            );
        });

        it('CR-02: 配置文件不存在时返回 false', async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);

            const result = await configReader.getBypassPermissionStatus();

            expect(result).toBe(false);
            expect(fs.promises.readFile).not.toHaveBeenCalled();
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                `[ConfigReader] Config file not found: ${mockConfigPath}`
            );
        });

        it('CR-03: 配置文件 JSON 格式错误时返回 false', async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.promises.readFile as jest.Mock).mockResolvedValue('{ invalid json }');

            const result = await configReader.getBypassPermissionStatus();

            expect(result).toBe(false);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                expect.stringContaining('[ConfigReader] Error reading config:')
            );
        });

        it('CR-04: bypassPermissionsModeAccepted 字段缺失', async () => {
            const mockConfig = {
                otherField: 'value'
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

            const result = await configReader.getBypassPermissionStatus();

            expect(result).toBe(false);
        });

        it('CR-04-2: bypassPermissionsModeAccepted 为 false 时返回 false', async () => {
            const mockConfig = {
                bypassPermissionsModeAccepted: false
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

            const result = await configReader.getBypassPermissionStatus();

            expect(result).toBe(false);
        });
    });

    describe('写入配置文件', () => {
        it('CR-05: 设置权限状态到新文件', async () => {
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
            (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

            await configReader.setBypassPermission(true);

            expect(fs.promises.mkdir).toHaveBeenCalledWith(
                path.dirname(mockConfigPath),
                { recursive: true }
            );
            expect(fs.promises.writeFile).toHaveBeenCalledWith(
                mockConfigPath,
                JSON.stringify({ bypassPermissionsModeAccepted: true }, null, 2),
                'utf8'
            );
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[ConfigReader] Set bypassPermissionsModeAccepted to true'
            );
        });

        it('CR-06: 更新现有配置文件保留其他字段', async () => {
            const existingConfig = {
                bypassPermissionsModeAccepted: false,
                apiKey: 'secret',
                theme: 'dark'
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(existingConfig));
            (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

            await configReader.setBypassPermission(true);

            const expectedConfig = {
                ...existingConfig,
                bypassPermissionsModeAccepted: true
            };

            expect(fs.promises.writeFile).toHaveBeenCalledWith(
                mockConfigPath,
                JSON.stringify(expectedConfig, null, 2),
                'utf8'
            );
        });

        it('CR-07: 配置文件解析失败重试机制', async () => {
            const invalidJson = '{ invalid json }';
            let parseCallCount = 0;
            const originalParse = JSON.parse;

            // Mock JSON.parse to fail 3 times
            JSON.parse = jest.fn().mockImplementation((text) => {
                if (text === invalidJson) {
                    parseCallCount++;
                    throw new Error('Invalid JSON');
                }
                return originalParse(text);
            });

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.promises.readFile as jest.Mock).mockResolvedValue(invalidJson);
            (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

            await configReader.setBypassPermission(true);

            expect(parseCallCount).toBe(3); // Initial + 2 retries
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[ConfigReader] Failed to parse existing config, retrying...'
            );
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[ConfigReader] All parse attempts failed, using empty config object'
            );
            expect(fs.promises.writeFile).toHaveBeenCalledWith(
                mockConfigPath,
                JSON.stringify({ bypassPermissionsModeAccepted: true }, null, 2),
                'utf8'
            );

            // Restore original JSON.parse
            JSON.parse = originalParse;
        });

        it('CR-08: 创建目录如果不存在', async () => {
            (fs.existsSync as jest.Mock)
                .mockReturnValueOnce(false)  // File doesn't exist
                .mockReturnValueOnce(false); // Directory doesn't exist

            (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
            (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);

            await configReader.setBypassPermission(true);

            expect(fs.promises.mkdir).toHaveBeenCalledWith(
                path.dirname(mockConfigPath),
                { recursive: true }
            );
        });

        it('CR-05-2: 写入失败时抛出错误', async () => {
            const writeError = new Error('Write failed');
            (fs.existsSync as jest.Mock).mockReturnValue(false);
            (fs.promises.writeFile as jest.Mock).mockRejectedValue(writeError);

            await expect(configReader.setBypassPermission(true)).rejects.toThrow('Write failed');

            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                `[ConfigReader] Failed to set permission: Error: Write failed`
            );
        });
    });

    describe('文件监控', () => {
        it('CR-09: 文件监控触发回调', async () => {
            const mockCallback = jest.fn();
            const mockWatcher = jest.fn();
            
            // Mock fs.watchFile
            (fs.watchFile as jest.Mock).mockImplementation((path, options, callback) => {
                mockWatcher(path, options);
                // Simulate file change
                const prevStats = { mtime: new Date('2024-01-01') };
                const currStats = { mtime: new Date('2024-01-02') };
                setTimeout(() => callback(currStats, prevStats), 10);
            });

            configReader.watchConfigFile(mockCallback);

            expect(mockWatcher).toHaveBeenCalledWith(
                mockConfigPath,
                { interval: 2000 }
            );
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                `[ConfigReader] Started watching config file: ${mockConfigPath}`
            );

            // Wait for callback
            await new Promise(resolve => setTimeout(resolve, 20));
            expect(mockCallback).toHaveBeenCalled();
        });

        it('CR-10: dispose 清理文件监控', () => {
            const mockCallback = jest.fn();
            (fs.watchFile as jest.Mock).mockImplementation(() => {});
            (fs.unwatchFile as jest.Mock).mockImplementation(() => {});

            // Start watching
            configReader.watchConfigFile(mockCallback);

            // Dispose
            configReader.dispose();

            expect(fs.unwatchFile).toHaveBeenCalledWith(mockConfigPath);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[ConfigReader] Stopped watching config file'
            );
        });

        it('CR-10-2: 未设置监控时 dispose 不执行清理', () => {
            (fs.unwatchFile as jest.Mock).mockImplementation(() => {});

            // Dispose without watching
            configReader.dispose();

            expect(fs.unwatchFile).not.toHaveBeenCalled();
        });
    });

    describe('边界情况', () => {
        it('CR-01-3: 处理文件读取异常', async () => {
            const readError = new Error('Read failed');
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.promises.readFile as jest.Mock).mockRejectedValue(readError);

            const result = await configReader.getBypassPermissionStatus();

            expect(result).toBe(false);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                `[ConfigReader] Error reading config: Error: Read failed`
            );
        });

        it('CR-04-3: 处理非布尔值的 bypassPermissionsModeAccepted', async () => {
            const mockConfig = {
                bypassPermissionsModeAccepted: 'true' // String instead of boolean
            };

            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.promises.readFile as jest.Mock).mockResolvedValue(JSON.stringify(mockConfig));

            const result = await configReader.getBypassPermissionStatus();

            expect(result).toBe(false); // Strict comparison with true
        });
    });
});