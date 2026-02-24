import { Pool, PoolClient } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const dbPassword = process.env.DATABASE_PASSWORD || '';
const encodedPassword = encodeURIComponent(dbPassword);

// Database connection configuration
const dbConfig = {
  connectionString: `postgresql://postgres:${encodedPassword}@db.wzoftsathxrafpbtowwu.supabase.co:5432/postgres`,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 2000, // How long to wait when connecting a new client
};

// Create a connection pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    console.log('Database connected successfully:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

// Get a client from the pool
export async function getClient(): Promise<PoolClient> {
  return await pool.connect();
}

// Execute a query with automatic client management
export async function query(text: string, params?: any[]): Promise<any> {
  const start = Date.now();
  const client = await pool.connect();

  try {
    const result = await client.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Query error:', { text, error });
    throw error;
  } finally {
    client.release();
  }
}

// Execute a transaction
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Close all connections in the pool
export async function closePool(): Promise<void> {
  await pool.end();
  console.log('Database connection pool closed');
}

// Export the pool for advanced usage
export { pool };

// Database health check
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
  try {
    const result = await query('SELECT NOW() as timestamp, \'healthy\' as status');
    return {
      status: result.rows[0].status,
      timestamp: result.rows[0].timestamp
    };
  } catch (error) {
    throw new Error(`Database health check failed: ${error}`);
  }
}
