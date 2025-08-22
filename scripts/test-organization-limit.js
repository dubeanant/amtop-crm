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

async function testOrganizationLimit() {
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
    
    // Check current organization count for the user
    const userEmail = 'pandeyamarnath279@gmail.com';
    const userOrganizationsCount = await orgsCollection.countDocuments({
      "members.email": userEmail,
      isActive: true
    });
    
    console.log(`\n=== ORGANIZATION LIMIT TEST ===`);
    console.log(`User: ${userEmail}`);
    console.log(`Current organizations: ${userOrganizationsCount}/3`);
    
    if (userOrganizationsCount >= 3) {
      console.log('✅ User has reached the maximum limit of 3 organizations');
      console.log('❌ Creating new organization should be blocked');
    } else {
      console.log(`✅ User can create ${3 - userOrganizationsCount} more organization(s)`);
    }
    
    // List all organizations the user is a member of
    const userOrganizations = await orgsCollection.find({
      "members.email": userEmail,
      isActive: true
    }).toArray();
    
    console.log('\n=== USER ORGANIZATIONS ===');
    userOrganizations.forEach((org, index) => {
      const userMember = org.members.find(member => member.email === userEmail);
      console.log(`${index + 1}. ${org.name} (${org._id}) - Role: ${userMember.role}`);
    });
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run test
testOrganizationLimit();