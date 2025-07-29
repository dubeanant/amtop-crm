// Simple test script to verify pipeline functionality
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'your-mongodb-uri';
const dbName = process.env.MONGODB_DB || 'your-db-name';

async function testPipeline() {
  if (!uri || uri === 'your-mongodb-uri') {
    console.log('❌ MongoDB URI not configured. Please check your .env.local file.');
    return;
  }

  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(dbName);
    const collection = db.collection('leads');

    // Check if leads collection exists and has data
    const leadCount = await collection.countDocuments();
    console.log(`📊 Total leads in database: ${leadCount}`);

    if (leadCount > 0) {
      // Check stage distribution
      const stageStats = await collection.aggregate([
        {
          $group: {
            _id: { $ifNull: ['$stage', 'lead'] },
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      console.log('\n📈 Stage Distribution:');
      stageStats.forEach(stat => {
        console.log(`  ${stat._id}: ${stat.count} leads`);
      });

      // Sample a few leads to check structure
      const sampleLeads = await collection.find({}).limit(3).toArray();
      console.log('\n🔍 Sample lead structure:');
      sampleLeads.forEach((lead, index) => {
        console.log(`  Lead ${index + 1}:`);
        console.log(`    Name: ${lead.Name || lead.name || 'N/A'}`);
        console.log(`    Email: ${lead.Email || lead.email || 'N/A'}`);
        console.log(`    Stage: ${lead.stage || 'lead'}`);
        console.log(`    Uploaded by: ${lead.uploadedBy || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('ℹ️  No leads found. Upload some leads to test the pipeline functionality.');
    }

  } catch (error) {
    console.error('❌ Error testing pipeline:', error.message);
  } finally {
    if (client) {
      await client.close();
      console.log('✅ Disconnected from MongoDB');
    }
  }
}

// Run the test
testPipeline().catch(console.error);