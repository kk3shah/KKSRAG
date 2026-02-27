import { describe, it, expect, vi } from 'vitest';

// Mock DOM APIs
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
    clipboard: { writeText: mockWriteText },
});

describe('Export utilities', () => {
    let copyToClipboard: (text: string) => Promise<void>;

    beforeEach(async () => {
        vi.resetModules();
        mockWriteText.mockClear();
        const mod = await import('@/lib/export');
        copyToClipboard = mod.copyToClipboard;
    });

    describe('copyToClipboard', () => {
        it('copies text to clipboard', async () => {
            await copyToClipboard('SELECT * FROM users');
            expect(mockWriteText).toHaveBeenCalledWith('SELECT * FROM users');
        });
    });
});
