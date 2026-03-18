const { Pool } = require('pg');
const DATABASE_URL = "postgresql://postgres.hfdngfvkgahiwmwtcyed:3swiftadevs2026@aws-1-eu-central-1.pooler.supabase.com:5432/postgres";

async function inspect() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  try {
    const client = await pool.connect();
    
    const fs = require('fs');
    const results = {};

    console.log('Inspecting merchant_profiles...');
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'merchant_profiles' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    results.merchant_profiles = cols.rows;

    console.log('Inspecting users...');
    const userCols = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    results.users = userCols.rows;
    
    fs.writeFileSync('db_inspection.json', JSON.stringify(results, null, 2));
    console.log('Inspection results saved to db_inspection.json');
    
    client.release();
  } catch (err) {
    console.error('Inspection failed:', err);
  } finally {
    await pool.end();
  }
}

inspect();
