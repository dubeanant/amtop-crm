import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

// GET user's organizations by UID (query parameter)
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
    const userUid = searchParams.get('uid');
    
    if (!userUid) {
      return NextResponse.json({ 
        success: false, 
        error: "User UID is required as query parameter" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const orgsCollection = db.collection("organizations");
    
    // Find all organizations where the user is a member
    const organizations = await orgsCollection.find({
      "members.uid": userUid,
      isActive: true
    }).toArray();
    
    const userOrganizations = organizations.map(org => {
      const userMember = org.members.find((member: any) => member.uid === userUid);
      return {
        id: org._id.toString(),
        name: org.name,
        role: userMember?.role || 'user',
        joinedAt: userMember?.joinedAt,
        isActive: userMember?.isActive !== false,
        createdAt: org.createdAt,
        memberCount: org.members?.length || 0
      };
    });
    
    return NextResponse.json({
      success: true,
      organizations: userOrganizations
    });
  } catch (error) {
    console.error("GET /api/users/organizations-by-uid error:", error);
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