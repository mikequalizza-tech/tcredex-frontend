/**
 * Execute Supabase Migration via REST API
 * Run: npx tsx scripts/run-migration.ts
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://xlejizyoggqdedjkyset.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsZWppenlvZ2dxZGVkamt5c2V0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY2MjUyMCwiZXhwIjoyMDgxMjM4NTIwfQ._cv7Gg0Sc-qQATifHzKz4AJAQfVFGUf-g2LEa5UyMmg';

async function executeSql(sql: string, label: string) {
  console.log(`\n📋 Executing: ${label}...`);
  
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${label} failed: ${response.status} - ${text}`);
  }

  console.log(`✅ ${label} complete!`);
  return response.json();
}

async function runMigration() {
  console.log('🚀 tCredex Supabase Migration\n');
  console.log('Project:', SUPABASE_URL);
  console.log('-----------------------------------');

  const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
  
  try {
    // Test connection first
    console.log('\n🔍 Testing connection...');
    const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });
    
    if (testResponse.ok) {
      console.log('✅ Connection successful!');
    } else {
      console.log('⚠️ Connection test returned:', testResponse.status);
    }

    // Check if tables already exist
    console.log('\n🔍 Checking existing tables...');
    const tablesResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/organizations?select=id&limit=1`,
      {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    if (tablesResponse.status === 200) {
      const data = await tablesResponse.json();
      console.log('⚠️ Tables already exist! Found organizations:', data.length);
      console.log('\nTo reset, run DROP commands first in Supabase Dashboard.');
      console.log('Or continue to seed more data.');
      
      // Try seed data anyway
      const seedFile = path.join(migrationsDir, '002_seed_data.sql');
      if (fs.existsSync(seedFile)) {
        console.log('\n🌱 Attempting seed data...');
      }
      return;
    }

    console.log('📋 Tables not found. Ready to create schema.');
    console.log('\n⚠️ Supabase REST API cannot execute DDL statements.');
    console.log('\n👉 NEXT STEP: Paste SQL in Supabase Dashboard:\n');
    console.log('   1. Go to: https://supabase.com/dashboard/project/xlejizyoggqdedjkyset/sql');
    console.log('   2. Copy contents of: supabase/migrations/001_complete_schema.sql');
    console.log('   3. Paste and click "Run"');
    console.log('   4. Then run: supabase/migrations/002_seed_data.sql');

  } catch (error) {
    console.error('\n❌ Error:', error);
  }
}

runMigration();
