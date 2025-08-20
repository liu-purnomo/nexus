// Unit tests for query builder
import { QueryBuilder, createQueryBuilder } from '../../src/query';

describe('Query Builder', () => {
  let queryBuilder: QueryBuilder;

  beforeEach(() => {
    queryBuilder = createQueryBuilder('users');
  });

  describe('Basic queries', () => {
    test('should create basic where condition', () => {
      queryBuilder.where('name', 'John');
      const options = queryBuilder.getOptions();
      
      expect(options.where).toHaveLength(1);
      expect(options.where?.[0]).toEqual({
        field: 'name',
        operator: '=',
        value: 'John'
      });
    });

    test('should create where condition with operator', () => {
      queryBuilder.where('age', '>', 18);
      const options = queryBuilder.getOptions();
      
      expect(options.where?.[0]).toEqual({
        field: 'age',
        operator: '>',
        value: 18
      });
    });

    test('should create where conditions from object', () => {
      queryBuilder.where({ name: 'John', age: 25 });
      const options = queryBuilder.getOptions();
      
      expect(options.where).toHaveLength(2);
      expect(options.where?.[0]).toEqual({
        field: 'name',
        operator: '=',
        value: 'John'
      });
      expect(options.where?.[1]).toEqual({
        field: 'age',
        operator: '=',
        value: 25
      });
    });
  });

  describe('Special where conditions', () => {
    test('should create whereIn condition', () => {
      queryBuilder.whereIn('status', ['active', 'pending']);
      const options = queryBuilder.getOptions();
      
      expect(options.where?.[0]).toEqual({
        field: 'status',
        operator: 'IN',
        value: ['active', 'pending']
      });
    });

    test('should create whereNotIn condition', () => {
      queryBuilder.whereNotIn('status', ['deleted', 'banned']);
      const options = queryBuilder.getOptions();
      
      expect(options.where?.[0]).toEqual({
        field: 'status',
        operator: 'NOT IN',
        value: ['deleted', 'banned']
      });
    });

    test('should create whereLike condition', () => {
      queryBuilder.whereLike('name', '%john%');
      const options = queryBuilder.getOptions();
      
      expect(options.where?.[0]).toEqual({
        field: 'name',
        operator: 'LIKE',
        value: '%john%'
      });
    });

    test('should create whereILike condition', () => {
      queryBuilder.whereILike('email', '%@gmail.com');
      const options = queryBuilder.getOptions();
      
      expect(options.where?.[0]).toEqual({
        field: 'email',
        operator: 'ILIKE',
        value: '%@gmail.com'
      });
    });
  });

  describe('Ordering and limiting', () => {
    test('should add orderBy condition', () => {
      queryBuilder.orderBy('created_at', 'DESC');
      const options = queryBuilder.getOptions();
      
      expect(options.orderBy).toHaveLength(1);
      expect(options.orderBy?.[0]).toEqual({
        field: 'created_at',
        direction: 'DESC'
      });
    });

    test('should default orderBy to ASC', () => {
      queryBuilder.orderBy('name');
      const options = queryBuilder.getOptions();
      
      expect(options.orderBy?.[0]?.direction).toBe('ASC');
    });

    test('should set limit', () => {
      queryBuilder.limit(10);
      const options = queryBuilder.getOptions();
      
      expect(options.limit).toBe(10);
    });

    test('should set offset', () => {
      queryBuilder.offset(20);
      const options = queryBuilder.getOptions();
      
      expect(options.offset).toBe(20);
    });

    test('should handle pagination', () => {
      queryBuilder.paginate(2, 15); // page 2, 15 items per page
      const options = queryBuilder.getOptions();
      
      expect(options.limit).toBe(15);
      expect(options.offset).toBe(15); // (2-1) * 15
    });
  });

  describe('Field selection', () => {
    test('should select specific fields', () => {
      queryBuilder.select('id', 'name', 'email');
      const options = queryBuilder.getOptions();
      
      expect(options.select).toEqual(['id', 'name', 'email']);
    });

    test('should include relations', () => {
      queryBuilder.include('posts', 'profile');
      const options = queryBuilder.getOptions();
      
      expect(options.include).toEqual(['posts', 'profile']);
    });
  });

  describe('SQL generation', () => {
    test('should generate basic SQL', () => {
      const { sql, params } = queryBuilder
        .where('name', 'John')
        .orderBy('created_at', 'DESC')
        .limit(10)
        .toSQL();
      
      expect(sql).toBe('SELECT * FROM users WHERE name = $1 ORDER BY created_at DESC LIMIT $2');
      expect(params).toEqual(['John', 10]);
    });

    test('should generate SQL with multiple where conditions', () => {
      const { sql, params } = queryBuilder
        .where('name', 'John')
        .where('age', '>', 18)
        .toSQL();
      
      expect(sql).toBe('SELECT * FROM users WHERE name = $1 AND age > $2');
      expect(params).toEqual(['John', 18]);
    });

    test('should generate SQL with selected fields', () => {
      const { sql, params } = queryBuilder
        .select('id', 'name')
        .where('active', true)
        .toSQL();
      
      expect(sql).toBe('SELECT id, name FROM users WHERE active = $1');
      expect(params).toEqual([true]);
    });

    test('should generate SQL with offset', () => {
      const { sql, params } = queryBuilder
        .limit(10)
        .offset(20)
        .toSQL();
      
      expect(sql).toBe('SELECT * FROM users LIMIT $1 OFFSET $2');
      expect(params).toEqual([10, 20]);
    });
  });

  describe('Method chaining', () => {
    test('should allow method chaining', () => {
      const result = queryBuilder
        .where('name', 'John')
        .where('age', '>', 18)
        .orderBy('created_at', 'DESC')
        .limit(10)
        .offset(5)
        .select('id', 'name');
      
      expect(result).toBe(queryBuilder);
      
      const options = queryBuilder.getOptions();
      expect(options.where).toHaveLength(2);
      expect(options.orderBy).toHaveLength(1);
      expect(options.limit).toBe(10);
      expect(options.offset).toBe(5);
      expect(options.select).toEqual(['id', 'name']);
    });
  });
});