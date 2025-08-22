import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

// POST - Add member to organization
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { email, uid, role = 'user' } = await req.json();
    const { id: organizationId } = await params;
    
    if (!email || !uid || !organizationId) {
      return NextResponse.json({ 
        success: false, 
        error: "Email, UID, and organization ID are required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const orgsCollection = db.collection("organizations");
    const usersCollection = db.collection("users");
    
    // Check if organization exists
    const organization = await orgsCollection.findOne({ _id: new ObjectId(organizationId) });
    if (!organization) {
      return NextResponse.json({ 
        success: false, 
        error: "Organization not found" 
      }, { status: 404 });
    }

    // Check if member already exists
    const existingMember = organization.members?.find((member: any) => member.uid === uid);
    if (existingMember) {
      return NextResponse.json({ 
        success: false, 
        error: "User is already a member of this organization" 
      }, { status: 409 });
    }

    // Add member to organization
    const newMember = {
      email,
      uid,
      role,
      joinedAt: new Date().toISOString(),
      isActive: true
    };

    await orgsCollection.updateOne(
      { _id: new ObjectId(organizationId) },
      { 
        $push: { "members": newMember } as any,
        $set: { updatedAt: new Date().toISOString() }
      }
    );

    // Update user's organizations array
    await usersCollection.updateOne(
      { uid },
      { 
        $addToSet: { organizations: organizationId },
        $set: { 
          organizationId: organizationId, // Set as current active org if first one
          updatedAt: new Date().toISOString() 
        }
      }
    );
    
    return NextResponse.json({
      success: true,
      member: newMember
    });
  } catch (error) {
    console.error("POST /api/organizations/[id]/members error:", error);
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

// DELETE - Remove member from organization
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const memberUid = searchParams.get('uid');
    const { id: organizationId } = await params;
    
    if (!memberUid || !organizationId) {
      return NextResponse.json({ 
        success: false, 
        error: "Member UID and organization ID are required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const orgsCollection = db.collection("organizations");
    const usersCollection = db.collection("users");
    
    // Remove member from organization
    await orgsCollection.updateOne(
      { _id: new ObjectId(organizationId) },
      { 
        $pull: { "members": { uid: memberUid } } as any,
        $set: { updatedAt: new Date().toISOString() }
      }
    );

    // Remove organization from user's organizations array
    await usersCollection.updateOne(
      { uid: memberUid },
      { 
        $pull: { "organizations": organizationId } as any,
        $set: { updatedAt: new Date().toISOString() }
      }
    );
    
    return NextResponse.json({
      success: true,
      message: "Member removed successfully"
    });
  } catch (error) {
    console.error("DELETE /api/organizations/[id]/members error:", error);
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