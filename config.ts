```typescript
import { createClient } from '@supabase/supabase-js';
import { PoolConfig } from 'pg';

const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseKey = 'your-supabase-key';
const supabaseSecret = 'your-supabase-secret';

const poolConfig: PoolConfig = {
  // Update the pool configuration to prevent calling end on the pool prematurely
  // by setting the idleTimeoutMillis to a higher value or disabling it altogether
  idleTimeoutMillis: 0, // disable idle timeout
};

const supabase = createClient(supabaseUrl, supabaseKey, supabaseSecret, {
  // Update the pool configuration
  pool: poolConfig,
});

export default supabase;
```

Alternatively, if you are using an existing `Pool` instance, you can update its configuration as follows:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  user: 'your-database-username',
  host: 'your-database-host',
  database: 'your-database-name',
  password: 'your-database-password',
  port: 5432,
});

// Update the pool configuration to prevent calling end on the pool prematurely
pool.idleTimeoutMillis = 0; // disable idle timeout

export default pool;
```

Remember to replace the placeholders (`your-supabase-url`, `your-supabase-key`, `your-supabase-secret`, `your-database-username`, `your-database-host`, `your-database-name`, `your-database-password`) with your actual Supabase and database credentials.