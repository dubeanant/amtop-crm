import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

// POST - Delete user for testing (development only)
export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ 
      success: false, 
      error: "This endpoint is only available in development" 
    }, { status: 403 });
  }

  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { userUid } = await req.json();
    
    if (!userUid) {
      return NextResponse.json({ 
        success: false, 
        error: "User UID is required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    
    // Delete the user
    const result = await usersCollection.deleteOne({ uid: userUid });
    
    return NextResponse.json({
      success: true,
      message: `User deleted. Deleted count: ${result.deletedCount}`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("POST /api/debug/delete-user error:", error);
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