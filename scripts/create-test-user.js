const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('[v0] DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: url });

async function createTestUser() {
  try {
    const testEmail = 'test@example.com';
    const testPassword = 'TestPassword123!';
    const passwordRounds = parseInt(process.env.PASSWORD_SALT_ROUNDS || '10');

    // Hash the password
    const passwordHash = await bcrypt.hash(testPassword, passwordRounds);

    console.log('[v0] Creating test user with email:', testEmail);
    console.log('[v0] Password:', testPassword);

    // Check if user exists
    const { rows: existing } = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [testEmail]
    );

    if (existing.length > 0) {
      console.log('[v0] User already exists, updating password...');
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = now() WHERE email = $2',
        [passwordHash, testEmail]
      );
    } else {
      console.log('[v0] Creating new user...');
      const { rows } = await pool.query(
        `INSERT INTO users (
          id, email, full_name, password_hash, role, status, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, now(), now()
        ) RETURNING id, email`,
        [testEmail, 'Test User', passwordHash, 'Admin', 'Active']
      );
      console.log('[v0] Created user:', rows[0]);
    }

    console.log('[v0] ✅ Test user ready');
    console.log('[v0] Email: ' + testEmail);
    console.log('[v0] Password: ' + testPassword);
    process.exit(0);
  } catch (error) {
    console.error('[v0] Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createTestUser();
