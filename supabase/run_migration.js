/**
 * DompetKu - Supabase Migration Runner
 * Run once: node supabase/run_migration.js
 * Requires: SUPABASE_SERVICE_ROLE_KEY environment variable OR
 * paste your service_role key from Supabase Dashboard > Settings > API
 */
const https = require('https');
const fs = require('fs');
const path = require('path');

// Get service role key — either from env or a local file
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error(`
❌ Missing SUPABASE_SERVICE_ROLE_KEY

To run migration you need the service_role key (NOT anon key).
Get it from: https://supabase.com/dashboard/project/areegmhyxwqlkyqgwkrd/settings/api

Then run:
  SUPABASE_SERVICE_ROLE_KEY=your_key node supabase/run_migration.js
`);
  process.exit(1);
}

const PROJECT_URL = 'areegmhyxwqlkyqgwkrd.supabase.co';
const sqlPath = path.join(__dirname, 'migrations', '20260401_initial_schema.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

function runSQL(statement) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: statement.trim() });
    const options = {
      hostname: PROJECT_URL,
      path: '/rest/v1/rpc/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body),
        'Prefer': 'return=minimal',
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Alternative: use pg REST endpoint
async function runMigration() {
  console.log('🚀 Running DompetKu migration...');
  const stmts = sql.split(';').map(s => s.trim()).filter(s => s.length > 5);
  let success = 0, failed = 0;
  for (const stmt of stmts) {
    const result = await runSQL(stmt + ';');
    if (result.status < 300) {
      success++;
    } else {
      console.warn(`⚠️  Statement failed [${result.status}]:`, stmt.slice(0, 80));
      failed++;
    }
  }
  console.log(`✅ Done: ${success} succeeded, ${failed} failed`);
}

runMigration().catch(console.error);
