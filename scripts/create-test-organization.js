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

async function createTestOrganization() {
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
    
    const userEmail = 'pandeyamarnath279@gmail.com';
    const userUid = 'tBMJdxa3enQTxyc4xqTQk2MsPXB2';
    
    // Check current count
    const currentCount = await orgsCollection.countDocuments({
      "members.email": userEmail,
      isActive: true
    });
    
    console.log(`Current organizations: ${currentCount}/3`);
    
    if (currentCount >= 3) {
      console.log('❌ User has already reached the limit. Cannot create more organizations.');
      return;
    }
    
    // Create third organization to test the limit
    const newOrg = {
      name: 'Test Organization 3',
      createdBy: userUid,
      members: [{
        email: userEmail,
        uid: userUid,
        role: 'admin',
        joinedAt: new Date().toISOString(),
        isActive: true
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      settings: {
        requireInvitation: true
      }
    };
    
    const result = await orgsCollection.insertOne(newOrg);
    const organizationId = result.insertedId.toString();
    
    // Update user's profile
    await usersCollection.updateOne(
      { uid: userUid },
      { 
        $addToSet: { organizations: organizationId },
        $set: { 
          organizationId: organizationId,
          updatedAt: new Date().toISOString() 
        }
      }
    );
    
    console.log(`✅ Created third organization: ${newOrg.name} (${organizationId})`);
    console.log('🔒 User should now be at the 3 organization limit');
    
  } catch (error) {
    console.error('Creation failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run creation
createTestOrganization();