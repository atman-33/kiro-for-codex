import { PermissionCache } from '../../../../src/features/permission/permissionCache';
import { ConfigReader } from '../../../../src/features/permission/configReader';
import * as vscode from 'vscode';

// Mock ConfigReader
jest.mock('../../../../src/features/permission/configReader');

describe('PermissionCache', () => {
    let permissionCache: PermissionCache;
    let mockConfigReader: jest.Mocked<ConfigReader>;
    let mockOutputChannel: vscode.OutputChannel;
    let eventListeners: Array<(value: boolean) => void>;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        eventListeners = [];

        // Mock ConfigReader
        mockConfigReader = {
            getBypassPermissionStatus: jest.fn().mockResolvedValue(false),
            setBypassPermission: jest.fn().mockResolvedValue(undefined),
            watchConfigFile: jest.fn(),
            dispose: jest.fn()
        } as any;

        // Mock output channel
        mockOutputChannel = {
            appendLine: jest.fn()
        } as any;

        // Create instance
        permissionCache = new PermissionCache(mockConfigReader, mockOutputChannel);

        // Capture event listeners
        permissionCache.event((value) => {
            eventListeners.forEach(listener => listener(value));
        });
    });

    describe('Cache Management', () => {
        it('PC-01: 首次获取权限状态（无缓存）', async () => {
            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(true);

            const result = await permissionCache.get();

            expect(mockConfigReader.getBypassPermissionStatus).toHaveBeenCalledTimes(1);
            expect(result).toBe(true);
        });

        it('PC-02: 从缓存获取权限状态', async () => {
            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(true);

            // First call
            const result1 = await permissionCache.get();
            // Second call
            const result2 = await permissionCache.get();

            expect(mockConfigReader.getBypassPermissionStatus).toHaveBeenCalledTimes(1);
            expect(result1).toBe(true);
            expect(result2).toBe(true);
        });

        it('PC-03: 刷新缓存（不返回值）', async () => {
            // Initial value
            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(false);
            await permissionCache.get();

            // Change value
            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(true);
            await permissionCache.refresh();

            // Verify new value is cached
            const result = await permissionCache.get();
            expect(result).toBe(true);
            expect(mockConfigReader.getBypassPermissionStatus).toHaveBeenCalledTimes(2);
        });

        it('PC-04: 刷新并获取最新状态', async () => {
            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(true);

            const result = await permissionCache.refreshAndGet();

            expect(mockConfigReader.getBypassPermissionStatus).toHaveBeenCalledTimes(1);
            expect(result).toBe(true);
        });
    });

    describe('Event System', () => {
        it('PC-05: 权限从 false 变为 true 触发事件', async () => {
            const eventSpy = jest.fn();
            eventListeners.push(eventSpy);

            // Initial state
            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(false);
            await permissionCache.get();

            // Change to true
            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(true);
            await permissionCache.refreshAndGet();

            expect(eventSpy).toHaveBeenCalledWith(true);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[PermissionCache] Permission changed: false -> true'
            );
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[PermissionCache] Permission granted! Firing event.'
            );
        });

        it('PC-06: 权限从 true 变为 false 触发事件', async () => {
            const eventSpy = jest.fn();
            eventListeners.push(eventSpy);

            // Initial state
            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(true);
            await permissionCache.get();

            // Change to false
            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(false);
            await permissionCache.refreshAndGet();

            expect(eventSpy).toHaveBeenCalledWith(false);
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[PermissionCache] Permission changed: true -> false'
            );
            expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
                '[PermissionCache] Permission revoked! Firing event.'
            );
        });

        it('PC-07: 权限状态不变时不触发事件', async () => {
            const eventSpy = jest.fn();
            eventListeners.push(eventSpy);

            // Initial state
            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(true);
            await permissionCache.get();

            // Clear previous logs from initial setup
            (mockOutputChannel.appendLine as jest.Mock).mockClear();

            // Same value
            await permissionCache.refreshAndGet();

            expect(eventSpy).not.toHaveBeenCalled();
            expect(mockOutputChannel.appendLine).not.toHaveBeenCalledWith(
                expect.stringContaining('Permission changed')
            );
        });

        it('PC-10: 事件监听器正确接收权限变化', async () => {
            const listener1 = jest.fn();
            const listener2 = jest.fn();
            const listener3 = jest.fn();

            eventListeners.push(listener1, listener2, listener3);

            // Initial state
            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(false);
            await permissionCache.get();

            // Change to true
            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(true);
            await permissionCache.refreshAndGet();

            expect(listener1).toHaveBeenCalledWith(true);
            expect(listener2).toHaveBeenCalledWith(true);
            expect(listener3).toHaveBeenCalledWith(true);
        });
    });

    describe('Performance', () => {
        it('PC-08: 多次连续调用 get 使用缓存', async () => {
            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(true);

            // First call to establish cache
            await permissionCache.get();
            
            // Clear mock to verify subsequent calls use cache
            mockConfigReader.getBypassPermissionStatus.mockClear();

            // Call get() 10 times concurrently
            const promises = Array(10).fill(null).map(() => permissionCache.get());
            const results = await Promise.all(promises);

            // Should not call ConfigReader again (uses cache)
            expect(mockConfigReader.getBypassPermissionStatus).toHaveBeenCalledTimes(0);
            expect(results).toEqual(Array(10).fill(true));
        });
    });

    describe('Error Handling', () => {
        it('PC-09: ConfigReader 读取失败时传播错误', async () => {
            mockConfigReader.getBypassPermissionStatus.mockRejectedValue(new Error('File read error'));

            await expect(permissionCache.get()).rejects.toThrow('File read error');
        });

        it('PC-09: 刷新时 ConfigReader 错误的处理', async () => {
            // Initial successful read
            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(true);
            await permissionCache.get();

            // Error on refresh
            mockConfigReader.getBypassPermissionStatus.mockRejectedValue(new Error('Network error'));
            
            await expect(permissionCache.refreshAndGet()).rejects.toThrow('Network error');
        });
    });

    describe('Edge Cases', () => {
        it('PC-01-2: 将 undefined 缓存视为需要获取', async () => {
            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(false);

            // First call with undefined cache
            const result = await permissionCache.get();

            expect(mockConfigReader.getBypassPermissionStatus).toHaveBeenCalledTimes(1);
            expect(result).toBe(false);
        });

        it('PC-02-2: 正确缓存 false 值', async () => {
            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(false);

            // First call
            await permissionCache.get();
            // Second call - should use cache
            const result = await permissionCache.get();

            expect(mockConfigReader.getBypassPermissionStatus).toHaveBeenCalledTimes(1);
            expect(result).toBe(false);
        });

        it('PC-05/06: 处理快速权限变化', async () => {
            const eventSpy = jest.fn();
            eventListeners.push(eventSpy);

            // Rapid changes: false -> true -> false -> true
            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(false);
            await permissionCache.get();

            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(true);
            await permissionCache.refreshAndGet();

            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(false);
            await permissionCache.refreshAndGet();

            mockConfigReader.getBypassPermissionStatus.mockResolvedValue(true);
            await permissionCache.refreshAndGet();

            expect(eventSpy).toHaveBeenCalledTimes(3);
            expect(eventSpy).toHaveBeenNthCalledWith(1, true);
            expect(eventSpy).toHaveBeenNthCalledWith(2, false);
            expect(eventSpy).toHaveBeenNthCalledWith(3, true);
        });
    });

    describe('Interface Compliance', () => {
        it('IPC-01: 实现 IPermissionCache 接口', () => {
            expect(permissionCache.get).toBeDefined();
            expect(permissionCache.refresh).toBeDefined();
            expect(permissionCache.refreshAndGet).toBeDefined();
            expect(permissionCache.event).toBeDefined();
            expect(permissionCache.fire).toBeDefined();
            expect(permissionCache.dispose).toBeDefined();
        });

        it('IPC-02: 继承 vscode.EventEmitter', () => {
            expect(permissionCache).toBeInstanceOf(vscode.EventEmitter);
        });
    });
});