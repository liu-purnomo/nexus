// Migration generator and SQL builder
import { Migration, MigrationOperation, IndexDefinition, SchemaDiff } from './types';
import { FieldConfig, SchemaDefinition } from '../schema/types';

export class MigrationGenerator {
  
  generateCreateTable(tableName: string, fields: Record<string, FieldConfig>): MigrationOperation {
    return {
      type: 'CREATE_TABLE',
      table: tableName,
      field: fields,
    };
  }

  generateDropTable(tableName: string): MigrationOperation {
    return {
      type: 'DROP_TABLE',
      table: tableName,
    };
  }

  generateAddColumn(tableName: string, columnName: string, field: FieldConfig): MigrationOperation {
    return {
      type: 'ADD_COLUMN',
      table: tableName,
      column: columnName,
      field,
    };
  }

  generateDropColumn(tableName: string, columnName: string): MigrationOperation {
    return {
      type: 'DROP_COLUMN',
      table: tableName,
      column: columnName,
    };
  }

  generateModifyColumn(tableName: string, columnName: string, oldField: FieldConfig, newField: FieldConfig): MigrationOperation {
    return {
      type: 'MODIFY_COLUMN',
      table: tableName,
      column: columnName,
      oldField,
      newField,
    };
  }

  // Generate migration from schema diff
  generateMigrationFromDiff(diff: SchemaDiff, name: string): Migration {
    const operations: MigrationOperation[] = [];
    const reverseOperations: MigrationOperation[] = [];

    // Handle new tables - create basic table structure
    diff.newTables.forEach(tableName => {
      const basicFields: Record<string, FieldConfig> = {
        id: { type: 'number', primaryKey: true, autoIncrement: true },
        created_at: { type: 'date', nullable: false, default: 'CURRENT_TIMESTAMP' },
        updated_at: { type: 'date', nullable: false, default: 'CURRENT_TIMESTAMP' }
      };
      operations.push(this.generateCreateTable(tableName, basicFields));
      reverseOperations.unshift(this.generateDropTable(tableName));
    });

    // Handle dropped tables
    diff.droppedTables.forEach(tableName => {
      operations.push(this.generateDropTable(tableName));
      reverseOperations.unshift(this.generateCreateTable(tableName, {}));
    });

    // Handle modified tables
    diff.modifiedTables.forEach(tableChange => {
      const { table, newColumns, droppedColumns, modifiedColumns } = tableChange;

      // Add new columns
      Object.entries(newColumns).forEach(([columnName, field]) => {
        operations.push(this.generateAddColumn(table, columnName, field));
        reverseOperations.unshift(this.generateDropColumn(table, columnName));
      });

      // Drop columns
      droppedColumns.forEach(columnName => {
        operations.push(this.generateDropColumn(table, columnName));
        // Note: Reverse operation would need the original field definition
      });

      // Modify columns
      Object.entries(modifiedColumns).forEach(([columnName, { old, new: newField }]) => {
        operations.push(this.generateModifyColumn(table, columnName, old, newField));
        reverseOperations.unshift(this.generateModifyColumn(table, columnName, newField, old));
      });
    });

    return {
      id: this.generateMigrationId(),
      name,
      timestamp: new Date(),
      up: operations,
      down: reverseOperations,
    };
  }

  // Convert migration operations to SQL
  operationToSQL(operation: MigrationOperation): string[] {
    switch (operation.type) {
      case 'CREATE_TABLE':
        return this.createTableSQL(operation.table, (operation.field as Record<string, FieldConfig>) || {});
      
      case 'DROP_TABLE':
        return [`DROP TABLE IF EXISTS ${operation.table};`];
      
      case 'ADD_COLUMN':
        if (!operation.column || !operation.field) {
          throw new Error('ADD_COLUMN operation requires column name and field definition');
        }
        if (typeof operation.field === 'object' && 'type' in operation.field) {
          return [`ALTER TABLE ${operation.table} ADD COLUMN ${this.fieldToSQL(operation.column, operation.field as FieldConfig)};`];
        }
        throw new Error('Invalid field configuration for ADD_COLUMN');
      
      case 'DROP_COLUMN':
        if (!operation.column) {
          throw new Error('DROP_COLUMN operation requires column name');
        }
        return [`ALTER TABLE ${operation.table} DROP COLUMN ${operation.column};`];
      
      case 'MODIFY_COLUMN':
        if (!operation.column || !operation.newField) {
          throw new Error('MODIFY_COLUMN operation requires column name and new field definition');
        }
        return this.modifyColumnSQL(operation.table, operation.column, operation.newField);
      
      default:
        throw new Error(`Unsupported migration operation: ${operation.type}`);
    }
  }

  private createTableSQL(tableName: string, fields: Record<string, FieldConfig>): string[] {
    const columns = Object.entries(fields)
      .map(([name, field]) => this.fieldToSQL(name, field))
      .join(',\n  ');
    
    const primaryKeys = Object.entries(fields)
      .filter(([, field]) => field.primaryKey)
      .map(([name]) => name);

    let sql = `CREATE TABLE ${tableName} (\n  ${columns}`;
    
    if (primaryKeys.length > 0) {
      sql += `,\n  PRIMARY KEY (${primaryKeys.join(', ')})`;
    }
    
    sql += '\n);';
    
    return [sql];
  }

  private fieldToSQL(columnName: string, field: FieldConfig): string {
    let sql = `${columnName} ${this.getPostgreSQLType(field)}`;
    
    if (!field.nullable) {
      sql += ' NOT NULL';
    }
    
    if (field.unique) {
      sql += ' UNIQUE';
    }
    
    // Handle auto increment (don't add default if auto increment is enabled)
    if (field.autoIncrement) {
      sql += ' GENERATED BY DEFAULT AS IDENTITY';
    } else if (field.default !== undefined) {
      sql += ` DEFAULT ${this.formatDefaultValue(field.default, field.type)}`;
    }
    
    return sql;
  }

  private modifyColumnSQL(tableName: string, columnName: string, newField: FieldConfig): string[] {
    const sqls: string[] = [];
    
    // Change data type
    sqls.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} TYPE ${this.getPostgreSQLType(newField)};`);
    
    // Change nullability
    if (newField.nullable) {
      sqls.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} DROP NOT NULL;`);
    } else {
      sqls.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} SET NOT NULL;`);
    }
    
    // Change default value
    if (newField.default !== undefined) {
      sqls.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} SET DEFAULT ${this.formatDefaultValue(newField.default, newField.type)};`);
    } else {
      sqls.push(`ALTER TABLE ${tableName} ALTER COLUMN ${columnName} DROP DEFAULT;`);
    }
    
    return sqls;
  }

  private getPostgreSQLType(field: FieldConfig): string {
    switch (field.type) {
      case 'string':
        return 'VARCHAR(255)';
      case 'number':
        return field.autoIncrement ? 'INTEGER' : 'INTEGER';
      case 'boolean':
        return 'BOOLEAN';
      case 'date':
        return 'TIMESTAMP';
      case 'json':
        return 'JSONB';
      default:
        throw new Error(`Unsupported field type: ${field.type}`);
    }
  }

  private formatDefaultValue(value: any, type: FieldConfig['type']): string {
    if (value === null) return 'NULL';
    if (value === 'CURRENT_TIMESTAMP') return 'CURRENT_TIMESTAMP';
    
    switch (type) {
      case 'string':
        return `'${value}'`;
      case 'number':
        return value.toString();
      case 'boolean':
        return value ? 'true' : 'false';
      case 'date':
        if (value instanceof Date) {
          return `'${value.toISOString()}'`;
        }
        return value.toString();
      case 'json':
        return `'${JSON.stringify(value)}'`;
      default:
        return `'${value}'`;
    }
  }

  private generateMigrationId(): string {
    const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
    const random = Math.random().toString(36).substring(2, 6);
    return `${timestamp}_${random}`;
  }
}