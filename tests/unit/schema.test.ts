// Unit tests for schema system
import { 
  field, 
  relation, 
  createSchema, 
  createModel, 
  FieldBuilder, 
  ModelBuilder 
} from '../../src/schema';

describe('Schema System', () => {
  describe('FieldBuilder', () => {
    test('should create a string field', () => {
      const stringField = field.string().build();
      expect(stringField.type).toBe('string');
      expect(stringField.nullable).toBeUndefined();
    });

    test('should create a nullable field', () => {
      const nullableField = field.string().nullable().build();
      expect(nullableField.nullable).toBe(true);
    });

    test('should create a unique field', () => {
      const uniqueField = field.string().unique().build();
      expect(uniqueField.unique).toBe(true);
    });

    test('should create a field with default value', () => {
      const defaultField = field.string().default('test').build();
      expect(defaultField.default).toBe('test');
    });

    test('should create a primary key field', () => {
      const pkField = field.number().primaryKey().autoIncrement().build();
      expect(pkField.primaryKey).toBe(true);
      expect(pkField.autoIncrement).toBe(true);
    });
  });

  describe('ModelBuilder', () => {
    test('should create a basic model', () => {
      const model = createModel()
        .tableName('users')
        .field('id', field.number().primaryKey().autoIncrement())
        .field('name', field.string())
        .field('email', field.string().unique())
        .build();

      expect(model.tableName).toBe('users');
      expect(model.fields.id?.type).toBe('number');
      expect(model.fields.id?.primaryKey).toBe(true);
      expect(model.fields.email?.unique).toBe(true);
      expect(model.timestamps).toBe(true);
    });

    test('should create model with relations', () => {
      const model = createModel()
        .field('id', field.number().primaryKey())
        .relation('posts', relation.hasMany('Post', 'user_id'))
        .relation('profile', relation.hasOne('Profile', 'user_id'))
        .build();

      expect(model.relations?.posts?.type).toBe('hasMany');
      expect(model.relations?.posts?.model).toBe('Post');
      expect(model.relations?.profile?.type).toBe('hasOne');
    });

    test('should disable timestamps', () => {
      const model = createModel()
        .field('id', field.number().primaryKey())
        .timestamps(false)
        .build();

      expect(model.timestamps).toBe(false);
    });
  });

  describe('SchemaBuilder', () => {
    test('should create a complete schema', () => {
      const userModel = createModel()
        .tableName('users')
        .field('id', field.number().primaryKey().autoIncrement())
        .field('name', field.string())
        .field('email', field.string().unique());

      const postModel = createModel()
        .tableName('posts')
        .field('id', field.number().primaryKey().autoIncrement())
        .field('title', field.string())
        .field('content', field.string().nullable())
        .field('user_id', field.number())
        .relation('author', relation.belongsTo('User', 'user_id'));

      const schema = createSchema()
        .version('1.0.0')
        .model('User', userModel)
        .model('Post', postModel)
        .build();

      expect(schema.version).toBe('1.0.0');
      expect(schema.models.User).toBeDefined();
      expect(schema.models.Post).toBeDefined();
      expect(schema.models.User?.tableName).toBe('users');
      expect(schema.models.Post?.relations?.author?.type).toBe('belongsTo');
    });
  });

  describe('Relation helpers', () => {
    test('should create hasOne relation', () => {
      const rel = relation.hasOne('Profile', 'user_id');
      expect(rel.type).toBe('hasOne');
      expect(rel.model).toBe('Profile');
      expect(rel.foreignKey).toBe('user_id');
    });

    test('should create hasMany relation', () => {
      const rel = relation.hasMany('Post', 'user_id');
      expect(rel.type).toBe('hasMany');
      expect(rel.model).toBe('Post');
      expect(rel.foreignKey).toBe('user_id');
    });

    test('should create belongsTo relation', () => {
      const rel = relation.belongsTo('User', 'user_id');
      expect(rel.type).toBe('belongsTo');
      expect(rel.model).toBe('User');
      expect(rel.localKey).toBe('user_id');
    });

    test('should create belongsToMany relation', () => {
      const rel = relation.belongsToMany('Tag', 'post_tags');
      expect(rel.type).toBe('belongsToMany');
      expect(rel.model).toBe('Tag');
      expect(rel.through).toBe('post_tags');
    });
  });
});