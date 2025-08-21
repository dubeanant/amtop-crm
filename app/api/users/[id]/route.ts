import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { UserRole, ROLE_PERMISSIONS } from "../../../types/auth";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

// GET single user by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client: MongoClient | null = null;
  
  try {
    console.log("GET /api/users/[id] - Starting...");
    
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { id: userId } = await params;
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: "User ID is required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    
    const user = await usersCollection.findOne({ uid: userId });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 });
    }
    
    // Return user with permissions
    const userWithPermissions = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      permissions: ROLE_PERMISSIONS[user.role as UserRole] || []
    };
    
    return NextResponse.json(userWithPermissions);
  } catch (error) {
    console.error("GET /api/users/[id] error:", error);
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

// PUT - Update user profile
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client: MongoClient | null = null;
  
  try {
    console.log("PUT /api/users/[id] - Starting...");
    
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { id: userId } = await params;
    const updateData = await req.json();
    
    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: "User ID is required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    
    // Prepare update data
    const allowedUpdates = ['displayName', 'isActive'];
    const updateFields: any = {
      updatedAt: new Date().toISOString()
    };
    
    // Only allow certain fields to be updated
    allowedUpdates.forEach(field => {
      if (updateData[field] !== undefined) {
        updateFields[field] = updateData[field];
      }
    });
    
    const result = await usersCollection.updateOne(
      { uid: userId },
      { $set: updateFields }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 });
    }
    
    // Get updated user
    const updatedUser = await usersCollection.findOne({ uid: userId });
    
    return NextResponse.json({
      success: true,
      user: {
        uid: updatedUser.uid,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      }
    });
  } catch (error) {
    console.error("PUT /api/users/[id] error:", error);
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

// DELETE user (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client: MongoClient | null = null;
  
  try {
    console.log("DELETE /api/users/[id] - Starting...");
    
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { id: userId } = await params;
    const requestData = await req.json();
    const requestingUserEmail = requestData.requestingUser;
    
    if (!userId || !requestingUserEmail) {
      return NextResponse.json({ 
        success: false, 
        error: "User ID and requesting user email are required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    const leadsCollection = db.collection("leads");
    
    // Check requesting user permissions
    const requestingUser = await usersCollection.findOne({ email: requestingUserEmail });
    
    if (!requestingUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Requesting user not found" 
      }, { status: 404 });
    }

    // Allow users to delete their own account or admins to delete others
    const canDelete = requestingUser.uid === userId || requestingUser.role === 'admin';
    
    if (!canDelete) {
      return NextResponse.json({ 
        success: false, 
        error: "Insufficient permissions" 
      }, { status: 403 });
    }

    // Get the user to be deleted
    const userToDelete = await usersCollection.findOne({ uid: userId });
    
    if (!userToDelete) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 });
    }
    
    // Delete user's leads first
    await leadsCollection.deleteMany({ uploadedBy: userToDelete.email });
    
    // Delete the user
    const result = await usersCollection.deleteOne({ uid: userId });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "User not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "User and associated data deleted successfully"
    });
  } catch (error) {
    console.error("DELETE /api/users/[id] error:", error);
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