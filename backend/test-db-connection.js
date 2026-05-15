// Test if migration has been run
import { supabase } from './config/supabase.js';

async function testConnection() {
  console.log('Testing Supabase connection...\n');
  
  try {
    // Check if users table exists
    const { data: users, error } = await supabase
      .from('users')
      .select('wallet_address, role, display_name')
      .limit(5);
    
    if (error) {
      console.error('❌ ERROR:', error.message);
      console.log('\n⚠️  The migration has NOT been run yet!');
      console.log('👉 Go to Supabase Dashboard → SQL Editor');
      console.log('👉 Run the migration from: backend/migrations/wallet-auth-migration.sql\n');
      return;
    }
    
    console.log('✅ Users table exists!');
    console.log('\nRegistered wallets:');
    console.log('═══════════════════════════════════════════════\n');
    
    if (users && users.length > 0) {
      users.forEach(user => {
        console.log(`Wallet: ${user.wallet_address}`);
        console.log(`Role:   ${user.role}`);
        console.log(`Name:   ${user.display_name || 'N/A'}`);
        console.log('─────────────────────────────────────────────');
      });
    } else {
      console.log('⚠️  No users found in database!');
      console.log('The migration may have been run but users were not inserted.');
    }
    
  } catch (err) {
    console.error('❌ UNEXPECTED ERROR:', err);
  }
}

testConnection();
