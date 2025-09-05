import { ApprovalMode, CodexConfig, ConfigManager, MigrationConfig } from '../../../src/utils/configManager';

// Mock vscode
jest.mock('vscode', () => ({
  workspace: {
    workspaceFolders: [{
      uri: { fsPath: '/test/workspace' }
    }],
    fs: {
      createDirectory: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
      readFile: jest.fn().mockResolvedValue(Buffer.from('{}'))
    },
    getConfiguration: jest.fn(() => ({
      get: jest.fn()
    }))
  },
  Uri: {
    file: jest.fn((path: string) => ({ fsPath: path }))
  }
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  promises: {
    copyFile: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
    readFile: jest.fn().mockResolvedValue('')
  }
}));

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

describe('ConfigManager Codex Integration', () => {
  let configManager: ConfigManager;
  const vscode = require('vscode');
  const fs = require('fs');
  const { spawn } = require('child_process');

  beforeEach(() => {
    jest.clearAllMocks();
    configManager = ConfigManager.getInstance();
  });

  describe('Codex Configuration', () => {
    test('should return default Codex config', () => {
      const codexConfig = configManager.getCodexConfig();

      expect(codexConfig).toEqual({
        path: 'codex',
        defaultApprovalMode: ApprovalMode.Interactive,
        defaultModel: 'gpt-5',
        timeout: 30000,
        terminalDelay: 1000
      });
    });

    test('should update Codex config', async () => {
      const newConfig: Partial<CodexConfig> = {
        path: '/usr/local/bin/codex',
        defaultApprovalMode: ApprovalMode.AutoEdit,
        timeout: 45000
      };

      await configManager.updateCodexConfig(newConfig);

      const updatedConfig = configManager.getCodexConfig();
      expect(updatedConfig.path).toBe('/usr/local/bin/codex');
      expect(updatedConfig.defaultApprovalMode).toBe(ApprovalMode.AutoEdit);
      expect(updatedConfig.timeout).toBe(45000);
      expect(updatedConfig.defaultModel).toBe('gpt-5'); // Should preserve existing values
    });

    test('should validate Codex path successfully', async () => {
      const mockProcess = {
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('codex version 1.0.0'));
            }
          })
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(0); // Success exit code
          }
        })
      };

      spawn.mockReturnValue(mockProcess);

      const result = await configManager.validateCodexPath('codex');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should handle Codex path validation failure', async () => {
      const mockProcess = {
        stdout: {
          on: jest.fn()
        },
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Command not found'));
          }
        })
      };

      spawn.mockReturnValue(mockProcess);

      const result = await configManager.validateCodexPath('invalid-codex');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Failed to execute Codex CLI');
    });
  });

  describe('Migration Configuration', () => {
    test('should return default migration config', () => {
      const migrationConfig = configManager.getMigrationConfig();

      expect(migrationConfig).toEqual({
        preserveClaudeSettings: true,
        backupOriginalFiles: true,
        migrationCompleted: false
      });
    });

    test('should update migration config', async () => {
      const newConfig: Partial<MigrationConfig> = {
        migrationCompleted: true,
        preserveClaudeSettings: false
      };

      await configManager.updateMigrationConfig(newConfig);

      const updatedConfig = configManager.getMigrationConfig();
      expect(updatedConfig.migrationCompleted).toBe(true);
      expect(updatedConfig.preserveClaudeSettings).toBe(false);
      expect(updatedConfig.backupOriginalFiles).toBe(true); // Should preserve existing values
    });

    test('should perform Claude Code migration', async () => {
      // Reset migration state first
      await configManager.updateMigrationConfig({ migrationCompleted: false });
      fs.existsSync.mockReturnValue(true);

      const result = await configManager.migrateFromClaudeCode();

      expect(result.success).toBe(true);
      expect(result.backupPath).toBeDefined();
      expect(vscode.workspace.fs.createDirectory).toHaveBeenCalled();
    });

    test('should skip migration if already completed', async () => {
      // Set migration as completed
      await configManager.updateMigrationConfig({ migrationCompleted: true });

      const result = await configManager.migrateFromClaudeCode();

      expect(result.success).toBe(true);
      expect(result.backupPath).toBeUndefined();
    });
  });

  describe('Approval Mode Management', () => {
    test('should set and get approval mode', async () => {
      await configManager.setApprovalMode(ApprovalMode.FullAuto);

      const mode = configManager.getApprovalMode();
      expect(mode).toBe(ApprovalMode.FullAuto);
    });
  });

  describe('Codex Availability Check', () => {
    test('should check Codex availability successfully', async () => {
      const mockProcess = {
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback(Buffer.from('codex version 1.2.3'));
            }
          })
        },
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            callback(0);
          }
        })
      };

      spawn.mockReturnValue(mockProcess);

      const result = await configManager.checkCodexAvailability();

      expect(result.available).toBe(true);
      expect(result.version).toBe('1.2.3');
    });

    test('should handle Codex unavailability', async () => {
      const mockProcess = {
        stdout: {
          on: jest.fn()
        },
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Command not found'));
          }
        })
      };

      spawn.mockReturnValue(mockProcess);

      const result = await configManager.checkCodexAvailability();

      expect(result.available).toBe(false);
      expect(result.error).toContain('Failed to execute Codex CLI');
    });
  });
});