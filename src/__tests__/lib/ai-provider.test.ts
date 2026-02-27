import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use a proper class mock so `new GoogleGenerativeAI()` works
class MockGoogleGenerativeAI {
    getGenerativeModel() {
        return {
            generateContent: async () => ({
                response: {
                    text: () => '{"sql": "SELECT 1", "chart_type": "none", "x_axis": "", "y_axis": ""}',
                },
            }),
        };
    }
}

vi.mock('@google/generative-ai', () => ({
    GoogleGenerativeAI: MockGoogleGenerativeAI,
}));

vi.mock('@/lib/logger', () => ({
    log: vi.fn(),
}));

describe('AI Provider', () => {
    beforeEach(() => {
        vi.resetModules();
        process.env.GOOGLE_GEMINI_API_KEY = 'test-key';
    });

    it('returns a provider with name', async () => {
        const { getAIProvider } = await import('@/lib/ai/provider');
        const provider = getAIProvider();
        expect(provider.name).toBeDefined();
        expect(typeof provider.name).toBe('string');
    });

    it('provider has generateText method', async () => {
        const { getAIProvider } = await import('@/lib/ai/provider');
        const provider = getAIProvider();
        expect(typeof provider.generateText).toBe('function');
    });

    it('generateText returns string', async () => {
        const { getAIProvider } = await import('@/lib/ai/provider');
        const provider = getAIProvider();
        const result = await provider.generateText('test prompt');
        expect(typeof result).toBe('string');
    });
});

describe('AI Retry', () => {
    beforeEach(() => {
        vi.resetModules();
        process.env.GOOGLE_GEMINI_API_KEY = 'test-key';
    });

    it('returns fixed SQL on success', async () => {
        const { retrySqlGeneration } = await import('@/lib/ai/retry');
        const result = await retrySqlGeneration(
            'Table: users\nColumns: id, name',
            'count users',
            'SELECT CONT(*) FROM users',
            'Function CONT not found',
        );
        expect(result).not.toBeNull();
        expect(result?.sql).toBeDefined();
        expect(result?.wasRetried).toBe(true);
    });
});
