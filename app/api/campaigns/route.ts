import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { UserRole, ROLE_PERMISSIONS } from "../../types/auth";

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  type: 'email' | 'sms' | 'social' | 'ads';
  targetAudience: string;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  organizationId: string;
}

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

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
    const campaignsCollection = db.collection("campaigns");
    const usersCollection = db.collection("users");

    // Get requesting user to check permissions
    const requestingUser = await usersCollection.findOne({ email: userEmail });
    
    if (!requestingUser) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 });
    }

    // Check permissions and get appropriate campaigns
    const userPermissions = ROLE_PERMISSIONS[requestingUser.role as UserRole] || [];
    const canViewAll = userPermissions.some(p => 
      p.resource === 'campaign' && (p.actions.includes('manage_all') || p.actions.includes('view_team'))
    );

    let query = {};
    if (!canViewAll) {
      // User can only view campaigns they created or campaigns in their organization
      query = {
        $or: [
          { createdBy: userEmail },
          { organizationId: requestingUser.organizationId }
        ]
      };
    } else if (requestingUser.organizationId) {
      // Admin can view all campaigns in their organization
      query = { organizationId: requestingUser.organizationId };
    }

    const campaigns = await campaignsCollection.find(query).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
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

export async function POST(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const requestData = await req.json();
    const { name, description, type, targetAudience, startDate, endDate, userEmail } = requestData;
    
    if (!userEmail) {
      return NextResponse.json({ 
        success: false, 
        error: "User email is required" 
      }, { status: 400 });
    }

    if (!name || !description) {
      return NextResponse.json({ 
        success: false, 
        error: "Campaign name and description are required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const campaignsCollection = db.collection("campaigns");
    const usersCollection = db.collection("users");

    // Get user to check permissions and get organization ID
    const user = await usersCollection.findOne({ email: userEmail });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 });
    }

    // Check if user has permission to create campaigns
    const userPermissions = ROLE_PERMISSIONS[user.role as UserRole] || [];
    const canCreate = userPermissions.some(p => 
      p.resource === 'campaign' && p.actions.includes('create')
    );

    if (!canCreate) {
      return NextResponse.json({ 
        success: false, 
        error: "You don't have permission to create campaigns" 
      }, { status: 403 });
    }

    const newCampaign: Campaign = {
      id: Math.random().toString(36).substr(2, 9), // Simple ID generation
      name: name.trim(),
      description: description.trim(),
      status: 'draft',
      type: type || 'email',
      targetAudience: targetAudience || '',
      startDate: startDate || '',
      endDate: endDate || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: userEmail,
      organizationId: user.organizationId || ''
    };

    const result = await campaignsCollection.insertOne(newCampaign);
    
    if (result.acknowledged) {
      return NextResponse.json({ 
        success: true, 
        campaign: newCampaign 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Failed to create campaign" 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating campaign:', error);
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



