import { describe, test, expect } from 'vitest';
import * as fs from 'fs';

describe('package.json menus', () => {
  test('adds inline Run Prompt for Prompts view items', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const menus = pkg?.contributes?.menus?.['view/item/context'] || [];
    const entry = menus.find((m: any) => m.command === 'kiroCodex.prompts.run');
    expect(entry).toBeTruthy();
    expect(entry.when).toContain('kiroCodex.views.promptsExplorer');
    expect(entry.group).toBe('inline');
  });
});
