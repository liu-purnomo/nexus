// Model client implementation
import { QueryBuilder, createQueryBuilder } from '../query';
import { DatabaseConnection, getConnection } from '../core';
import { ModelConfig, InferModelFields } from '../schema';
import { SchemaSync } from './schema-sync';

export class ModelClient<T extends ModelConfig> {
  private tableName: string;
  private db: DatabaseConnection;
  private modelConfig: T;

  constructor(modelName: string, modelConfig: T) {
    this.tableName = modelConfig.tableName || modelName.toLowerCase();
    this.modelConfig = modelConfig;
    this.db = getConnection();
  }

  async ensureTable(): Promise<void> {
    const sync = new SchemaSync(this.db);
    await sync.ensureTable(this.tableName, this.modelConfig);
  }

  query(): QueryBuilder<InferModelFields<T>> {
    return createQueryBuilder<InferModelFields<T>>(this.tableName);
  }

  async create(data: Partial<InferModelFields<T>>): Promise<InferModelFields<T>> {
    // Add timestamps if enabled
    const dataWithTimestamps = { ...data };
    if (this.modelConfig.timestamps) {
      const now = new Date();
      (dataWithTimestamps as any).created_at = now;
      (dataWithTimestamps as any).updated_at = now;
    }

    const fields = Object.keys(dataWithTimestamps);
    const values = Object.values(dataWithTimestamps);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
    
    const sql = `INSERT INTO ${this.tableName} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;
    
    const result = await this.db.query<InferModelFields<T>>(sql, values);
    if (result.length === 0) {
      throw new Error('Failed to create record');
    }
    return result[0]!;
  }

  async findById(id: any): Promise<InferModelFields<T> | null> {
    const primaryKey = this.getPrimaryKey();
    const sql = `SELECT * FROM ${this.tableName} WHERE ${primaryKey} = $1 LIMIT 1`;
    
    const result = await this.db.query<InferModelFields<T>>(sql, [id]);
    return result.length > 0 ? result[0]! : null;
  }

  async findAll(): Promise<InferModelFields<T>[]> {
    const sql = `SELECT * FROM ${this.tableName}`;
    return await this.db.query<InferModelFields<T>>(sql);
  }

  async update(id: any, data: Partial<InferModelFields<T>>): Promise<InferModelFields<T> | null> {
    // Add updated_at timestamp if enabled
    const dataWithTimestamps = { ...data };
    if (this.modelConfig.timestamps) {
      (dataWithTimestamps as any).updated_at = new Date();
    }

    const primaryKey = this.getPrimaryKey();
    const fields = Object.keys(dataWithTimestamps);
    const values = Object.values(dataWithTimestamps);
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    const sql = `UPDATE ${this.tableName} SET ${setClause} WHERE ${primaryKey} = $1 RETURNING *`;
    
    const result = await this.db.query<InferModelFields<T>>(sql, [id, ...values]);
    return result.length > 0 ? result[0]! : null;
  }

  async delete(id: any): Promise<boolean> {
    const primaryKey = this.getPrimaryKey();
    const sql = `DELETE FROM ${this.tableName} WHERE ${primaryKey} = $1`;
    
    try {
      await this.db.query(sql, [id]);
      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
    }
  }

  private getPrimaryKey(): string {
    const primaryKeyField = Object.entries(this.modelConfig.fields).find(
      ([, field]) => field.primaryKey
    );
    return primaryKeyField ? primaryKeyField[0] : 'id';
  }
}