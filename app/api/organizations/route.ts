import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

export interface OrganizationMember {
  email: string;
  uid: string; // Firebase UID
  role: 'admin' | 'user' | 'viewer';
  joinedAt: string;
  isActive: boolean;
}

export interface Organization {
  _id?: ObjectId;
  name: string;
  createdBy: string; // User UID who created the organization
  members: OrganizationMember[]; // Array of all employees with emails and UIDs
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  settings?: {
    requireInvitation?: boolean;
  };
}

// GET all organizations (admin only)
export async function GET(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const orgsCollection = db.collection("organizations");
    
    const organizations = await orgsCollection.find({ isActive: true }).toArray();
    
    return NextResponse.json({
      success: true,
      organizations: organizations.map(org => ({
        id: org._id.toString(),
        name: org.name,
        members: org.members || [],
        createdAt: org.createdAt,
        settings: org.settings
      }))
    });
  } catch (error) {
    console.error("GET /api/organizations error:", error);
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

// POST - Create new organization
export async function POST(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { name, createdBy, creatorEmail } = await req.json();
    
    if (!name || !createdBy || !creatorEmail) {
      return NextResponse.json({ 
        success: false, 
        error: "Organization name, creator UID, and creator email are required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const orgsCollection = db.collection("organizations");
    const usersCollection = db.collection("users");

    // Check if user has reached the organization limit (3 organizations max)
    const userOrganizationsCount = await orgsCollection.countDocuments({
      "members.email": creatorEmail,
      isActive: true
    });

    if (userOrganizationsCount >= 3) {
      return NextResponse.json({ 
        success: false, 
        error: "You have reached the maximum limit of 3 organizations. Please contact support if you need more." 
      }, { status: 403 });
    }

    const newOrg: Organization = {
      name: name.trim(),
      createdBy,
      members: [{
        email: creatorEmail,
        uid: createdBy,
        role: 'admin',
        joinedAt: new Date().toISOString(),
        isActive: true
      }],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      settings: {
        requireInvitation: true
      }
    };
    
    const result = await orgsCollection.insertOne(newOrg);
    const organizationId = result.insertedId.toString();
    
    // Update user's profile to include this organization
    await usersCollection.updateOne(
      { uid: createdBy },
      { 
        $addToSet: { organizations: organizationId },
        $set: { 
          organizationId: organizationId, // Set as current active organization
          updatedAt: new Date().toISOString() 
        }
      }
    );
    
    return NextResponse.json({
      success: true,
      organization: {
        id: organizationId,
        name: newOrg.name,
        members: newOrg.members,
        createdAt: newOrg.createdAt,
        settings: newOrg.settings
      }
    });
  } catch (error) {
    console.error("POST /api/organizations error:", error);
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