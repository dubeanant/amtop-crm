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

async function testOrganizationCreation() {
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
    
    // Get current user
    const user = await usersCollection.findOne({ email: 'pandeyamarnath279@gmail.com' });
    console.log('\n=== CURRENT USER ===');
    console.log(`Email: ${user.email}`);
    console.log(`Current Org: ${user.organizationId}`);
    console.log(`Organizations: ${user.organizations ? user.organizations.join(', ') : 'None'}`);
    
    // Get organizations where user is a member
    console.log('\n=== ORGANIZATIONS WHERE USER IS MEMBER ===');
    const userOrganizations = await orgsCollection.find({
      "members.email": user.email,
      isActive: true
    }).toArray();
    
    userOrganizations.forEach(org => {
      const userMember = org.members.find(member => member.email === user.email);
      console.log(`- ${org.name} (${org._id}) - Role: ${userMember.role}`);
    });
    
    console.log(`\nTotal organizations user is member of: ${userOrganizations.length}`);
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run test
testOrganizationCreation();