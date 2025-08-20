# Nexus ORM

> Type-safe ORM for Next.js & PostgreSQL with intuitive developer experience

Nexus ORM adalah solusi ORM modern yang dirancang khusus untuk aplikasi **Next.js dan PostgreSQL**. Dengan fokus pada **type safety**, **developer experience**, dan **kesederhanaan**, Nexus menyediakan API yang intuitif untuk mengelola data aplikasi Anda.

## 🚀 Fitur Unggulan

- **🔒 Type-Safe**: Penuh dukungan TypeScript dengan type inference otomatis
- **🏗️ Schema-First**: Definisikan model dalam TypeScript, tanpa file terpisah
- **⚡ Query Builder**: API chainable yang powerful dan mudah digunakan
- **🔄 Migration Engine**: Sistem migrasi database otomatis dan aman
- **🎯 PostgreSQL Optimized**: Dioptimalkan untuk PostgreSQL dengan fitur canggih
- **📦 Zero Configuration**: Mudah digunakan dengan konfigurasi minimal

## 📦 Instalasi

```bash
npm install nexus-orm
# atau
yarn add nexus-orm
```

## 🏁 Quick Start

### 1. Definisikan Schema

```typescript
import { createSchema, createModel, field, relation } from 'nexus-orm';

// Definisi model User
const userModel = createModel()
  .tableName('users')
  .field('id', field.number().primaryKey().autoIncrement())
  .field('name', field.string())
  .field('email', field.string().unique())
  .field('age', field.number().nullable())
  .relation('posts', relation.hasMany('Post', 'user_id'))
  .build();

// Definisi model Post
const postModel = createModel()
  .tableName('posts')
  .field('id', field.number().primaryKey().autoIncrement())
  .field('title', field.string())
  .field('content', field.string().nullable())
  .field('user_id', field.number())
  .relation('author', relation.belongsTo('User', 'user_id'))
  .build();

// Gabungkan dalam schema
const schema = createSchema()
  .version('1.0.0')
  .model('User', userModel)
  .model('Post', postModel)
  .build();
```

### 2. Setup Koneksi Database

```typescript
import { createConnection } from 'nexus-orm';

const db = createConnection({
  host: 'localhost',
  port: 5432,
  database: 'myapp',
  user: 'postgres',
  password: 'password'
});

await db.connect();
```

### 3. Gunakan Model Client

```typescript
import { ModelClient } from 'nexus-orm';

const User = new ModelClient('User', userModel);

// Create
const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// Read
const foundUser = await User.findById(1);
const allUsers = await User.findAll();

// Query Builder
const activeUsers = await User.query()
  .where('age', '>', 18)
  .orderBy('name', 'ASC')
  .limit(10)
  .find();

// Update
const updatedUser = await User.update(1, { age: 31 });

// Delete
await User.delete(1);
```

## 🔧 API Reference

### Field Types

```typescript
// String field
field.string()
  .nullable()      // Allow null values
  .unique()        // Add unique constraint
  .default('text') // Set default value

// Number field  
field.number()
  .primaryKey()    // Mark as primary key
  .autoIncrement() // Auto increment

// Boolean field
field.boolean()
  .default(true)   // Set default value

// Date field
field.date()

// JSON field
field.json()
```

### Relations

```typescript
// One-to-One
relation.hasOne('Profile', 'user_id')

// One-to-Many
relation.hasMany('Post', 'user_id')

// Many-to-One
relation.belongsTo('User', 'user_id')

// Many-to-Many
relation.belongsToMany('Tag', 'post_tags')
```

### Query Builder

```typescript
const query = Model.query()
  .where('field', 'value')                    // Equal comparison
  .where('field', '>', 10)                    // Comparison operators
  .whereIn('status', ['active', 'pending'])   // IN operator
  .whereLike('name', '%john%')                // LIKE operator
  .orderBy('created_at', 'DESC')              // Ordering
  .limit(10)                                  // Limit results
  .offset(20)                                 // Offset results
  .paginate(2, 10)                           // Pagination helper
  .select('id', 'name', 'email')             // Select specific fields
  .include('posts', 'profile');              // Include relations

// Execute query
const results = await query.find();
const count = await query.count();
const { data, pagination } = await query.findAndCount();
```

## 🗄️ Migration System

Nexus ORM menyediakan sistem migrasi yang powerful untuk mengelola evolusi schema database:

```typescript
import { MigrationRunner, MigrationGenerator } from 'nexus-orm';

const runner = new MigrationRunner(db);
await runner.initialize();

// Generate migration from schema changes
const generator = new MigrationGenerator();
const migration = generator.generateMigrationFromDiff(diff, 'add_user_table');

// Run migrations
await runner.runMigration(migration);

// Rollback migration
await runner.rollbackMigration(migration);
```

## 🧪 Testing

Nexus ORM dilengkapi dengan test suite yang komprehensif:

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm test -- --coverage
```

## 📈 Roadmap

### Fase 1: MVP (Q3 2025)
- [x] Core schema definition system
- [x] Basic query builder
- [x] PostgreSQL connection management
- [x] Migration engine dasar
- [x] Type-safe model client

### Fase 2: Production Ready (Q4 2025)
- [ ] Transaction support
- [ ] Relation eager loading
- [ ] Schema validation
- [ ] Plugin system
- [ ] Performance optimizations

### Fase 3: Ecosystem (Q1-Q2 2026)
- [ ] CLI tools
- [ ] Next.js integration
- [ ] Advanced plugins (RBAC, audit logs)
- [ ] Documentation site

## 🤝 Contributing

Kami sangat menyambut kontribusi dari komunitas! Silakan baca [CONTRIBUTING.md](CONTRIBUTING.md) untuk panduan kontribusi.

## 📄 License

MIT License - lihat [LICENSE](LICENSE) untuk detail lengkap.

## 🔗 Links

- [Documentation](https://nexus-orm.dev)
- [GitHub Repository](https://github.com/your-username/nexus-orm)
- [npm Package](https://www.npmjs.com/package/nexus-orm)
- [Issues](https://github.com/your-username/nexus-orm/issues)

---

**Nexus ORM** - *Bridging data complexity with elegant simplicity* 🌟