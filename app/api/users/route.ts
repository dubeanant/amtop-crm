import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { UserProfile, UserRole, ROLE_PERMISSIONS, DEFAULT_ROLE } from "../../types/auth";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

// GET all users (admin/manager only)
export async function GET(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    console.log("GET /api/users - Starting...");
    
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    // Get requesting user info from headers or query params
    const { searchParams } = new URL(req.url);
    const requestingUserEmail = searchParams.get('requestingUser');
    
    if (!requestingUserEmail) {
      return NextResponse.json({ 
        success: false, 
        error: "Requesting user email is required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    
    // Get requesting user to check permissions
    const requestingUser = await usersCollection.findOne({ email: requestingUserEmail });
    
    if (!requestingUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Requesting user not found" 
      }, { status: 404 });
    }

    // Check if user has permission to view users
    const userPermissions = ROLE_PERMISSIONS[requestingUser.role as UserRole] || [];
    const canViewUsers = userPermissions.some(p => 
      p.resource === 'users' && (p.actions.includes('read') || p.actions.includes('view_team'))
    );

    if (!canViewUsers) {
      return NextResponse.json({ 
        success: false, 
        error: "Insufficient permissions" 
      }, { status: 403 });
    }

    // Get users based on role permissions and team membership
    let users;
    const requestingUserDomain = requestingUser.email.split('@')[1];
    const requestingUserTeamId = requestingUser.teamId || requestingUserDomain;
    
    if (requestingUser.role === 'admin') {
      // Admin can see users from same team/domain
      users = await usersCollection.find({ 
        $or: [
          { teamId: requestingUserTeamId }, // Same teamId
          { 
            teamId: { $exists: false }, 
            email: { $regex: `@${requestingUserDomain}$` } 
          }, // Same domain for users without teamId
          { 
            teamId: null, 
            email: { $regex: `@${requestingUserDomain}$` } 
          } // Handle null teamId
        ]
      }).toArray();
    } else if (requestingUser.role === 'user') {
      // Regular users can see their team members only
      users = await usersCollection.find({ 
        $or: [
          { teamId: requestingUserTeamId }, // Same teamId
          { 
            teamId: { $exists: false }, 
            email: { $regex: `@${requestingUserDomain}$` } 
          }, // Same domain for users without teamId
          { 
            teamId: null, 
            email: { $regex: `@${requestingUserDomain}$` } 
          } // Handle null teamId
        ]
      }).toArray();
    } else {
      // Viewers can only see themselves
      users = await usersCollection.find({ email: requestingUserEmail }).toArray();
    }
    
    // Remove sensitive information
    const sanitizedUsers = users.map(user => ({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      teamId: user.teamId,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }));
    
    return NextResponse.json(sanitizedUsers);
  } catch (error) {
    console.error("GET /api/users error:", error);
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

// POST - Create new user profile
export async function POST(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    console.log("POST /api/users - Starting...");
    
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const userData = await req.json();
    console.log("Creating user profile:", userData);
    
    // Validate required fields
    if (!userData.uid || !userData.email) {
      return NextResponse.json({ 
        success: false, 
        error: "UID and email are required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const usersCollection = db.collection("users");
    
    // Check if user already exists
    const existingUser = await usersCollection.findOne({ uid: userData.uid });
    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        error: "User already exists" 
      }, { status: 409 });
    }

    // Check if this is the first user (make them admin)
    const userCount = await usersCollection.countDocuments();
    const role = userCount === 0 ? 'admin' : (userData.role || DEFAULT_ROLE);
    
    // Generate team ID based on email domain or use provided teamId
    const emailDomain = userData.email.split('@')[1];
    const teamId = userData.teamId || emailDomain;

    const newUser: UserProfile = {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName || '',
      role: role as UserRole,
      teamId: teamId,
      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      permissions: ROLE_PERMISSIONS[role as UserRole] || ROLE_PERMISSIONS[DEFAULT_ROLE]
    };
    
    const result = await usersCollection.insertOne(newUser);
    console.log("User created:", result.insertedId);
    
    return NextResponse.json({
      success: true,
      user: {
        uid: newUser.uid,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        teamId: newUser.teamId,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      }
    });
  } catch (error) {
    console.error("POST /api/users error:", error);
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