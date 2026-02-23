import { supabase } from './config/supabase.js';

async function testConnection() {
  console.log('Testing Supabase connection...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1. Checking evidences table...');
    const { data: evidences, error: evidenceError } = await supabase
      .from('evidences')
      .select('count')
      .limit(1);

    if (evidenceError) {
      console.error('❌ Evidences table error:', evidenceError.message);
      console.log('\n⚠️  You need to create the tables in Supabase!');
      console.log('Go to Supabase Dashboard → SQL Editor and run the SQL provided.\n');
      return;
    }
    console.log('✅ Evidences table exists\n');

    // Test 2: Check access_logs table
    console.log('2. Checking access_logs table...');
    const { data: logs, error: logsError } = await supabase
      .from('access_logs')
      .select('count')
      .limit(1);

    if (logsError) {
      console.error('❌ Access logs table error:', logsError.message);
      console.log('\n⚠️  You need to create the tables in Supabase!');
      console.log('Go to Supabase Dashboard → SQL Editor and run the SQL provided.\n');
      return;
    }
    console.log('✅ Access logs table exists\n');

    console.log('🎉 Supabase connection successful!');
    console.log('✅ All tables are ready to use.\n');

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n⚠️  Check your .env file:');
    console.log('   - SUPABASE_URL');
    console.log('   - SUPABASE_ANON_KEY\n');
  }
}

testConnection();
