const { MongoClient, ObjectId } = require('mongodb');
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

async function cleanupTestOrganization() {
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
    
    // Find and delete the test organization
    const testOrg = await orgsCollection.findOne({ name: 'Test Organization 3' });
    
    if (testOrg) {
      const orgId = testOrg._id.toString();
      
      // Remove organization
      await orgsCollection.deleteOne({ _id: testOrg._id });
      
      // Remove from user's organizations array
      await usersCollection.updateOne(
        { email: 'pandeyamarnath279@gmail.com' },
        { 
          $pull: { organizations: orgId },
          $set: { 
            organizationId: '68a811066a0eb36a3f553248', // Set back to amTop
            updatedAt: new Date().toISOString() 
          }
        }
      );
      
      console.log(`✅ Deleted test organization: ${testOrg.name} (${orgId})`);
      console.log('✅ Updated user profile to remove the test organization');
    } else {
      console.log('ℹ️ Test organization not found (already cleaned up?)');
    }
    
    // Verify final count
    const finalCount = await orgsCollection.countDocuments({
      "members.email": 'pandeyamarnath279@gmail.com',
      isActive: true
    });
    
    console.log(`\n📊 Final organization count: ${finalCount}/3`);
    
  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run cleanup
cleanupTestOrganization();