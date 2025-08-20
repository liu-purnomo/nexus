// Schema builder for defining models in TypeScript
import { FieldConfig, RelationConfig, ModelConfig, SchemaDefinition } from './types';

export class FieldBuilder {
  private config: FieldConfig;

  constructor(type: FieldConfig['type']) {
    this.config = { type };
  }

  nullable(): this {
    this.config.nullable = true;
    return this;
  }

  unique(): this {
    this.config.unique = true;
    return this;
  }

  default(value: any): this {
    this.config.default = value;
    return this;
  }

  primaryKey(): this {
    this.config.primaryKey = true;
    return this;
  }

  autoIncrement(): this {
    this.config.autoIncrement = true;
    return this;
  }

  build(): FieldConfig {
    return { ...this.config };
  }
}

export class ModelBuilder {
  private config: ModelConfig;

  constructor() {
    this.config = {
      fields: {},
      timestamps: true,
    };
  }

  tableName(name: string): this {
    this.config.tableName = name;
    return this;
  }

  field(name: string, field: FieldConfig | FieldBuilder): this {
    this.config.fields[name] = field instanceof FieldBuilder ? field.build() : field;
    return this;
  }

  relation(name: string, relation: RelationConfig): this {
    if (!this.config.relations) {
      this.config.relations = {};
    }
    this.config.relations[name] = relation;
    return this;
  }

  timestamps(enabled: boolean = true): this {
    this.config.timestamps = enabled;
    return this;
  }

  build(): ModelConfig {
    return { ...this.config };
  }
}

export class SchemaBuilder {
  private schema: SchemaDefinition;

  constructor() {
    this.schema = {
      models: {},
    };
  }

  model(name: string, model: ModelConfig | ModelBuilder): this {
    this.schema.models[name] = model instanceof ModelBuilder ? model.build() : model;
    return this;
  }

  version(version: string): this {
    this.schema.version = version;
    return this;
  }

  build(): SchemaDefinition {
    return { ...this.schema };
  }
}

// Utility functions for creating schema elements
export const field = {
  string: () => new FieldBuilder('string'),
  number: () => new FieldBuilder('number'),
  boolean: () => new FieldBuilder('boolean'),
  date: () => new FieldBuilder('date'),
  json: () => new FieldBuilder('json'),
};

export const relation = {
  hasOne: (model: string, foreignKey?: string): RelationConfig => ({
    type: 'hasOne',
    model,
    ...(foreignKey && { foreignKey }),
  }),
  hasMany: (model: string, foreignKey?: string): RelationConfig => ({
    type: 'hasMany',
    model,
    ...(foreignKey && { foreignKey }),
  }),
  belongsTo: (model: string, localKey?: string): RelationConfig => ({
    type: 'belongsTo',
    model,
    ...(localKey && { localKey }),
  }),
  belongsToMany: (model: string, through: string): RelationConfig => ({
    type: 'belongsToMany',
    model,
    through,
  }),
};

export const createSchema = (): SchemaBuilder => new SchemaBuilder();
export const createModel = (): ModelBuilder => new ModelBuilder();