-- Create the application user
CREATE USER wicca_app
WITH PASSWORD 'abc123=0';

-- Grant connection permission to the database
GRANT CONNECT ON DATABASE "WiccapediaDb" TO wicca_app;

-- Switch to the database to grant schema permissions
\c "WiccapediaDb"

-- Grant usage on public schema
GRANT USAGE ON SCHEMA public TO wicca_app;

-- Grant privileges on existing tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO wicca_app;
GRANT SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO wicca_app;

-- Ensure the user gets privileges on future tables created by the admin
ALTER DEFAULT PRIVILEGES FOR ROLE wicca_admin IN SCHEMA public
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO wicca_app;
ALTER DEFAULT PRIVILEGES FOR ROLE wicca_admin IN SCHEMA public
GRANT SELECT, UPDATE ON SEQUENCES TO wicca_app;
