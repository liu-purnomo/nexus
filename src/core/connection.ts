// PostgreSQL connection management
import { Pool, PoolClient, PoolConfig } from 'pg';

export interface DatabaseConfig extends PoolConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | object;
}

export class DatabaseConnection {
  private pool: Pool;
  private isConnected: boolean = false;

  constructor(config: DatabaseConfig) {
    this.pool = new Pool(config);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.pool.on('connect', () => {
      this.isConnected = true;
    });

    this.pool.on('error', (err) => {
      console.error('Database pool error:', err);
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      client.release();
      this.isConnected = true;
      console.log('Database connected successfully');
    } catch (error) {
      this.isConnected = false;
      throw new Error(`Failed to connect to database: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.pool.end();
      this.isConnected = false;
      console.log('Database disconnected');
    } catch (error) {
      throw new Error(`Failed to disconnect from database: ${error}`);
    }
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      const result = await this.pool.query(sql, params);
      return result.rows;
    } catch (error) {
      throw new Error(`Query failed: ${error}`);
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  getPool(): Pool {
    return this.pool;
  }

  isHealthy(): boolean {
    return this.isConnected && this.pool.totalCount > 0;
  }
}

// Singleton database connection
let dbInstance: DatabaseConnection | null = null;

export const createConnection = (config: DatabaseConfig): DatabaseConnection => {
  if (dbInstance) {
    throw new Error('Database connection already exists');
  }
  
  dbInstance = new DatabaseConnection(config);
  return dbInstance;
};

export const getConnection = (): DatabaseConnection => {
  if (!dbInstance) {
    throw new Error('Database connection not initialized. Call createConnection() first.');
  }
  return dbInstance;
};

export const resetConnection = (): void => {
  dbInstance = null;
};