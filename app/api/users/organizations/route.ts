import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

// GET - Get all organizations a user is part of
export async function GET(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const userEmail = searchParams.get('userEmail');
    
    if (!userEmail) {
      return NextResponse.json({ 
        success: false, 
        error: "User email is required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    const organizationsCollection = db.collection("organizations");
    
    // Get user profile
    const userProfile = await usersCollection.findOne({ email: userEmail });
    
    if (!userProfile) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 });
    }

    // Find all organizations where the user is a member
    const organizations = await organizationsCollection.find({
      "members.email": userEmail,
      isActive: true
    }).toArray();

    // Combine organization data with user's role in each organization
    const userOrganizations = organizations.map(org => {
      const userMember = org.members?.find((member: any) => member.email === userEmail);
      return {
        id: org._id.toString(),
        name: org.name,
        createdAt: org.createdAt,
        userRole: userMember?.role || 'user',
        isActive: userMember?.isActive !== false,
        isCurrent: org._id.toString() === userProfile.organizationId,
        memberCount: org.members?.length || 0
      };
    });

    return NextResponse.json({
      success: true,
      organizations: userOrganizations,
      currentOrganization: userOrganizations.find(org => org.isCurrent)
    });
  } catch (error) {
    console.error("GET /api/users/organizations error:", error);
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