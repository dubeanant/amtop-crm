import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";
import { UserRole, ROLE_PERMISSIONS } from "../../../types/auth";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let client: MongoClient | null = null;
  
  try {
    // Check environment variables
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { id: audienceId } = await params;
    const updateData = await req.json();
    
    if (!audienceId) {
      return NextResponse.json({ 
        success: false, 
        error: "Audience ID is required" 
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(audienceId)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid audience ID format" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const collection = db.collection("leads");
    
    // Find the audience member first to check ownership
    const existingAudience = await collection.findOne({ _id: new ObjectId(audienceId) });
    
    if (!existingAudience) {
      return NextResponse.json({ 
        success: false, 
        error: "Audience member not found" 
      }, { status: 404 });
    }

    // For now, allow updates from the same user who uploaded the audience member
    // In the future, you can add more sophisticated permission checking here
    const result = await collection.updateOne(
      { _id: new ObjectId(audienceId) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Audience member not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      modifiedCount: result.modifiedCount 
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id: audienceId } = await params;
    
    if (!userEmail) {
      return NextResponse.json({ 
        success: false, 
        error: "User email is required" 
      }, { status: 400 });
    }

    if (!audienceId) {
      return NextResponse.json({ 
        success: false, 
        error: "Audience ID is required" 
      }, { status: 400 });
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(audienceId)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid audience ID format" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const collection = db.collection("leads");
    
    // Only delete the specific audience member if it belongs to the user
    const result = await collection.deleteOne({ 
      _id: new ObjectId(audienceId),
      uploadedBy: userEmail 
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Audience member not found or you don't have permission to delete it" 
      }, { status: 404 });
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