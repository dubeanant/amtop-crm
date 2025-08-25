import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

export async function GET(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token is required" },
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

    // Find the invitation
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

    // Return invitation details (without sensitive info)
    return NextResponse.json({
      success: true,
      invitation: {
        email: invitation.email,
        organizationName: invitation.organizationName,
        role: invitation.role,
        invitedByName: invitation.invitedByName,
        expiresAt: invitation.expiresAt
      }
    });

  } catch (error) {
    console.error('Error verifying invitation:', error);
    return NextResponse.json(
      { success: false, error: "Failed to verify invitation" },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}

