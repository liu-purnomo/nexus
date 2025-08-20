// Example: Migration usage with Nexus ORM
import { createConnection } from '../src/core';
import { MigrationGenerator, MigrationRunner } from '../src/migration';

async function migrationExample() {
  // Database configuration
  const dbConfig = {
    host: 'localhost',
    port: 5432,
    database: 'nexus_migration_example',
    user: 'postgres',
    password: 'postgres',
  };

  try {
    // Initialize database connection
    const db = createConnection(dbConfig);
    await db.connect();

    // Initialize migration runner
    const runner = new MigrationRunner(db);
    await runner.initialize();

    const generator = new MigrationGenerator();

    console.log('🚀 Starting migration example...');

    // Create initial migration for users table
    console.log('📝 Creating users table migration...');
    const createUsersMigration = generator.generateMigrationFromDiff(
      {
        newTables: ['users'],
        droppedTables: [],
        modifiedTables: [],
      },
      'create_users_table'
    );

    // Run the migration
    const result1 = await runner.runMigration(createUsersMigration);
    console.log('✅ Users table migration result:', result1);

    // Create migration for posts table
    console.log('📝 Creating posts table migration...');
    const createPostsMigration = generator.generateMigrationFromDiff(
      {
        newTables: ['posts'],
        droppedTables: [],
        modifiedTables: [],
      },
      'create_posts_table'
    );

    const result2 = await runner.runMigration(createPostsMigration);
    console.log('✅ Posts table migration result:', result2);

    // Create migration to add email column to users
    console.log('📝 Adding email column to users...');
    const addEmailMigration = generator.generateMigrationFromDiff(
      {
        newTables: [],
        droppedTables: [],
        modifiedTables: [
          {
            table: 'users',
            newColumns: {
              email: { type: 'string', unique: true, nullable: false },
            },
            droppedColumns: [],
            modifiedColumns: {},
          },
        ],
      },
      'add_email_to_users'
    );

    const result3 = await runner.runMigration(addEmailMigration);
    console.log('✅ Add email column result:', result3);

    // Check migration state
    console.log('📊 Checking migration state...');
    const state = await runner.getMigrationState();
    console.log('Current migration state:', state);

    // Get applied migrations
    const appliedMigrations = await runner.getAppliedMigrations();
    console.log('Applied migrations:', appliedMigrations);

    // Example: Rollback last migration
    console.log('🔄 Rolling back last migration...');
    const rollbackResult = await runner.rollbackMigration(addEmailMigration);
    console.log('✅ Rollback result:', rollbackResult);

    // Final state check
    const finalState = await runner.getMigrationState();
    console.log('Final migration state:', finalState);

    console.log('🎉 Migration example completed successfully!');

    await db.disconnect();
  } catch (error) {
    console.error('❌ Migration example failed:', error);
  }
}

// Example of creating a complete migration manually
function createCustomMigration() {
  console.log('🛠️ Creating custom migration...');

  const customMigration = {
    id: 'custom_20241201_123456_abc',
    name: 'add_user_preferences',
    timestamp: new Date(),
    up: [
      {
        type: 'ADD_COLUMN' as const,
        table: 'users',
        column: 'preferences',
        field: {
          type: 'json' as const,
          nullable: true,
          default: '{}',
        },
      },
      {
        type: 'ADD_COLUMN' as const,
        table: 'users',
        column: 'last_login',
        field: {
          type: 'date' as const,
          nullable: true,
        },
      },
    ],
    down: [
      {
        type: 'DROP_COLUMN' as const,
        table: 'users',
        column: 'last_login',
      },
      {
        type: 'DROP_COLUMN' as const,
        table: 'users',
        column: 'preferences',
      },
    ],
  };

  console.log('Custom migration created:', customMigration);
  return customMigration;
}

// Run the example
if (require.main === module) {
  migrationExample().catch(console.error);

  // Also show custom migration example
  createCustomMigration();
}
