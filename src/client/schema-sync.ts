// Schema synchronization utilities
import { DatabaseConnection } from '../core';
import { ModelConfig, FieldConfig } from '../schema';
import { MigrationGenerator } from '../migration';

export class SchemaSync {
  private db: DatabaseConnection;
  private generator: MigrationGenerator;

  constructor(db: DatabaseConnection) {
    this.db = db;
    this.generator = new MigrationGenerator();
  }

  async createTableFromModel(tableName: string, modelConfig: ModelConfig): Promise<void> {
    const fields = { ...modelConfig.fields };
    
    // Add timestamps if enabled
    if (modelConfig.timestamps) {
      fields.created_at = { 
        type: 'date', 
        nullable: false, 
        default: 'CURRENT_TIMESTAMP' 
      };
      fields.updated_at = { 
        type: 'date', 
        nullable: false, 
        default: 'CURRENT_TIMESTAMP' 
      };
    }

    const operation = this.generator.generateCreateTable(tableName, fields);
    const sqls = this.generator.operationToSQL(operation);
    
    for (const sql of sqls) {
      await this.db.query(sql);
    }
  }

  async tableExists(tableName: string): Promise<boolean> {
    const sql = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `;
    
    const result = await this.db.query<{ exists: boolean }>(sql, [tableName]);
    return result[0]?.exists || false;
  }

  async ensureTable(tableName: string, modelConfig: ModelConfig): Promise<void> {
    const exists = await this.tableExists(tableName);
    if (!exists) {
      console.log(`Creating table: ${tableName}`);
      await this.createTableFromModel(tableName, modelConfig);
    }
  }
}