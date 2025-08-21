import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

// POST - Migrate existing users to add teamId
export async function POST(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    console.log("POST /api/users/migrate - Starting...");
    
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { requestingUser } = await req.json();
    
    if (!requestingUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Requesting user email is required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    
    // Check if requesting user is admin
    const admin = await usersCollection.findOne({ email: requestingUser });
    
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: "Only admins can run migrations" 
      }, { status: 403 });
    }

    // Find users without teamId
    const usersWithoutTeamId = await usersCollection.find({
      $or: [
        { teamId: { $exists: false } },
        { teamId: null },
        { teamId: "" }
      ]
    }).toArray();

    let updatedCount = 0;

    // Update each user with teamId based on email domain
    for (const user of usersWithoutTeamId) {
      const emailDomain = user.email.split('@')[1];
      
      await usersCollection.updateOne(
        { _id: user._id },
        { 
          $set: { 
            teamId: emailDomain,
            updatedAt: new Date().toISOString()
          } 
        }
      );
      
      updatedCount++;
    }
    
    return NextResponse.json({
      success: true,
      message: `Migration completed. Updated ${updatedCount} users with teamId.`,
      updatedCount
    });
  } catch (error) {
    console.error("POST /api/users/migrate error:", error);
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