import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

// POST - Switch user to a different organization
export async function POST(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { userEmail, organizationId } = await req.json();
    
    if (!userEmail || !organizationId) {
      return NextResponse.json({ 
        success: false, 
        error: "User email and organization ID are required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    const organizationsCollection = db.collection("organizations");
    
    // Verify the organization exists
    const organization = await organizationsCollection.findOne({ 
      _id: new ObjectId(organizationId) 
    });
    
    if (!organization) {
      return NextResponse.json({ 
        success: false, 
        error: "Organization not found" 
      }, { status: 404 });
    }

    // Check if user has access to this organization (check if user is a member)
    const isMember = organization.members?.some((member: any) => 
      member.email === userEmail && member.isActive !== false
    );
    
    if (!isMember) {
      return NextResponse.json({ 
        success: false, 
        error: "User is not a member of this organization" 
      }, { status: 403 });
    }

    // Get user profile and update current organization
    const userProfile = await usersCollection.findOne({ email: userEmail });
    
    if (!userProfile) {
      return NextResponse.json({ 
        success: false, 
        error: "User profile not found" 
      }, { status: 404 });
    }

    // Update user's current organization
    await usersCollection.updateOne(
      { email: userEmail },
      { 
        $set: { 
          organizationId: organizationId,
          updatedAt: new Date().toISOString()
        }
      }
    );

    // Get user's role in this organization
    const userMember = organization.members.find((member: any) => member.email === userEmail);
    
    return NextResponse.json({
      success: true,
      message: "Organization switched successfully",
      organization: {
        id: organization._id.toString(),
        name: organization.name,
        memberCount: organization.members?.length || 0
      },
      userRole: userMember?.role || 'user'
    });
  } catch (error) {
    console.error("POST /api/users/switch-organization error:", error);
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