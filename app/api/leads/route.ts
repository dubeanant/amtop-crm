import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { UserRole, ROLE_PERMISSIONS } from "../../types/auth";

interface Lead {
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

interface LeadWithUserInfo extends Lead {
  uploadedBy: string;
  uploadedAt: string;
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
    const { leads, userEmail } = requestData;
    
    if (!userEmail) {
      return NextResponse.json({ 
        success: false, 
        error: "User email is required" 
      }, { status: 400 });
    }

    // Filter out empty rows that Papa Parse might include
    const validLeads = leads.filter((lead: Lead) => {
      if (!lead) return false;
      
      // Check for any non-empty field - specifically looking for Name, Number, Email, Bio fields
      const hasValidData = (
        (lead.Name && lead.Name.trim() !== '') ||
        (lead.Number && lead.Number.trim() !== '') ||
        (lead.Email && lead.Email.trim() !== '') ||
        (lead.Bio && lead.Bio.trim() !== '') ||
        // Also check lowercase versions for compatibility
        (lead.name && lead.name.trim() !== '') ||
        (lead.number && lead.number.trim() !== '') ||
        (lead.email && lead.email.trim() !== '') ||
        (lead.bio && lead.bio.trim() !== '') ||
        (lead.biography && lead.biography.trim() !== '') ||
        (lead.Biography && lead.Biography.trim() !== '')
      );
      
      return hasValidData;
    });
    
    // Add user info and timestamp to each lead
    const leadsWithUserInfo: LeadWithUserInfo[] = validLeads.map((lead: Lead) => ({
      ...lead,
      uploadedBy: userEmail,
      uploadedAt: new Date().toISOString()
    }));

    if (leadsWithUserInfo.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No valid leads found in the data" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const collection = db.collection("leads");
    
    const result = await collection.insertMany(leadsWithUserInfo);
    
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

    // Check permissions and get appropriate leads
    const userPermissions = ROLE_PERMISSIONS[requestingUser.role as UserRole] || [];
    const canViewAll = userPermissions.some(p => 
      p.resource === 'leads' && (p.actions.includes('manage_all') || p.actions.includes('view_team'))
    );

    let leads;
    if (canViewAll && requestingUser.role === 'admin') {
      // Admin can see all leads
      leads = await collection.find({}).toArray();
    } else {
      // Regular users can only see their own leads
      leads = await collection.find({ uploadedBy: userEmail }).toArray();
    }
    
    return NextResponse.json(leads);
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

    // Check permissions and delete appropriate leads
    const userPermissions = ROLE_PERMISSIONS[requestingUser.role as UserRole] || [];
    const canDeleteAll = userPermissions.some(p => 
      p.resource === 'leads' && (p.actions.includes('manage_all') || p.actions.includes('delete_team'))
    );

    let result;
    if (canDeleteAll && requestingUser.role === 'admin') {
      // Admin can delete all leads
      result = await collection.deleteMany({});
    } else {
      // Regular users can only delete their own leads
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