// Database setup script for Nexus ORM examples
const { Client } = require('pg');

async function setupDatabases() {
  // Connect to PostgreSQL server (not to a specific database)
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres' // Connect to default postgres database
  });

  try {
    console.log('🔗 Connecting to PostgreSQL server...');
    await client.connect();
    
    // Check if databases exist, if not create them
    const databases = ['nexus_example', 'nexus_migration_example'];
    
    for (const dbName of databases) {
      console.log(`📂 Checking database: ${dbName}`);
      
      const checkResult = await client.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [dbName]
      );
      
      if (checkResult.rows.length === 0) {
        console.log(`✨ Creating database: ${dbName}`);
        await client.query(`CREATE DATABASE "${dbName}"`);
      } else {
        console.log(`✅ Database already exists: ${dbName}`);
      }
    }
    
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure PostgreSQL is running on localhost:5432');
      console.log('   You can start it with: pg_ctl -D /usr/local/var/postgres start');
    }
    
  } finally {
    await client.end();
  }
}

// Run the setup
setupDatabases();