import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { sendTeamInvitation } from "../../../lib/emailService";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

export async function POST(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    const { email, role, organizationId, invitedBy, invitedByName } = await req.json();

    // Validate required fields
    if (!email || !role || !organizationId || !invitedBy) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate role
    if (!['user', 'viewer'].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role. Must be 'user' or 'viewer'" },
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
    const usersCollection = db.collection("users");
    const invitationsCollection = db.collection("invitations");

    // Check if user already exists in the organization
    const existingUser = await usersCollection.findOne({
      email: email.toLowerCase(),
      organizationId: organizationId
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User is already a member of this organization" },
        { status: 400 }
      );
    }

    // Check if invitation already exists and is not expired
    const existingInvitation = await invitationsCollection.findOne({
      email: email.toLowerCase(),
      organizationId: organizationId,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (existingInvitation) {
      return NextResponse.json(
        { success: false, error: "An invitation has already been sent to this email" },
        { status: 400 }
      );
    }

    // Get organization details
    const organizationsCollection = db.collection("organizations");
    const organization = await organizationsCollection.findOne({ _id: organizationId });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    // Create invitation record
    const invitation = {
      email: email.toLowerCase(),
      organizationId: organizationId,
      organizationName: organization.name,
      role: role,
      invitedBy: invitedBy,
      invitedByName: invitedByName,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      token: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    };

    await invitationsCollection.insertOne(invitation);

    // Create magic link
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/join-team?token=${invitation.token}`;

    // Send email invitation
    const emailSent = await sendTeamInvitation({
      to: email,
      organizationName: organization.name,
      invitedByName: invitedByName,
      magicLink: magicLink,
      role: role
    });

    if (!emailSent) {
      // If email fails, we should still return success but log the issue
      console.error('Failed to send email invitation to:', email);
    }

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
      magicLink: process.env.NODE_ENV === 'development' ? magicLink : undefined // Only show in development
    });

  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json(
      { success: false, error: "Failed to send invitation" },
      { status: 500 }
    );
  } finally {
    if (client) await client.close();
  }
}
