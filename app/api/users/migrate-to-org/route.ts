import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

// POST - Migrate existing users to use organizationId and trigger onboarding for domain-based teamIds
export async function POST(req: NextRequest) {
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
    
    // Find the user
    const user = await usersCollection.findOne({ uid: userUid });
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 });
    }

    // Check if user has domain-based teamId (like gmail.com, yahoo.com, etc.)
    const emailDomain = user.email.split('@')[1];
    const isDomainBasedTeam = user.teamId === emailDomain;
    
    if (isDomainBasedTeam) {
      // Remove the user profile to trigger onboarding
      await usersCollection.deleteOne({ uid: userUid });
      
      return NextResponse.json({
        success: true,
        message: "User profile removed. Onboarding will be triggered on next login.",
        needsOnboarding: true
      });
    } else {
      // User has a proper team name, just migrate to organizationId
      await usersCollection.updateOne(
        { uid: userUid },
        { 
          $set: { 
            organizationId: user.teamId,
            updatedAt: new Date().toISOString()
          }
        }
      );
      
      return NextResponse.json({
        success: true,
        message: "User migrated to organization structure",
        needsOnboarding: false
      });
    }
  } catch (error) {
    console.error("POST /api/users/migrate-to-org error:", error);
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