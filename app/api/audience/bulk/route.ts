import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

export async function POST(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { audience, name, tag, userEmail } = await req.json();

    if (!audience || !Array.isArray(audience) || !name || !tag || !userEmail) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing required fields: audience data, name, tag, or userEmail" 
      }, { status: 400 });
    }

    // Additional server-side validation
    if (audience.length > 100000) {
      return NextResponse.json({ 
        success: false, 
        error: "Maximum 100,000 entries allowed per upload. Please contact us for larger uploads." 
      }, { status: 400 });
    }

    // Validate data structure
    const validAudience = audience.filter((row: any) => {
      return (
        (row.Name && row.Name.trim() !== '') ||
        (row.name && row.name.trim() !== '') ||
        (row.Email && row.Email.trim() !== '') ||
        (row.email && row.email.trim() !== '')
      );
    });

    if (validAudience.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No valid audience data found" 
      }, { status: 400 });
    }

    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const audienceCollection = db.collection("leads");
    const tagsCollection = db.collection("pipeline_tags");

    // Get organization ID
    const usersCollection = db.collection("users");
    const user = await usersCollection.findOne({ email: userEmail });
    const organizationId = user?.organizationId;

    if (!organizationId) {
      return NextResponse.json({ 
        success: false, 
        error: "User organization not found" 
      }, { status: 400 });
    }

    // Get the first pipeline step to assign as default stage
    let defaultStage = 'New'; // Fallback default
    try {
      const stepsCollection = db.collection("pipeline_steps");
      const firstStep = await stepsCollection.findOne(
        { organizationId: organizationId, isActive: true },
        { sort: { order: 1 } }
      );
      if (firstStep) {
        defaultStage = firstStep.title;
      }
    } catch (error) {
      console.warn('Could not fetch first pipeline step, using default stage:', error);
    }

    // Check if tag exists, if not create it
    const existingTag = await tagsCollection.findOne({ 
      name: tag, 
      organizationId: organizationId 
    });

    if (!existingTag) {
      await tagsCollection.insertOne({
        name: tag,
        description: `Tag created for upload: ${name}`,
        organizationId: organizationId,
        createdBy: userEmail,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Prepare audience data for insertion
    const audienceWithMetadata = validAudience.map((row: any) => ({
      Name: row.Name || row.name || '',
      Email: row.Email || row.email || '',
      Bio: row.Bio || row.bio || row.Biography || row.biography || '',
      notes: row.Notes || row.notes || '',
      uploadedBy: userEmail,
      uploadedAt: new Date().toISOString(),
      stage: defaultStage, // Use first pipeline step as default stage
      stageUpdatedAt: new Date().toISOString(),
      stageUpdatedBy: userEmail,
      uploadName: name,
      tag: tag,
      uploadDate: new Date().toISOString(),
      organizationId: organizationId
    }));

    // Insert audience data
    const result = await audienceCollection.insertMany(audienceWithMetadata);

    return NextResponse.json({ 
      success: true, 
      insertedCount: result.insertedCount,
      message: `Successfully uploaded ${result.insertedCount} audience members`
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return NextResponse.json({ 
      success: false, 
      error: (error as Error).message 
    }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
} 