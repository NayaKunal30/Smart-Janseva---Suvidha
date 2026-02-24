# PostgreSQL Database Connection

This project now includes direct PostgreSQL database connection to your Supabase database.

## Setup Instructions

### 1. Update Your Database Password

Replace `YOUR-PASSWORD` in the `.env` file with your actual Supabase database password:

```env
DATABASE_PASSWORD=your-actual-password-here
SUPABASE_DB_PASSWORD=your-actual-password-here
```

### 2. Connection Details

- **Host**: `db.wzoftsathxrafpbtowwu.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Connection Type**: Direct PostgreSQL connection

### 3. Usage

The database connection is available in `src/db/postgresql.ts` with the following exports:

```typescript
import { 
  testConnection, 
  query, 
  transaction, 
  getClient, 
  healthCheck, 
  closePool 
} from '@/db/postgresql';

// Test connection
await testConnection();

// Simple query
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);

// Transaction
await transaction(async (client) => {
  await client.query('INSERT INTO logs (message) VALUES ($1)', ['Test']);
  await client.query('UPDATE users SET last_login = NOW() WHERE id = $1', [userId]);
});

// Get client for advanced usage
const client = await getClient();
try {
  const result = await client.query('SELECT * FROM table');
} finally {
  client.release();
}
```

### 4. Test the Connection

Run the test script to verify your database connection:

```bash
npx tsx src/db/test-connection.ts
```

### 5. Connection Pool Configuration

The connection pool is configured with:
- **Max connections**: 20
- **Idle timeout**: 30 seconds
- **Connection timeout**: 2 seconds
- **SSL**: Enabled with `rejectUnauthorized: false`

### 6. Important Notes

- The connection uses SSL for security
- Connection pooling is enabled for better performance
- Error handling and logging are built-in
- The pool automatically handles connection cleanup

### 7. Environment Variables

Make sure these environment variables are set in your `.env` file:

```env
DATABASE_PASSWORD=your-supabase-db-password
SUPABASE_DB_PASSWORD=your-supabase-db-password
```

## Migration from Supabase Client

You can now use direct PostgreSQL queries instead of the Supabase client for better performance and control:

**Before (Supabase Client):**
```typescript
const { data, error } = await supabase
  .from('users')
  .select('*')
  .eq('id', userId);
```

**After (Direct PostgreSQL):**
```typescript
const result = await query('SELECT * FROM users WHERE id = $1', [userId]);
const data = result.rows;
```

## Security Considerations

- Never commit your actual database password to version control
- Use environment variables for sensitive data
- The connection uses SSL but `rejectUnauthorized: false` - consider using proper SSL certificates in production
- Always validate and sanitize user inputs before using them in queries
