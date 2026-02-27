-- ============================================================================
-- KKSRAG Initial Schema
-- Run this in your Supabase SQL Editor to create the required tables.
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Datasets ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    row_count INTEGER,
    column_count INTEGER,
    size_bytes BIGINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON datasets(user_id);

-- ─── Query History ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS query_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    question TEXT NOT NULL,
    sql TEXT NOT NULL,
    result_summary TEXT,
    row_count INTEGER,
    execution_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_query_history_user_id ON query_history(user_id);
CREATE INDEX IF NOT EXISTS idx_query_history_created ON query_history(created_at DESC);

-- ─── User Preferences ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    theme TEXT NOT NULL DEFAULT 'dark',
    default_chart_type TEXT NOT NULL DEFAULT 'bar',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- Note: Since we use SUPABASE_SERVICE_KEY (bypasses RLS), these policies
-- are a safety net for any future client-side Supabase usage.

ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Datasets: users can only access their own data
CREATE POLICY datasets_user_isolation ON datasets
    FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Query history: users can only access their own history
CREATE POLICY query_history_user_isolation ON query_history
    FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Preferences: users can only access their own preferences
CREATE POLICY preferences_user_isolation ON user_preferences
    FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- ─── Storage Bucket ─────────────────────────────────────────────────────────
-- Create the 'datasets' bucket for CSV file uploads.
-- Run this separately in the Supabase Dashboard > Storage if the INSERT fails:

INSERT INTO storage.buckets (id, name, public)
VALUES ('datasets', 'datasets', false)
ON CONFLICT (id) DO NOTHING;
