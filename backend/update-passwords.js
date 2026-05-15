import bcrypt from 'bcryptjs';
import { supabase } from './config/supabase.js';

async function updatePasswords() {
  console.log('Updating default user passwords...\n');

  const users = [
    { username: 'superadmin', password: 'superadmin123' },
    { username: 'admin', password: 'admin123' },
    { username: 'investigator', password: 'investigator123' },
    { username: 'viewer', password: 'viewer123' }
  ];

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    
    const { error } = await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('username', user.username);

    if (error) {
      console.log(`❌ Failed to update ${user.username}: ${error.message}`);
    } else {
      console.log(`✅ Updated ${user.username} password`);
    }
  }

  console.log('\n✅ All passwords updated!');
  console.log('\nDefault credentials:');
  console.log('  superadmin / superadmin123');
  console.log('  admin / admin123');
  console.log('  investigator / investigator123');
  console.log('  viewer / viewer123');
  console.log('\n⚠️  Change these passwords after first login!');
}

updatePasswords();
