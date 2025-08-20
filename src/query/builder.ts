// Query builder implementation
import { 
  WhereCondition, 
  OrderByCondition, 
  QueryOptions, 
  QueryResult,
  ComplexWhereCondition,
  QueryOperator 
} from './types';

export class QueryBuilder<T = any> {
  private options: QueryOptions = {};
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  where(field: string, operator: WhereCondition['operator'], value: any): this;
  where(field: string, value: any): this;
  where(conditions: Record<string, any>): this;
  where(
    fieldOrConditions: string | Record<string, any>,
    operatorOrValue?: WhereCondition['operator'] | any,
    value?: any
  ): this {
    if (!this.options.where) {
      this.options.where = [];
    }

    if (typeof fieldOrConditions === 'string') {
      if (value !== undefined) {
        // where(field, operator, value)
        this.options.where.push({
          field: fieldOrConditions,
          operator: operatorOrValue as WhereCondition['operator'],
          value,
        });
      } else {
        // where(field, value) - defaults to '='
        this.options.where.push({
          field: fieldOrConditions,
          operator: '=',
          value: operatorOrValue,
        });
      }
    } else {
      // where(conditions object)
      Object.entries(fieldOrConditions).forEach(([field, val]) => {
        this.options.where!.push({
          field,
          operator: '=',
          value: val,
        });
      });
    }

    return this;
  }

  whereIn(field: string, values: any[]): this {
    return this.where(field, 'IN', values);
  }

  whereNotIn(field: string, values: any[]): this {
    return this.where(field, 'NOT IN', values);
  }

  whereLike(field: string, pattern: string): this {
    return this.where(field, 'LIKE', pattern);
  }

  whereILike(field: string, pattern: string): this {
    return this.where(field, 'ILIKE', pattern);
  }

  orderBy(field: string, direction: 'ASC' | 'DESC' = 'ASC'): this {
    if (!this.options.orderBy) {
      this.options.orderBy = [];
    }
    this.options.orderBy.push({ field, direction });
    return this;
  }

  limit(count: number): this {
    this.options.limit = count;
    return this;
  }

  offset(count: number): this {
    this.options.offset = count;
    return this;
  }

  select(...fields: string[]): this {
    this.options.select = fields;
    return this;
  }

  include(...relations: string[]): this {
    this.options.include = relations;
    return this;
  }

  // Pagination helper
  paginate(page: number, perPage: number): this {
    this.limit(perPage);
    this.offset((page - 1) * perPage);
    return this;
  }

  // Build the final query options
  getOptions(): QueryOptions {
    return { ...this.options };
  }

  // Generate SQL (basic implementation)
  toSQL(): { sql: string; params: any[] } {
    const params: any[] = [];
    let sql = `SELECT ${this.options.select?.join(', ') || '*'} FROM ${this.tableName}`;

    if (this.options.where && this.options.where.length > 0) {
      const whereClause = this.options.where
        .map((condition) => {
          params.push(condition.value);
          return `${condition.field} ${condition.operator} $${params.length}`;
        })
        .join(' AND ');
      
      sql += ` WHERE ${whereClause}`;
    }

    if (this.options.orderBy && this.options.orderBy.length > 0) {
      const orderClause = this.options.orderBy
        .map(({ field, direction }) => `${field} ${direction}`)
        .join(', ');
      
      sql += ` ORDER BY ${orderClause}`;
    }

    if (this.options.limit) {
      params.push(this.options.limit);
      sql += ` LIMIT $${params.length}`;
    }

    if (this.options.offset) {
      params.push(this.options.offset);
      sql += ` OFFSET $${params.length}`;
    }

    return { sql, params };
  }

  // Execute methods with actual database connection
  async find(): Promise<T[]> {
    const { getConnection } = require('../core');
    const db = getConnection();
    const { sql, params } = this.toSQL();
    return await db.query(sql, params);
  }

  async findOne(): Promise<T | null> {
    this.limit(1);
    const results = await this.find();
    return results.length > 0 ? results[0]! : null;
  }

  async count(): Promise<number> {
    const { getConnection } = require('../core');
    const db = getConnection();
    const countSql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    
    let sql = countSql;
    const params: any[] = [];
    
    if (this.options.where && this.options.where.length > 0) {
      const whereClause = this.options.where
        .map((condition) => {
          params.push(condition.value);
          return `${condition.field} ${condition.operator} $${params.length}`;
        })
        .join(' AND ');
      
      sql += ` WHERE ${whereClause}`;
    }
    
    const result = await db.query(sql, params) as { count: string }[];
    return parseInt(result[0]!.count, 10);
  }

  async findAndCount(): Promise<QueryResult<T>> {
    const [data, count] = await Promise.all([
      this.find(),
      this.count()
    ]);
    
    const result: QueryResult<T> = { data, count };
    
    if (this.options.limit && this.options.offset !== undefined) {
      const page = Math.floor(this.options.offset / this.options.limit) + 1;
      const totalPages = Math.ceil(count / this.options.limit);
      
      result.pagination = {
        page,
        limit: this.options.limit,
        total: count,
        totalPages
      };
    }
    
    return result;
  }
}

export const createQueryBuilder = <T = any>(tableName: string): QueryBuilder<T> => {
  return new QueryBuilder<T>(tableName);
};