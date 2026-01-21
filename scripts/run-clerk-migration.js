/**
 * Run Clerk Integration Migration
 *
 * Usage: node scripts/run-clerk-migration.js
 *
 * This script adds clerk_id columns and makes organization_id nullable
 * for the sponsors, cdes, investors, and users tables.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrations = [
  // Add clerk_id to users table
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(255) UNIQUE`,

  // Add role_type to users table
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS role_type VARCHAR(50)`,

  // Add clerk_id to sponsors table
  `ALTER TABLE sponsors ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(255) UNIQUE`,

  // Make organization_id nullable on sponsors
  `ALTER TABLE sponsors ALTER COLUMN organization_id DROP NOT NULL`,

  // Add clerk_id to cdes table
  `ALTER TABLE cdes ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(255) UNIQUE`,

  // Make organization_id nullable on cdes
  `ALTER TABLE cdes ALTER COLUMN organization_id DROP NOT NULL`,

  // Add clerk_id to investors table
  `ALTER TABLE investors ADD COLUMN IF NOT EXISTS clerk_id VARCHAR(255) UNIQUE`,

  // Make organization_id nullable on investors
  `ALTER TABLE investors ALTER COLUMN organization_id DROP NOT NULL`,

  // Create indexes
  `CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sponsors_clerk_id ON sponsors(clerk_id)`,
  `CREATE INDEX IF NOT EXISTS idx_cdes_clerk_id ON cdes(clerk_id)`,
  `CREATE INDEX IF NOT EXISTS idx_investors_clerk_id ON investors(clerk_id)`,
];

async function runMigration() {
  console.log('Starting Clerk integration migration...\n');

  for (const sql of migrations) {
    const shortSql = sql.substring(0, 60) + (sql.length > 60 ? '...' : '');
    console.log(`Running: ${shortSql}`);

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Try direct query if rpc doesn't exist
      const { error: directError } = await supabase.from('_migrations').select('*').limit(0);

      // If rpc doesn't work, we need to use the SQL editor in Supabase dashboard
      console.log(`  Warning: ${error.message}`);
      console.log('  You may need to run this SQL directly in the Supabase SQL Editor.\n');
    } else {
      console.log('  Done\n');
    }
  }

  console.log('\n=== Migration Complete ===');
  console.log('\nIf any statements failed, run them in Supabase SQL Editor:');
  console.log('https://supabase.com/dashboard/project/xlejizyoggqdedjkyset/sql\n');

  // Print the full SQL for manual execution
  console.log('Full SQL to run manually:');
  console.log('---');
  console.log(migrations.join(';\n') + ';');
}

runMigration().catch(console.error);
