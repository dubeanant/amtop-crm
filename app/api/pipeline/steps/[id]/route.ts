import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

// PUT update pipeline step
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const stepId = params.id;
    const { title, description, color, bgColor, borderColor, organizationId } = await req.json();
    
    if (!title || !organizationId) {
      return NextResponse.json({ 
        success: false, 
        error: "Title and organization ID are required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const stepsCollection = db.collection("pipeline_steps");
    
    const result = await stepsCollection.updateOne(
      { id: stepId, organizationId, isActive: true },
      { 
        $set: { 
          title: title.trim(),
          description: description?.trim() || '',
          color,
          bgColor,
          borderColor,
          updatedAt: new Date().toISOString()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Pipeline step not found" 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: "Pipeline step updated successfully"
    });
  } catch (error) {
    console.error("PUT /api/pipeline/steps/[id] error:", error);
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

// DELETE pipeline step
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const stepId = params.id;
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
    const stepsCollection = db.collection("pipeline_steps");
    
    // Check if this is the only step
    const stepCount = await stepsCollection.countDocuments({
      organizationId,
      isActive: true
    });
    
    if (stepCount <= 1) {
      return NextResponse.json({ 
        success: false, 
        error: "Cannot delete the last pipeline step. You must have at least one step." 
      }, { status: 400 });
    }
    
    // Soft delete the step
    const result = await stepsCollection.updateOne(
      { id: stepId, organizationId, isActive: true },
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
        error: "Pipeline step not found" 
      }, { status: 404 });
    }
    
    // Reorder remaining steps
    const remainingSteps = await stepsCollection.find({
      organizationId,
      isActive: true
    }).sort({ order: 1 }).toArray();
    
    const bulkOps = remainingSteps.map((step, index) => ({
      updateOne: {
        filter: { _id: step._id },
        update: { 
          $set: { 
            order: index + 1,
            updatedAt: new Date().toISOString()
          }
        }
      }
    }));
    
    if (bulkOps.length > 0) {
      await stepsCollection.bulkWrite(bulkOps);
    }
    
    return NextResponse.json({
      success: true,
      message: "Pipeline step deleted successfully"
    });
  } catch (error) {
    console.error("DELETE /api/pipeline/steps/[id] error:", error);
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