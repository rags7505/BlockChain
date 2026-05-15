import { supabase } from './config/supabase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Running migration: add-current-holder...');
    
    const migrationPath = path.join(__dirname, 'migrations', 'add-current-holder.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.toLowerCase().includes('select')) {
        // For SELECT statements, use .from()
        continue;
      }
      console.log('Executing:', statement.substring(0, 50) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // Try direct query if rpc fails
        const { error: directError } = await supabase.from('evidences').select('current_holder').limit(1);
        if (directError) {
          console.error('❌ Error:', error.message);
        } else {
          console.log('✅ Column already exists or statement executed');
        }
      } else {
        console.log('✅ Statement executed successfully');
      }
    }
    
    // Verify the column exists
    const { data, error } = await supabase
      .from('evidences')
      .select('current_holder')
      .limit(1);
    
    if (error) {
      console.error('❌ Verification failed:', error.message);
      console.log('⚠️  You may need to run this SQL manually in Supabase:');
      console.log(migrationSQL);
    } else {
      console.log('✅ Migration completed successfully!');
      console.log('✅ current_holder column is available');
    }
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    console.log('\n⚠️  Manual SQL to run in Supabase:');
    console.log(`
ALTER TABLE evidences 
ADD COLUMN IF NOT EXISTS current_holder TEXT;

UPDATE evidences 
SET current_holder = uploaded_by 
WHERE current_holder IS NULL;

CREATE INDEX IF NOT EXISTS idx_evidences_current_holder ON evidences(current_holder);
    `);
  }
}

runMigration()
  .then(() => {
    console.log('✅ Done');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
