import { createClient, Client } from '@libsql/client';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const DB_FILE = path.resolve(process.cwd(), 'student_records.db');

export const client: Client = createClient({
  url: `file:${DB_FILE}`,
});

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export const query = async <T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  let normalizedSql = text;
  let args = (params || []).map((p) => (p === undefined ? null : p));

  if (/get_next_receipt_number/i.test(normalizedSql)) {
    const fy = args[0];
    const seqRes = await client.execute({
      sql: `INSERT INTO receipt_sequences (financial_year, last_receipt_number)
            VALUES (?, 1)
            ON CONFLICT (financial_year) DO UPDATE
            SET last_receipt_number = receipt_sequences.last_receipt_number + 1
            RETURNING last_receipt_number as receipt_no`,
      args: [fy],
    });
    return {
      rows: seqRes.rows as unknown as T[],
      rowCount: seqRes.rows.length,
    };
  }

  normalizedSql = normalizedSql
    .replace(/\bILIKE\b/gi, 'LIKE')
    .replace(/\bNOW\(\)/gi, "datetime('now')")
    .replace(/::(int|bigint|numeric)/gi, '');

  normalizedSql = normalizedSql.replace(/\$(\d+)/g, '?');

  if (/^\s*INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES/i.test(normalizedSql)) {
    const match = normalizedSql.match(/^\s*INSERT\s+INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)(.*)$/i);
    if (match) {
      const table = match[1];
      const columns = match[2].split(',').map((c) => c.trim().toLowerCase());
      if (!columns.includes('id')) {
        const rest = match[4] || '';
        normalizedSql = `INSERT INTO ${table} (id, ${match[2]}) VALUES (?, ${match[3]})${rest}`;
        args = [crypto.randomUUID(), ...args];
      }
    }
  }

  const res = await client.execute({
    sql: normalizedSql,
    args,
  });

  return {
    rows: res.rows as unknown as T[],
    rowCount: res.rows.length,
  };
};

export const pool = {
  connect: async () => ({
    query: <T = any>(t: string, p?: any[]) => query<T>(t, p),
    release: () => {},
  }),
  end: async () => {
    await client.close();
  },
};

export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const res = await query('SELECT 1 as healthy');
    return res.rowCount > 0;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

export const initSqliteDatabase = async (): Promise<void> => {
  try {
    const schemaPath = path.resolve(__dirname, '../../database/sqlite_schema.sql');
    const seedPath = path.resolve(__dirname, '../../database/sqlite_seed.sql');

    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      const statements = schemaSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        await client.execute(statement);
      }
    }

    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf8');
      const seedStatements = seedSql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of seedStatements) {
        await client.execute(statement);
      }
    }
  } catch (err) {
    console.error('Error initializing SQLite schema:', err);
  }
};
