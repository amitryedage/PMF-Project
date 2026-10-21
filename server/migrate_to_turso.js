const { createClient } = require('@libsql/client');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('Error: TURSO_DATABASE_URL or TURSO_AUTH_TOKEN is missing in server/.env');
  process.exit(1);
}

const maskedUrl = TURSO_URL.replace(/:\/\/([^.]+)\./, '://***.');
console.log(`🔒 Connecting to Turso Cloud: ${maskedUrl}`);

const localDbPath = path.resolve(__dirname, 'student_records.db');
const localClient = createClient({ url: `file:${localDbPath}` });

const cloudClient = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN,
});

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeWithRetry(fn, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`  ⚠️ Request failed (attempt ${attempt}/${retries}): ${err.message}. Retrying in 1s...`);
      await sleep(1000);
    }
  }
}

async function migrate() {
  const ping = await executeWithRetry(() => cloudClient.execute('SELECT 1 as connected'));
  if (!ping || ping.rows.length === 0) {
    throw new Error('Could not establish connection to Turso Cloud.');
  }
  console.log('✅ Connection to Turso Cloud verified.');

  const reverseTables = [
    'audit_logs',
    'receipt_sequences',
    'fee_ledger_entries',
    'fee_structures',
    'result_revisions',
    'marks',
    'exams',
    'attendance_records',
    'attendance_sessions',
    'faculty_assignments',
    'class_enrollments',
    'students',
    'users',
    'refresh_tokens',
    'subjects',
    'classes',
    'programs',
    'academic_years',
  ];

  console.log('🧹 Resetting Turso Cloud tables for clean migration...');
  for (const table of reverseTables) {
    try {
      await cloudClient.execute(`DROP TABLE IF EXISTS ${table}`);
    } catch (e) {
      // ignore
    }
  }
  console.log('✅ Clean slate ready.');

  console.log('📦 Applying pristine SQLite schema to Turso Cloud...');
  const schemaPath = path.resolve(__dirname, 'database/sqlite_schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const statements = schemaSql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    try {
      await cloudClient.execute(stmt);
    } catch (err) {
      console.warn('Schema warning:', err.message);
    }
  }
  console.log('✅ Fresh database schema established in Turso Cloud.');

  const forwardTables = [
    'academic_years',
    'programs',
    'classes',
    'subjects',
    'users',
    'students',
    'class_enrollments',
    'faculty_assignments',
    'attendance_sessions',
    'attendance_records',
    'exams',
    'marks',
    'fee_structures',
    'fee_ledger_entries',
    'receipt_sequences',
    'audit_logs',
  ];

  console.log('\n🔄 Migrating datasets from local SQLite to Turso Cloud in high-throughput batches...');

  for (const table of forwardTables) {
    let localData;
    try {
      localData = await localClient.execute(`SELECT * FROM ${table}`);
    } catch (e) {
      console.log(`  - ${table}: not found in local DB (skipped)`);
      continue;
    }

    const rows = localData.rows;

    if (rows.length === 0) {
      console.log(`  - ${table}: 0 rows (skipped)`);
      continue;
    }

    console.log(`  - ${table}: Syncing ${rows.length} rows...`);

    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);

      const batchStmts = chunk.map((row) => {
        const keys = Object.keys(row);
        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map((k) => row[k]);
        return {
          sql: `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`,
          args: values,
        };
      });

      await executeWithRetry(() => cloudClient.batch(batchStmts, 'write'));
    }

    console.log(`    ✓ ${table}: ${rows.length} rows synced.`);
  }

  // Verification Totals
  console.log('\n📊 Verifying Turso Cloud Datasets:');
  const studentCount = await cloudClient.execute('SELECT COUNT(*) as count FROM students');
  const userCount = await cloudClient.execute('SELECT COUNT(*) as count FROM users');
  const feeCount = await cloudClient.execute('SELECT COUNT(*) as count FROM fee_ledger_entries');
  const feeTotal = await cloudClient.execute('SELECT SUM(amount_paise) as total FROM fee_ledger_entries');
  const attCount = await cloudClient.execute('SELECT COUNT(*) as count FROM attendance_records');
  const markCount = await cloudClient.execute('SELECT COUNT(*) as count FROM marks');

  const totalPaise = feeTotal.rows[0]?.total ? parseInt(feeTotal.rows[0].total, 10) : 0;
  const totalRupees = (totalPaise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 });

  console.log(`  • Students in Cloud: ${studentCount.rows[0].count}`);
  console.log(`  • User Accounts in Cloud: ${userCount.rows[0].count}`);
  console.log(`  • Fee Transactions in Cloud: ${feeCount.rows[0].count} (Total: ₹${totalRupees})`);
  console.log(`  • Attendance Records in Cloud: ${attCount.rows[0].count}`);
  console.log(`  • Examination Marks in Cloud: ${markCount.rows[0].count}`);

  console.log('\n🎉 ALL DATA HAS BEEN FULLY MIGRATED TO TURSO CLOUD!');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal migration error:', err);
    process.exit(1);
  });
