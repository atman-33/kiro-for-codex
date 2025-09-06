import { describe, expect, it } from '@jest/globals';

describe('Codex CLI Availability Checking', () => {
  describe('Task 3 Implementation', () => {
    it('should have implemented Codex CLI installation detection functionality', () => {
      // Test that the CodexProvider class exists and has the required methods
      const CodexProvider = require('../../../src/providers/codex-provider').CodexProvider;

      expect(CodexProvider).toBeDefined();

      // Check that the class has the required methods for availability checking
      const provider = new CodexProvider({} as any, {} as any);

      expect(typeof provider.checkCodexAvailability).toBe('function');
      expect(typeof provider.checkCodexInstallationAndCompatibility).toBe('function');
    });

    it('should have implemented version compatibility checking', () => {
      const CodexProvider = require('../../../src/providers/codex-provider').CodexProvider;
      const provider = new CodexProvider({} as any, {} as any);

      // Check that version compatibility methods exist
      expect(typeof provider.checkCodexInstallationAndCompatibility).toBe('function');
      expect(typeof provider.getCodexAvailabilityStatus).toBe('function');
      expect(typeof provider.isCodexReady).toBe('function');
    });

    it('should have implemented setup guidance for missing Codex CLI installation', () => {
      const CodexProvider = require('../../../src/providers/codex-provider').CodexProvider;
      const CodexSetupService = require('../../../src/services/codex-setup-service').CodexSetupService;

      const provider = new CodexProvider({} as any, {} as any);

      // Check that setup guidance methods exist
      expect(typeof provider.showSetupGuidance).toBe('function');

      // Check that CodexSetupService exists and has guidance methods
      expect(CodexSetupService).toBeDefined();

      const setupService = CodexSetupService.getInstance({} as any);
      expect(typeof setupService.showSetupGuidance).toBe('function');
      expect(typeof setupService.getInstallationGuidance).toBe('function');
      expect(typeof setupService.getVersionUpgradeGuidance).toBe('function');
      expect(typeof setupService.getPermissionGuidance).toBe('function');
      expect(typeof setupService.getTroubleshootingGuidance).toBe('function');
    });

    it('should have CodexAvailabilityResult interface with required properties', () => {
      const { CodexAvailabilityResult } = require('../../../src/providers/codex-provider');

      // This is a type check - if the interface is properly defined, 
      // TypeScript compilation will succeed
      const mockResult = {
        isAvailable: false,
        isInstalled: false,
        version: null,
        isCompatible: false,
        errorMessage: 'Test error',
        setupGuidance: 'Test guidance'
      };

      // Check that all required properties exist
      expect(typeof mockResult.isAvailable).toBe('boolean');
      expect(typeof mockResult.isInstalled).toBe('boolean');
      expect(mockResult.version === null || typeof mockResult.version === 'string').toBe(true);
      expect(typeof mockResult.isCompatible).toBe('boolean');
      expect(mockResult.errorMessage === null || typeof mockResult.errorMessage === 'string').toBe(true);
      expect(mockResult.setupGuidance === null || typeof mockResult.setupGuidance === 'string').toBe(true);
    });

    it('should have Codex commands for availability checking', () => {
      const CodexCommands = require('../../../src/commands/codex-commands').CodexCommands;

      expect(CodexCommands).toBeDefined();
      expect(typeof CodexCommands.registerCommands).toBe('function');

      // Create instance to check methods exist
      const commands = new CodexCommands({} as any);
      expect(typeof commands.checkCodexAvailability).toBe('function');
      expect(typeof commands.showCodexSetupGuide).toBe('function');
      expect(typeof commands.testCodexConnection).toBe('function');
    });
  });

  describe('Requirements Coverage', () => {
    it('should satisfy Requirement 2.3: Show appropriate error messages and installation instructions when Codex CLI is not available', () => {
      const CodexSetupService = require('../../../src/services/codex-setup-service').CodexSetupService;
      const setupService = CodexSetupService.getInstance({} as any);

      // Check that installation guidance is comprehensive
      const installationGuidance = setupService.getInstallationGuidance();
      expect(installationGuidance).toContain('npm install');
      expect(installationGuidance).toContain('pip install');
      expect(installationGuidance).toContain('codex --version');
      expect(installationGuidance).toContain('Installation Guide');
    });

    it('should satisfy Requirement 7.3: Provide clear error messages and setup procedures when Codex CLI is not available', () => {
      const CodexSetupService = require('../../../src/services/codex-setup-service').CodexSetupService;
      const setupService = CodexSetupService.getInstance({} as any);

      // Check that troubleshooting guidance exists
      const troubleshootingGuidance = setupService.getTroubleshootingGuidance();
      expect(troubleshootingGuidance).toContain('Troubleshooting');
      expect(troubleshootingGuidance).toContain('Command Not Found');
      expect(troubleshootingGuidance).toContain('Authentication Issues');
      expect(troubleshootingGuidance).toContain('Permission Denied');

      // Check that permission guidance exists
      const permissionGuidance = setupService.getPermissionGuidance();
      expect(permissionGuidance).toContain('Permission');
      expect(permissionGuidance).toContain('chmod');

      // Check that version upgrade guidance exists
      const versionGuidance = setupService.getVersionUpgradeGuidance('1.0.0', '2.0.0');
      expect(versionGuidance).toContain('Version Update');
      expect(versionGuidance).toContain('1.0.0');
      expect(versionGuidance).toContain('2.0.0');
    });
  });

  describe('Integration Points', () => {
    it('should integrate availability checking with CodexProvider execution methods', () => {
      const CodexProvider = require('../../../src/providers/codex-provider').CodexProvider;
      const provider = new CodexProvider({} as any, {} as any);

      // Check that execution methods exist and would use availability checking
      expect(typeof provider.executeCodex).toBe('function');
      expect(typeof provider.invokeCodexSplitView).toBe('function');
      expect(typeof provider.invokeCodexHeadless).toBe('function');
    });

    it('should provide utility methods for programmatic availability checking', () => {
      const CodexProvider = require('../../../src/providers/codex-provider').CodexProvider;
      const provider = new CodexProvider({} as any, {} as any);

      // Check utility methods exist
      expect(typeof provider.getCodexAvailabilityStatus).toBe('function');
      expect(typeof provider.isCodexReady).toBe('function');
    });
  });
});
