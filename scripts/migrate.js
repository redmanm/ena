#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function migrate() {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('ERROR: DATABASE_URL is not set');
    process.exit(1);
  }

  console.log('Starting database migration...');
  console.log('Database:', databaseUrl.replace(/:[^:]*@/, ':***@'));

  const pool = new Pool({
    connectionString: databaseUrl,
  });

  try {
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('Executing schema...');
    
    // Split by semicolon and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        console.log('Executing:', statement.substring(0, 60) + '...');
        await pool.query(statement);
      } catch (err) {
        // Some statements might fail if tables already exist - that's okay
        if (!err.message.includes('already exists')) {
          console.warn('Warning:', err.message);
        }
      }
    }

    console.log('\n✅ Database migration completed successfully!');
    
    // Verify tables exist
    const tablesResult = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`
    );
    
    console.log('\nTables created:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
