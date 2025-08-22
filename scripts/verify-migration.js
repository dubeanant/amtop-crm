const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        process.env[key] = valueParts.join('=');
      }
    }
  });
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

async function verifyMigration() {
  if (!uri || !dbName) {
    console.error('Missing MongoDB configuration');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const orgsCollection = db.collection('organizations');
    const usersCollection = db.collection('users');
    
    console.log('\n=== ORGANIZATIONS ===');
    const organizations = await orgsCollection.find({}).toArray();
    organizations.forEach(org => {
      console.log(`\nOrganization: ${org.name}`);
      console.log(`  ID: ${org._id}`);
      console.log(`  Domain: ${org.domain || 'REMOVED ✓'}`);
      console.log(`  Members: ${org.members ? org.members.length : 0}`);
      if (org.members && org.members.length > 0) {
        org.members.forEach(member => {
          console.log(`    - ${member.email} (${member.uid}) - Role: ${member.role}`);
        });
      }
      console.log(`  Settings: ${JSON.stringify(org.settings)}`);
    });
    
    console.log('\n=== USERS ===');
    const users = await usersCollection.find({}).toArray();
    users.forEach(user => {
      console.log(`\nUser: ${user.email}`);
      console.log(`  UID: ${user.uid}`);
      console.log(`  Current Org: ${user.organizationId}`);
      console.log(`  Organizations: ${user.organizations ? user.organizations.join(', ') : 'None'}`);
      console.log(`  Role: ${user.role}`);
    });
    
    console.log('\n=== MIGRATION VERIFICATION COMPLETE ===');
    
  } catch (error) {
    console.error('Verification failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run verification
verifyMigration();