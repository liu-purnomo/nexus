// Migration system types
import { FieldConfig } from '../schema/types';

export interface Migration {
  id: string;
  name: string;
  timestamp: Date;
  up: MigrationOperation[];
  down: MigrationOperation[];
}

export interface MigrationOperation {
  type: 'CREATE_TABLE' | 'DROP_TABLE' | 'ALTER_TABLE' | 'ADD_COLUMN' | 'DROP_COLUMN' | 'MODIFY_COLUMN' | 'ADD_INDEX' | 'DROP_INDEX';
  table: string;
  column?: string;
  field?: FieldConfig | Record<string, FieldConfig>;
  index?: IndexDefinition;
  oldField?: FieldConfig;
  newField?: FieldConfig;
}

export interface IndexDefinition {
  name: string;
  columns: string[];
  unique?: boolean;
  type?: 'BTREE' | 'HASH' | 'GIN' | 'GIST';
}

export interface MigrationState {
  appliedMigrations: string[];
  currentVersion: string;
  lastMigrationDate: Date;
}

export interface MigrationResult {
  success: boolean;
  migrationId: string;
  error?: string;
  executionTime: number;
}

export interface SchemaDiff {
  newTables: string[];
  droppedTables: string[];
  modifiedTables: {
    table: string;
    newColumns: { [key: string]: FieldConfig };
    droppedColumns: string[];
    modifiedColumns: { 
      [key: string]: { 
        old: FieldConfig; 
        new: FieldConfig; 
      } 
    };
  }[];
}