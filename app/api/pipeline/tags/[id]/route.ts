import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

// PUT update pipeline tag
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const { id } = params;
  const tagId = id;
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const tagId = params.id;
    const { name, description, organizationId } = await req.json();
    
    if (!name || !description || !organizationId) {
      return NextResponse.json({ 
        success: false, 
        error: "Name, description, and organization ID are required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const tagsCollection = db.collection("pipeline_tags");
    
    // Check for duplicate tag names within the organization (excluding current tag)
    const existingTag = await tagsCollection.findOne({
      organizationId,
      id: { $ne: tagId },
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      isActive: true
    });
    
    if (existingTag) {
      return NextResponse.json({ 
        success: false, 
        error: "A tag with this name already exists in your organization" 
      }, { status: 400 });
    }
    
    const result = await tagsCollection.updateOne(
      { id: tagId, organizationId, isActive: true },
      { 
        $set: { 
          name: name.trim(),
          description: description.trim(),
          updatedAt: new Date().toISOString()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Pipeline tag not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Pipeline tag updated successfully"
    });
  } catch (error) {
    console.error("PUT /api/pipeline/tags/[id] error:", error);
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

// DELETE pipeline tag
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const { id } = params;
  const tagId = id;
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    // tagId already resolved from params above
    const { organizationId } = await req.json();
    
    if (!organizationId) {
      return NextResponse.json({ 
        success: false, 
        error: "Organization ID is required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const tagsCollection = db.collection("pipeline_tags");
    
    // Soft delete the tag
    const result = await tagsCollection.updateOne(
      { id: tagId, organizationId, isActive: true },
      { 
        $set: { 
          isActive: false,
          updatedAt: new Date().toISOString()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Pipeline tag not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Pipeline tag deleted successfully"
    });
  } catch (error) {
    console.error("DELETE /api/pipeline/tags/[id] error:", error);
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