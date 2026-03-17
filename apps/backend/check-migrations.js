const { Client } = require('pg');
require('dotenv').config();

async function checkMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    const res = await client.query('SELECT migration_name FROM _prisma_migrations ORDER BY applied_at ASC');
    console.log('Applied migrations:');
    res.rows.forEach(row => console.log(`- ${row.migration_name}`));
  } catch (err) {
    if (err.code === '42P01') {
      console.log('Error: _prisma_migrations table does not exist.');
    } else {
      console.error('Error connecting to database:', err.message);
    }
  } finally {
    await client.end();
  }
}

checkMigrations();
