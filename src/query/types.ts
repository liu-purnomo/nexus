// Query builder type definitions

export interface WhereCondition {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'IN' | 'NOT IN' | 'LIKE' | 'ILIKE';
  value: any;
}

export interface OrderByCondition {
  field: string;
  direction: 'ASC' | 'DESC';
}

export interface JoinCondition {
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  table: string;
  on: string;
}

export interface QueryOptions {
  where?: WhereCondition[];
  orderBy?: OrderByCondition[];
  limit?: number;
  offset?: number;
  joins?: JoinCondition[];
  select?: string[];
  include?: string[];
}

export interface QueryResult<T = any> {
  data: T[];
  count?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type QueryOperator = 'AND' | 'OR';

export interface ComplexWhereCondition {
  operator?: QueryOperator;
  conditions: (WhereCondition | ComplexWhereCondition)[];
}