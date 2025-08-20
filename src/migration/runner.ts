// Migration runner and state management
import { Migration, MigrationResult, MigrationState } from './types';
import { DatabaseConnection } from '../core/connection';
import { MigrationGenerator } from './generator';

export class MigrationRunner {
  private db: DatabaseConnection;
  private generator: MigrationGenerator;
  private migrationsTable: string = 'nexus_migrations';

  constructor(db: DatabaseConnection) {
    this.db = db;
    this.generator = new MigrationGenerator();
  }

  async initialize(): Promise<void> {
    await this.ensureMigrationsTable();
  }

  private async ensureMigrationsTable(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time INTEGER NOT NULL
      );
    `;
    
    await this.db.query(sql);
  }

  async getAppliedMigrations(): Promise<string[]> {
    const result = await this.db.query<{ id: string }>(
      `SELECT id FROM ${this.migrationsTable} ORDER BY applied_at ASC`
    );
    return result.map(row => row.id);
  }

  async getMigrationState(): Promise<MigrationState> {
    const applied = await this.getAppliedMigrations();
    const lastMigration = applied.length > 0 ? applied[applied.length - 1]! : null;
    
    let lastMigrationDate = new Date();
    if (lastMigration) {
      const result = await this.db.query<{ applied_at: Date }>(
        `SELECT applied_at FROM ${this.migrationsTable} WHERE id = $1`,
        [lastMigration]
      );
      if (result.length > 0) {
        lastMigrationDate = result[0]!.applied_at;
      }
    }

    return {
      appliedMigrations: applied,
      currentVersion: lastMigration || '0.0.0',
      lastMigrationDate,
    };
  }

  async runMigration(migration: Migration): Promise<MigrationResult> {
    const startTime = Date.now();
    
    try {
      // Check if migration is already applied
      const appliedMigrations = await this.getAppliedMigrations();
      if (appliedMigrations.includes(migration.id)) {
        return {
          success: true,
          migrationId: migration.id,
          executionTime: 0,
        };
      }

      await this.db.transaction(async (client) => {
        // Execute all up operations
        for (const operation of migration.up) {
          const sqls = this.generator.operationToSQL(operation);
          for (const sql of sqls) {
            await client.query(sql);
          }
        }

        // Record migration as applied
        await client.query(
          `INSERT INTO ${this.migrationsTable} (id, name, applied_at, execution_time) VALUES ($1, $2, $3, $4)`,
          [migration.id, migration.name, new Date(), Date.now() - startTime]
        );
      });

      return {
        success: true,
        migrationId: migration.id,
        executionTime: Date.now() - startTime,
      };

    } catch (error) {
      return {
        success: false,
        migrationId: migration.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  }

  async rollbackMigration(migration: Migration): Promise<MigrationResult> {
    const startTime = Date.now();
    
    try {
      // Check if migration is applied
      const appliedMigrations = await this.getAppliedMigrations();
      if (!appliedMigrations.includes(migration.id)) {
        return {
          success: true,
          migrationId: migration.id,
          executionTime: 0,
        };
      }

      await this.db.transaction(async (client) => {
        // Execute all down operations
        for (const operation of migration.down) {
          const sqls = this.generator.operationToSQL(operation);
          for (const sql of sqls) {
            await client.query(sql);
          }
        }

        // Remove migration record
        await client.query(
          `DELETE FROM ${this.migrationsTable} WHERE id = $1`,
          [migration.id]
        );
      });

      return {
        success: true,
        migrationId: migration.id,
        executionTime: Date.now() - startTime,
      };

    } catch (error) {
      return {
        success: false,
        migrationId: migration.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  }

  async runPendingMigrations(migrations: Migration[]): Promise<MigrationResult[]> {
    const appliedMigrations = await this.getAppliedMigrations();
    const pendingMigrations = migrations.filter(m => !appliedMigrations.includes(m.id));
    
    const results: MigrationResult[] = [];
    
    for (const migration of pendingMigrations) {
      const result = await this.runMigration(migration);
      results.push(result);
      
      if (!result.success) {
        console.error(`Migration ${migration.id} failed: ${result.error}`);
        break; // Stop on first failure
      }
    }
    
    return results;
  }

  async rollbackToMigration(targetMigrationId: string, migrations: Migration[]): Promise<MigrationResult[]> {
    const appliedMigrations = await this.getAppliedMigrations();
    const targetIndex = appliedMigrations.indexOf(targetMigrationId);
    
    if (targetIndex === -1) {
      throw new Error(`Migration ${targetMigrationId} not found in applied migrations`);
    }

    const migrationsToRollback = appliedMigrations.slice(targetIndex + 1).reverse();
    const results: MigrationResult[] = [];
    
    for (const migrationId of migrationsToRollback) {
      const migration = migrations.find(m => m.id === migrationId);
      if (!migration) {
        throw new Error(`Migration ${migrationId} definition not found`);
      }
      
      const result = await this.rollbackMigration(migration);
      results.push(result);
      
      if (!result.success) {
        console.error(`Rollback of migration ${migrationId} failed: ${result.error}`);
        break;
      }
    }
    
    return results;
  }
}