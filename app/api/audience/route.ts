import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { UserRole, ROLE_PERMISSIONS } from "../../types/auth";

interface Audience {
  Name?: string;
  Number?: string;
  Email?: string;
  Bio?: string;
  name?: string;
  number?: string;
  email?: string;
  bio?: string;
  biography?: string;
  Biography?: string;
  [key: string]: any; // Allow for additional fields
}

interface AudienceWithUserInfo extends Audience {
  uploadedBy: string;
  uploadedAt: string;
  stage: 'lead' | 'engaged' | 'warm';
  stageUpdatedAt: string;
  stageUpdatedBy: string;
}

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

export async function POST(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Check environment variables
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const requestData = await req.json();
    const { audience, userEmail } = requestData;
    
    if (!userEmail) {
      return NextResponse.json({ 
        success: false, 
        error: "User email is required" 
      }, { status: 400 });
    }

    // Filter out empty rows that Papa Parse might include
    const validAudience = audience.filter((audienceMember: Audience) => {
      if (!audienceMember) return false;
      
      // Check for any non-empty field - specifically looking for Name, Email, Bio fields
      const hasValidData = (
        (audienceMember.Name && audienceMember.Name.trim() !== '') ||
        (audienceMember.Email && audienceMember.Email.trim() !== '') ||
        (audienceMember.Bio && audienceMember.Bio.trim() !== '') ||
        // Also check lowercase versions for compatibility
        (audienceMember.name && audienceMember.name.trim() !== '') ||
        (audienceMember.email && audienceMember.email.trim() !== '') ||
        (audienceMember.bio && audienceMember.bio.trim() !== '') ||
        (audienceMember.biography && audienceMember.biography.trim() !== '') ||
        (audienceMember.Biography && audienceMember.Biography.trim() !== '')
      );
      
      return hasValidData;
    });
    
    // Add user info, timestamp, and default stage to each audience member
    const audienceWithUserInfo: AudienceWithUserInfo[] = validAudience.map((audienceMember: Audience) => ({
      ...audienceMember,
      uploadedBy: userEmail,
      uploadedAt: new Date().toISOString(),
      stage: 'New', // Default stage for new audience members
      stageUpdatedAt: new Date().toISOString(),
      stageUpdatedBy: userEmail,
      tag: audienceMember.tag || 'Untagged' // Add tag field
    }));

    if (audienceWithUserInfo.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No valid audience members found in the data" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const collection = db.collection("leads");
    
    const result = await collection.insertMany(audienceWithUserInfo);
    
    return NextResponse.json({ 
      success: true, 
      insertedCount: result.insertedCount 
    });
  } catch (error) {
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

export async function GET(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Check environment variables
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    // Get user email from query parameters
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
    const collection = db.collection("leads");
    
    // Get requesting user to check permissions
    const usersCollection = db.collection("users");
    const requestingUser = await usersCollection.findOne({ email: userEmail });
    
    if (!requestingUser) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 });
    }

    // Check permissions and get appropriate audience members
    const userPermissions = ROLE_PERMISSIONS[requestingUser.role as UserRole] || [];
    const canViewAll = userPermissions.some(p => 
      p.resource === 'audience' && (p.actions.includes('manage_all') || p.actions.includes('view_team'))
    );

    let audience;
    if (canViewAll && requestingUser.role === 'admin') {
      // Admin can see all audience members
      audience = await collection.find({}).toArray();
    } else {
      // Regular users can only see their own audience members
      audience = await collection.find({ uploadedBy: userEmail }).toArray();
    }
    
    return NextResponse.json(audience);
  } catch (error) {
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

export async function DELETE(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    // Check environment variables
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    // Get user email from query parameters
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
    const collection = db.collection("leads");
    const usersCollection = db.collection("users");
    
    // Get requesting user to check permissions
    const requestingUser = await usersCollection.findOne({ email: userEmail });
    
    if (!requestingUser) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 });
    }

    // Check permissions and delete appropriate audience members
    const userPermissions = ROLE_PERMISSIONS[requestingUser.role as UserRole] || [];
    const canDeleteAll = userPermissions.some(p => 
      p.resource === 'audience' && (p.actions.includes('manage_all') || p.actions.includes('delete_team'))
    );

    let result;
    if (canDeleteAll && requestingUser.role === 'admin') {
      // Admin can delete all audience members
      result = await collection.deleteMany({});
    } else {
      // Regular users can only delete their own audience members
      result = await collection.deleteMany({ uploadedBy: userEmail });
    }
    
    return NextResponse.json({ 
      success: true, 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
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