import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

export async function POST(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    const { token, userId, userEmail } = await req.json();

    // Validate required fields
    if (!token || !userId || !userEmail) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!uri || !dbName) {
      return NextResponse.json(
        { success: false, error: "Missing MongoDB configuration" },
        { status: 500 }
      );
    }

    client = new MongoClient(uri);
    await client.connect();

    const db = client.db(dbName);
    const invitationsCollection = db.collection("invitations");
    const usersCollection = db.collection("users");

    // Find and validate the invitation
    const invitation = await invitationsCollection.findOne({
      token: token,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired invitation" },
        { status: 404 }
      );
    }

    // Verify email matches
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Email does not match invitation" },
        { status: 400 }
      );
    }

    // Check if user already exists in the organization
    const existingUser = await usersCollection.findOne({
      uid: userId,
      organizationId: invitation.organizationId
    });

    if (existingUser) {
      // Update invitation status to accepted
      await invitationsCollection.updateOne(
        { token: token },
        { $set: { status: 'accepted', acceptedAt: new Date() } }
      );

      return NextResponse.json({
        success: true,
        message: "User is already a member of this organization"
      });
    }

    // Get user details
    const user = await usersCollection.findOne({ uid: userId });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Add user to the organization
    const updateResult = await usersCollection.updateOne(
      { uid: userId },
      {
        $set: {
          organizationId: invitation.organizationId,
          role: invitation.role,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to update user" },
        { status: 500 }
      );
    }

    // Update invitation status to accepted
    await invitationsCollection.updateOne(
      { token: token },
      { $set: { status: 'accepted', acceptedAt: new Date() } }
    );

    return NextResponse.json({
      success: true,
      message: "Successfully joined the organization"
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { success: false, error: "Failed to accept invitation" },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}

