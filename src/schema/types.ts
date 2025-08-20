// Schema type definitions for Nexus ORM

export interface FieldConfig {
  type: 'string' | 'number' | 'boolean' | 'date' | 'json';
  nullable?: boolean;
  unique?: boolean;
  default?: any;
  primaryKey?: boolean;
  autoIncrement?: boolean;
}

export interface RelationConfig {
  type: 'hasOne' | 'hasMany' | 'belongsTo' | 'belongsToMany';
  model: string;
  foreignKey?: string;
  localKey?: string;
  through?: string;
}

export interface ModelConfig {
  tableName?: string;
  fields: Record<string, FieldConfig>;
  relations?: Record<string, RelationConfig>;
  timestamps?: boolean;
}

export interface SchemaDefinition {
  models: Record<string, ModelConfig>;
  version?: string;
}

// Type utilities for schema inference
export type InferModelFields<T extends ModelConfig> = {
  [K in keyof T['fields']]: T['fields'][K]['nullable'] extends true
    ? InferFieldType<T['fields'][K]> | null
    : InferFieldType<T['fields'][K]>;
};

export type InferFieldType<T extends FieldConfig> = T['type'] extends 'string'
  ? string
  : T['type'] extends 'number'
  ? number
  : T['type'] extends 'boolean'
  ? boolean
  : T['type'] extends 'date'
  ? Date
  : T['type'] extends 'json'
  ? any
  : unknown;