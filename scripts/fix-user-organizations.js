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

async function fixUserOrganizations() {
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
    console.log('\n=== BEFORE FIX ===');
    console.log(`Email: ${user.email}`);
    console.log(`Current Org: ${user.organizationId}`);
    console.log(`Organizations: ${user.organizations ? user.organizations.join(', ') : 'None'}`);
    
    // Get all organizations where user is a member
    const userOrganizations = await orgsCollection.find({
      "members.email": user.email,
      isActive: true
    }).toArray();
    
    const organizationIds = userOrganizations.map(org => org._id.toString());
    console.log(`\nFound ${organizationIds.length} organizations: ${organizationIds.join(', ')}`);
    
    // Update user profile with all organization IDs
    await usersCollection.updateOne(
      { email: user.email },
      { 
        $set: { 
          organizations: organizationIds,
          updatedAt: new Date().toISOString()
        }
      }
    );
    
    // Get updated user
    const updatedUser = await usersCollection.findOne({ email: 'pandeyamarnath279@gmail.com' });
    console.log('\n=== AFTER FIX ===');
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Current Org: ${updatedUser.organizationId}`);
    console.log(`Organizations: ${updatedUser.organizations ? updatedUser.organizations.join(', ') : 'None'}`);
    
    console.log('\n✅ User organizations array updated successfully!');
    
  } catch (error) {
    console.error('Fix failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run fix
fixUserOrganizations();