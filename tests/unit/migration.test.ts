// Unit tests for migration system
import { MigrationGenerator } from '../../src/migration';
import { FieldConfig } from '../../src/schema';

describe('Migration System', () => {
  let generator: MigrationGenerator;

  beforeEach(() => {
    generator = new MigrationGenerator();
  });

  describe('MigrationGenerator', () => {
    test('should generate CREATE_TABLE operation', () => {
      const operation = generator.generateCreateTable('users', {
        id: { type: 'number', primaryKey: true, autoIncrement: true },
        name: { type: 'string' },
      });

      expect(operation.type).toBe('CREATE_TABLE');
      expect(operation.table).toBe('users');
    });

    test('should generate DROP_TABLE operation', () => {
      const operation = generator.generateDropTable('users');

      expect(operation.type).toBe('DROP_TABLE');
      expect(operation.table).toBe('users');
    });

    test('should generate ADD_COLUMN operation', () => {
      const field: FieldConfig = { type: 'string', nullable: true };
      const operation = generator.generateAddColumn('users', 'email', field);

      expect(operation.type).toBe('ADD_COLUMN');
      expect(operation.table).toBe('users');
      expect(operation.column).toBe('email');
      expect(operation.field).toEqual(field);
    });

    test('should generate DROP_COLUMN operation', () => {
      const operation = generator.generateDropColumn('users', 'email');

      expect(operation.type).toBe('DROP_COLUMN');
      expect(operation.table).toBe('users');
      expect(operation.column).toBe('email');
    });

    test('should generate MODIFY_COLUMN operation', () => {
      const oldField: FieldConfig = { type: 'string', nullable: true };
      const newField: FieldConfig = { type: 'string', nullable: false };
      const operation = generator.generateModifyColumn('users', 'email', oldField, newField);

      expect(operation.type).toBe('MODIFY_COLUMN');
      expect(operation.table).toBe('users');
      expect(operation.column).toBe('email');
      expect(operation.oldField).toEqual(oldField);
      expect(operation.newField).toEqual(newField);
    });
  });

  describe('SQL Generation', () => {
    test('should generate CREATE TABLE SQL', () => {
      const operation = generator.generateCreateTable('users', {});
      const sqls = generator.operationToSQL(operation);
      
      expect(sqls).toHaveLength(1);
      expect(sqls[0]).toContain('CREATE TABLE users');
    });

    test('should generate DROP TABLE SQL', () => {
      const operation = generator.generateDropTable('users');
      const sqls = generator.operationToSQL(operation);
      
      expect(sqls).toEqual(['DROP TABLE IF EXISTS users;']);
    });

    test('should generate ADD COLUMN SQL', () => {
      const field: FieldConfig = { type: 'string', nullable: false };
      const operation = generator.generateAddColumn('users', 'email', field);
      const sqls = generator.operationToSQL(operation);
      
      expect(sqls).toHaveLength(1);
      expect(sqls[0]).toBe('ALTER TABLE users ADD COLUMN email VARCHAR(255) NOT NULL;');
    });

    test('should generate DROP COLUMN SQL', () => {
      const operation = generator.generateDropColumn('users', 'email');
      const sqls = generator.operationToSQL(operation);
      
      expect(sqls).toEqual(['ALTER TABLE users DROP COLUMN email;']);
    });

    test('should generate MODIFY COLUMN SQL', () => {
      const newField: FieldConfig = { type: 'string', nullable: false };
      const operation = generator.generateModifyColumn('users', 'email', { type: 'string' }, newField);
      const sqls = generator.operationToSQL(operation);
      
      expect(sqls.length).toBeGreaterThan(0);
      expect(sqls.some(sql => sql.includes('ALTER TABLE users'))).toBe(true);
    });
  });

  describe('PostgreSQL Type Mapping', () => {
    test('should map string type to VARCHAR', () => {
      const field: FieldConfig = { type: 'string' };
      const operation = generator.generateAddColumn('test', 'col', field);
      const sqls = generator.operationToSQL(operation);
      
      expect(sqls[0]).toContain('VARCHAR(255)');
    });

    test('should map number type to INTEGER', () => {
      const field: FieldConfig = { type: 'number' };
      const operation = generator.generateAddColumn('test', 'col', field);
      const sqls = generator.operationToSQL(operation);
      
      expect(sqls[0]).toContain('INTEGER');
    });

    test('should map boolean type to BOOLEAN', () => {
      const field: FieldConfig = { type: 'boolean' };
      const operation = generator.generateAddColumn('test', 'col', field);
      const sqls = generator.operationToSQL(operation);
      
      expect(sqls[0]).toContain('BOOLEAN');
    });

    test('should map date type to TIMESTAMP', () => {
      const field: FieldConfig = { type: 'date' };
      const operation = generator.generateAddColumn('test', 'col', field);
      const sqls = generator.operationToSQL(operation);
      
      expect(sqls[0]).toContain('TIMESTAMP');
    });

    test('should map json type to JSONB', () => {
      const field: FieldConfig = { type: 'json' };
      const operation = generator.generateAddColumn('test', 'col', field);
      const sqls = generator.operationToSQL(operation);
      
      expect(sqls[0]).toContain('JSONB');
    });
  });

  describe('Field Constraints', () => {
    test('should add NOT NULL constraint', () => {
      const field: FieldConfig = { type: 'string', nullable: false };
      const operation = generator.generateAddColumn('test', 'col', field);
      const sqls = generator.operationToSQL(operation);
      
      expect(sqls[0]).toContain('NOT NULL');
    });

    test('should add UNIQUE constraint', () => {
      const field: FieldConfig = { type: 'string', unique: true };
      const operation = generator.generateAddColumn('test', 'col', field);
      const sqls = generator.operationToSQL(operation);
      
      expect(sqls[0]).toContain('UNIQUE');
    });

    test('should add DEFAULT value', () => {
      const field: FieldConfig = { type: 'string', default: 'test' };
      const operation = generator.generateAddColumn('test', 'col', field);
      const sqls = generator.operationToSQL(operation);
      
      expect(sqls[0]).toContain("DEFAULT 'test'");
    });

    test('should add auto increment for number fields', () => {
      const field: FieldConfig = { type: 'number', autoIncrement: true };
      const operation = generator.generateAddColumn('test', 'col', field);
      const sqls = generator.operationToSQL(operation);
      
      expect(sqls[0]).toContain('GENERATED BY DEFAULT AS IDENTITY');
    });
  });
});