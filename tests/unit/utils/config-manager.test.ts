import { ConfigManager, KfcSettings } from '../../../src/utils/config-manager';

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
    getConfiguration: jest.fn(() => ({ get: jest.fn() }))
  },
  Uri: {
    file: jest.fn((path: string) => ({ fsPath: path }))
  }
}));

describe('ConfigManager (paths-only settings)', () => {
  let configManager: ConfigManager;
  const vscode = require('vscode');

  beforeEach(() => {
    jest.clearAllMocks();
    configManager = ConfigManager.getInstance();
  });

  test('returns default paths when file missing', async () => {
    // Simulate file not found
    (vscode.workspace.fs.readFile as jest.Mock).mockRejectedValueOnce(new Error('ENOENT'));

    const settings = await configManager.loadSettings();

    expect(settings.paths).toEqual({
      specs: '.codex/specs',
      steering: '.codex/steering',
      settings: '.codex/settings',
      prompts: '.codex/prompts'
    });
  });

  test('merges paths from existing file', async () => {
    const fileContent: KfcSettings = {
      paths: {
        specs: 'custom/specs',
        steering: '.codex/steering',
        settings: '.codex/settings',
        prompts: '.codex/prompts'
      }
    };
    (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValueOnce(
      Buffer.from(JSON.stringify(fileContent))
    );

    const settings = await configManager.loadSettings();
    expect(settings.paths.specs).toBe('custom/specs');
    // Unchanged keys fallback to defaults via merge
    expect(settings.paths.prompts).toBe('.codex/prompts');
  });

  test('getPath returns overridden or default value', async () => {
    // Reset to defaults for this test
    (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValueOnce(Buffer.from('{}'));
    await configManager.loadSettings();

    const specs = configManager.getPath('specs');
    const prompts = configManager.getPath('prompts');
    expect(specs).toBe('.codex/specs');
    expect(prompts).toBe('.codex/prompts');
  });

  test('saveSettings writes only paths object', async () => {
    const newSettings: KfcSettings = {
      paths: {
        specs: 's',
        steering: 't',
        settings: 'u',
        prompts: 'v'
      }
    };

    await configManager.saveSettings(newSettings);

    expect(vscode.workspace.fs.writeFile).toHaveBeenCalled();
    const [, content] = (vscode.workspace.fs.writeFile as jest.Mock).mock.calls[0];
    const saved = JSON.parse(Buffer.from(content).toString());
    expect(Object.keys(saved)).toEqual(['paths']);
    expect(saved.paths).toEqual(newSettings.paths);
  });

  test('getAbsolutePath builds from workspace root', async () => {
    // Reset to defaults for this test
    (vscode.workspace.fs.readFile as jest.Mock).mockResolvedValueOnce(Buffer.from('{}'));
    await configManager.loadSettings();

    const abs = configManager.getAbsolutePath('prompts');
    expect(abs).toBe('/test/workspace/.codex/prompts');
  });
});
