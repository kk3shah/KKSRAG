/**
 * AI Provider abstraction — allows swapping Gemini for OpenAI, Anthropic, etc.
 */

export interface AIProvider {
    name: string;
    generateText(prompt: string): Promise<string>;
}

// ─── Gemini Provider ─────────────────────────────────────────────────────────

let geminiProvider: AIProvider | null = null;

export function getGeminiProvider(): AIProvider {
    if (!geminiProvider) {
        geminiProvider = {
            name: 'gemini-2.0-flash',
            async generateText(prompt: string): Promise<string> {
                // Lazy import to avoid build-time errors
                const { GoogleGenerativeAI } = await import('@google/generative-ai');
                const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
                if (!apiKey) {
                    throw new Error('GOOGLE_GEMINI_API_KEY is not set. See .env.example.');
                }
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
                const result = await model.generateContent(prompt);
                return result.response.text().trim();
            },
        };
    }
    return geminiProvider;
}

// ─── Default provider selection ──────────────────────────────────────────────

export function getAIProvider(): AIProvider {
    // Future: check env vars to pick OpenAI, Anthropic, etc.
    return getGeminiProvider();
}
