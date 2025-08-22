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

async function migrateOrganizationStructure() {
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

    // Step 1: Update organizations - remove domain field and add members array
    console.log('Updating organizations...');
    const organizations = await orgsCollection.find({}).toArray();

    for (const org of organizations) {
      const updates = {
        $unset: { domain: "" }, // Remove domain field
        $set: {
          updatedAt: new Date().toISOString(),
          members: org.members || [] // Keep existing members or initialize empty array
        }
      };

      // Remove allowDomainSignup from settings if it exists
      if (org.settings && org.settings.allowDomainSignup !== undefined) {
        updates.$unset['settings.allowDomainSignup'] = "";
      }

      await orgsCollection.updateOne(
        { _id: org._id },
        updates
      );

      console.log(`Updated organization: ${org.name}`);
    }

    // Step 2: Update users - add organizations array
    console.log('Updating users...');
    const users = await usersCollection.find({}).toArray();

    for (const user of users) {
      const updates = {
        $set: {
          updatedAt: new Date().toISOString(),
          organizations: user.organizations || (user.organizationId ? [user.organizationId] : [])
        }
      };

      await usersCollection.updateOne(
        { _id: user._id },
        updates
      );

      console.log(`Updated user: ${user.email}`);
    }

    // Step 3: Populate organization members arrays based on existing users
    console.log('Populating organization members...');

    for (const org of organizations) {
      // Find all users belonging to this organization
      const orgUsers = await usersCollection.find({
        $or: [
          { organizationId: org._id.toString() },
          { teamId: org._id.toString() } // backward compatibility
        ]
      }).toArray();

      const members = orgUsers.map(user => ({
        email: user.email,
        uid: user.uid,
        role: user.role === 'admin' ? 'admin' : 'user',
        joinedAt: user.createdAt || new Date().toISOString(),
        isActive: user.isActive !== false
      }));

      if (members.length > 0) {
        await orgsCollection.updateOne(
          { _id: org._id },
          {
            $set: {
              members: members,
              updatedAt: new Date().toISOString()
            }
          }
        );

        console.log(`Added ${members.length} members to organization: ${org.name}`);
      }
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run migration
migrateOrganizationStructure();