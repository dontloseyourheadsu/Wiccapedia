-- Database initialization script for Wiccapedia
-- This will be executed automatically when PostgreSQL container starts

-- Enable UUID extension
CREATE EXTENSION
IF NOT EXISTS "uuid-ossp";

-- Create gems table
CREATE TABLE
IF NOT EXISTS gems
(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4
(),
    name VARCHAR
(255) NOT NULL,
    image VARCHAR
(500) NOT NULL,
    magical_description TEXT NOT NULL,
    category VARCHAR
(100) NOT NULL,
    color VARCHAR
(100) NOT NULL,
    chemical_formula VARCHAR
(200) NOT NULL,
    created_at TIMESTAMP
WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX
IF NOT EXISTS idx_gems_name ON gems
(name);
CREATE INDEX
IF NOT EXISTS idx_gems_category ON gems
(category);
CREATE INDEX
IF NOT EXISTS idx_gems_color ON gems
(color);
CREATE INDEX
IF NOT EXISTS idx_gems_chemical_formula ON gems
(chemical_formula);
CREATE INDEX
IF NOT EXISTS idx_gems_created_at ON gems
(created_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column
()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_gems_updated_at
ON gems;
CREATE TRIGGER update_gems_updated_at
    BEFORE
UPDATE ON gems
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column
();

-- Create a function for full-text search
CREATE OR REPLACE FUNCTION search_gems
(search_term TEXT)
RETURNS TABLE
(
    id UUID,
    name VARCHAR
(255),
    image VARCHAR
(500),
    magical_description TEXT,
    category VARCHAR
(100),
    color VARCHAR
(100),
    chemical_formula VARCHAR
(200),
    created_at TIMESTAMP
WITH TIME ZONE,
    updated_at TIMESTAMP
WITH TIME ZONE,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.id,
        g.name,
        g.image,
        g.magical_description,
        g.category,
        g.color,
        g.chemical_formula,
        g.created_at,
        g.updated_at,
        ts_rank(
            to_tsvector('spanish', g.name || ' ' || g.magical_description || ' ' || g.category || ' ' || g.color),
            plainto_tsquery('spanish', search_term)
        ) as rank
    FROM gems g
    WHERE to_tsvector('spanish', g.name || ' ' || g.magical_description || ' ' || g.category || ' ' || g.color)
    @@ plainto_tsquery
    ('spanish', search_term)
    ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions to the application user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO wiccapedia_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO wiccapedia_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO wiccapedia_user;
