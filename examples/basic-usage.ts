// Example: Basic usage of Nexus ORM
import { ModelClient } from '../src/client';
import { createConnection } from '../src/core';
import { createModel, createSchema, field, relation } from '../src/schema';

// Define database configuration
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'nexus_example',
  user: 'postgres',
  password: 'postgres',
};

// Define schema using TypeScript
const userModel = createModel()
  .tableName('users')
  .field('id', field.number().primaryKey().autoIncrement())
  .field('name', field.string())
  .field('email', field.string().unique())
  .field('age', field.number().nullable())
  .field('isActive', field.boolean().default(true))
  .field('metadata', field.json().nullable())
  .relation('posts', relation.hasMany('Post', 'user_id'))
  .relation('profile', relation.hasOne('Profile', 'user_id'))
  .timestamps(true)
  .build();

const postModel = createModel()
  .tableName('posts')
  .field('id', field.number().primaryKey().autoIncrement())
  .field('title', field.string())
  .field('content', field.string().nullable())
  .field('published', field.boolean().default(false))
  .field('user_id', field.number())
  .relation('author', relation.belongsTo('User', 'user_id'))
  .relation('tags', relation.belongsToMany('Tag', 'post_tags'))
  .build();

const schema = createSchema()
  .version('1.0.0')
  .model('User', userModel)
  .model('Post', postModel)
  .build();

// Usage example
async function main() {
  try {
    // Initialize database connection
    const db = createConnection(dbConfig);
    await db.connect();

    // Create model clients and ensure tables exist
    const User = new ModelClient('User', userModel);
    const Post = new ModelClient('Post', postModel);
    
    console.log('Ensuring tables exist...');
    await User.ensureTable();
    await Post.ensureTable();

    // Basic CRUD operations
    console.log('Creating a new user...');
    const randomEmail = `john${Date.now()}@example.com`;
    const newUser = await User.create({
      name: 'John Doe',
      email: randomEmail,
      age: 30,
      metadata: { preferences: { theme: 'dark' } },
    });
    console.log('Created user:', newUser);

    // Find user by ID
    console.log('Finding user by ID...');
    const foundUser = await User.findById(newUser.id);
    console.log('Found user:', foundUser);

    // Query builder usage
    console.log('Using query builder...');
    const activeUsers = await User.query()
      .where('isActive', true)
      .where('age', '>', 18)
      .orderBy('name', 'ASC')
      .limit(10)
      .find();
    console.log('Active users:', activeUsers);

    // Update user
    console.log('Updating user...');
    const updatedUser = await User.update(newUser.id, {
      age: 31,
      metadata: { preferences: { theme: 'light' } },
    });
    console.log('Updated user:', updatedUser);

    // Create related post
    console.log('Creating a post...');
    const newPost = await Post.create({
      title: 'My First Post',
      content: 'This is the content of my first post.',
      published: true,
      user_id: newUser.id,
    });
    console.log('Created post:', newPost);

    // Complex query with pagination
    console.log('Complex query with pagination...');
    const publishedPosts = await Post.query()
      .where('published', true)
      .orderBy('created_at', 'DESC')
      .paginate(1, 5) // page 1, 5 items per page
      .find();
    console.log('Published posts:', publishedPosts);

    // Delete operations
    console.log('Deleting post...');
    await Post.delete(newPost.id);

    console.log('Deleting user...');
    await User.delete(newUser.id);

    console.log('Example completed successfully!');
    
    // Disconnect from database
    await db.disconnect();
  } catch (error) {
    console.error('Error in example:', error);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}
