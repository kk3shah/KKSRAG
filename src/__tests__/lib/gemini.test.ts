import { describe, it, expect } from 'vitest';
import { SQL_PROMPT, EXPLAIN_PROMPT, type ConversationTurn } from '@/lib/gemini';

describe('SQL_PROMPT generation', () => {
    const schema = 'Table: users\nColumns: id (INTEGER), name (VARCHAR), age (INTEGER)';

    it('includes schema in prompt', () => {
        const prompt = SQL_PROMPT(schema, 'How many users?');
        expect(prompt).toContain('Table: users');
        expect(prompt).toContain('id (INTEGER)');
    });

    it('includes user question', () => {
        const prompt = SQL_PROMPT(schema, 'Show top 5 oldest users');
        expect(prompt).toContain('Show top 5 oldest users');
    });

    it('includes JSON format instructions', () => {
        const prompt = SQL_PROMPT(schema, 'test');
        expect(prompt).toContain('"sql"');
        expect(prompt).toContain('"chart_type"');
        expect(prompt).toContain('"x_axis"');
        expect(prompt).toContain('"y_axis"');
    });

    it('includes DuckDB-specific guidelines', () => {
        const prompt = SQL_PROMPT(schema, 'test');
        expect(prompt).toContain('DuckDB SQL Guidelines');
        expect(prompt).toContain('double-quotes');
        expect(prompt).toContain('ILIKE');
        expect(prompt).toContain('TRY_CAST');
    });

    it('includes few-shot examples', () => {
        const prompt = SQL_PROMPT(schema, 'test');
        expect(prompt).toContain('Few-Shot Examples');
        expect(prompt).toContain('monthly revenue trend');
        expect(prompt).toContain('Top 5 products');
    });

    it('includes conversation history when provided', () => {
        const history: ConversationTurn[] = [
            { role: 'user', content: 'How many users?', sql: 'SELECT COUNT(*) FROM users' },
            { role: 'assistant', content: 'There are 100 users.' },
        ];
        const prompt = SQL_PROMPT(schema, 'Break that down by age', history);
        expect(prompt).toContain('Conversation History');
        expect(prompt).toContain('How many users?');
        expect(prompt).toContain('SELECT COUNT(*) FROM users');
    });

    it('omits history block when no history provided', () => {
        const prompt = SQL_PROMPT(schema, 'test');
        expect(prompt).not.toContain('Conversation History');
    });

    it('omits history block for empty array', () => {
        const prompt = SQL_PROMPT(schema, 'test', []);
        expect(prompt).not.toContain('Conversation History');
    });
});

describe('EXPLAIN_PROMPT generation', () => {
    it('includes the data', () => {
        const prompt = EXPLAIN_PROMPT('[{"count": 42}]', 'How many users?');
        expect(prompt).toContain('42');
    });

    it('includes the question', () => {
        const prompt = EXPLAIN_PROMPT('[]', 'How many users?');
        expect(prompt).toContain('How many users?');
    });

    it('requests JSON format', () => {
        const prompt = EXPLAIN_PROMPT('[]', 'test');
        expect(prompt).toContain('"summary"');
        expect(prompt).toContain('"suggestions"');
    });
});
