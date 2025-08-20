-- Setup script for Nexus ORM test databases

-- Create test databases
CREATE DATABASE IF NOT EXISTS nexus_example;
CREATE DATABASE IF NOT EXISTS nexus_migration_example;

-- Connect to nexus_example and create basic structure if needed
\c nexus_example;

-- Grant permissions (adjust user as needed)
-- GRANT ALL PRIVILEGES ON DATABASE nexus_example TO postgres;

-- Connect to nexus_migration_example  
\c nexus_migration_example;

-- Grant permissions (adjust user as needed)
-- GRANT ALL PRIVILEGES ON DATABASE nexus_migration_example TO postgres;