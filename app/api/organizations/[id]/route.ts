import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

// DELETE organization
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const { id } = params;
  const organizationId = id;
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { requestingUserUid } = await req.json();
    
    if (!requestingUserUid) {
      return NextResponse.json({ 
        success: false, 
        error: "Requesting user UID is required" 
      }, { status: 400 });
    }

    if (!ObjectId.isValid(organizationId)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid organization ID" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const orgsCollection = db.collection("organizations");
    const usersCollection = db.collection<any>("users");

    // Find the organization
    const organization = await orgsCollection.findOne({ 
      _id: new ObjectId(organizationId),
      isActive: true 
    });

    if (!organization) {
      return NextResponse.json({ 
        success: false, 
        error: "Organization not found" 
      }, { status: 404 });
    }

    // Check if the requesting user is an admin of this organization
    const userMember = organization.members?.find(
      (member: any) => member.uid === requestingUserUid && member.role === 'admin'
    );

    if (!userMember) {
      return NextResponse.json({ 
        success: false, 
        error: "Only organization admins can delete the organization" 
      }, { status: 403 });
    }

    // Check if this is the only organization the user belongs to
    const userOrganizationsCount = await orgsCollection.countDocuments({
      "members.uid": requestingUserUid,
      isActive: true
    });

    if (userOrganizationsCount <= 1) {
      return NextResponse.json({ 
        success: false, 
        error: "Cannot delete your only organization. You must belong to at least one organization." 
      }, { status: 400 });
    }

    // Soft delete the organization
    await orgsCollection.updateOne(
      { _id: new ObjectId(organizationId) },
      { 
        $set: { 
          isActive: false,
          deletedAt: new Date().toISOString(),
          deletedBy: requestingUserUid,
          updatedAt: new Date().toISOString()
        }
      }
    );

    // Remove organization from all users' organization arrays
    await usersCollection.updateMany(
      { organizations: organizationId },
      ({ 
        $pull: { organizations: organizationId },
        $set: { updatedAt: new Date().toISOString() }
      } as any)
    );

    // If any user had this as their active organization, switch them to their first remaining organization
    const usersWithDeletedActiveOrg = await usersCollection.find({
      organizationId: organizationId
    }).toArray();

    for (const user of usersWithDeletedActiveOrg) {
      if (user.organizations && user.organizations.length > 0) {
        // Set their first remaining organization as active
        const firstRemainingOrg = user.organizations.find((orgId: string) => orgId !== organizationId);
        if (firstRemainingOrg) {
          await usersCollection.updateOne(
            { _id: user._id },
            { 
              $set: { 
                organizationId: firstRemainingOrg,
                updatedAt: new Date().toISOString()
              }
            }
          );
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Organization deleted successfully"
    });
  } catch (error) {
    console.error("DELETE /api/organizations/[id] error:", error);
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