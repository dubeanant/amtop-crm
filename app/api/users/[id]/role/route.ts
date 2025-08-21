import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { UserRole, ROLE_PERMISSIONS } from "../../../../types/auth";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

// PUT - Update user role (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client: MongoClient | null = null;
  
  try {
    console.log("PUT /api/users/[id]/role - Starting...");
    
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { id: userId } = await params;
    const { role } = await req.json();
    const { searchParams } = new URL(req.url);
    const requestingUserEmail = searchParams.get('requestingUser');
    
    if (!userId || !role || !requestingUserEmail) {
      return NextResponse.json({ 
        success: false, 
        error: "User ID, role, and requesting user email are required" 
      }, { status: 400 });
    }

    // Validate role
    const validRoles: UserRole[] = ['admin', 'user', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid role specified" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    
    // Check requesting user permissions
    const requestingUser = await usersCollection.findOne({ email: requestingUserEmail });
    
    if (!requestingUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Requesting user not found" 
      }, { status: 404 });
    }

    // Check if requesting user has permission to manage roles
    const requestingUserPermissions = ROLE_PERMISSIONS[requestingUser.role as UserRole] || [];
    const canManageRoles = requestingUserPermissions.some(p => 
      p.resource === 'users' && p.actions.includes('manage_roles')
    );

    if (!canManageRoles) {
      return NextResponse.json({ 
        success: false, 
        error: "Insufficient permissions to manage user roles" 
      }, { status: 403 });
    }

    // Don't allow changing own role unless there's another admin
    if (requestingUser.uid === userId && requestingUser.role === 'admin') {
      const adminCount = await usersCollection.countDocuments({ role: 'admin' });
      if (adminCount <= 1 && role !== 'admin') {
        return NextResponse.json({ 
          success: false, 
          error: "Cannot change role - at least one admin must remain" 
        }, { status: 400 });
      }
    }
    
    // Update user role
    const result = await usersCollection.updateOne(
      { uid: userId },
      { 
        $set: { 
          role: role,
          updatedAt: new Date().toISOString()
        }
      }
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
        updatedAt: updatedUser.updatedAt,
        permissions: ROLE_PERMISSIONS[updatedUser.role as UserRole] || []
      }
    });
  } catch (error) {
    console.error("PUT /api/users/[id]/role error:", error);
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