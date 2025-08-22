import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

export interface PipelineStep {
  _id?: ObjectId;
  id: string;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  order: number;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// GET pipeline steps for organization
export async function GET(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { searchParams } = new URL(req.url);
    const organizationId = searchParams.get('organizationId');
    
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
    
    const steps = await stepsCollection.find({
      organizationId: organizationId,
      isActive: true
    }).sort({ order: 1 }).toArray();
    
    return NextResponse.json({
      success: true,
      steps: steps.map(step => ({
        id: step.id,
        title: step.title,
        description: step.description,
        color: step.color,
        bgColor: step.bgColor,
        borderColor: step.borderColor,
        order: step.order,
        createdAt: step.createdAt,
        updatedAt: step.updatedAt
      }))
    });
  } catch (error) {
    console.error("GET /api/pipeline/steps error:", error);
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

// POST create new pipeline step
export async function POST(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { title, description, color, bgColor, borderColor, organizationId, createdBy } = await req.json();
    
    if (!title || !organizationId || !createdBy) {
      return NextResponse.json({ 
        success: false, 
        error: "Title, organization ID, and creator are required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const stepsCollection = db.collection("pipeline_steps");
    
    // Get the next order number
    const lastStep = await stepsCollection.findOne(
      { organizationId, isActive: true },
      { sort: { order: -1 } }
    );
    const nextOrder = lastStep ? lastStep.order + 1 : 1;
    
    const stepId = Date.now().toString();
    const newStep: PipelineStep = {
      id: stepId,
      title: title.trim(),
      description: description?.trim() || '',
      color,
      bgColor,
      borderColor,
      order: nextOrder,
      organizationId,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    
    const result = await stepsCollection.insertOne(newStep);
    
    return NextResponse.json({
      success: true,
      step: {
        id: newStep.id,
        title: newStep.title,
        description: newStep.description,
        color: newStep.color,
        bgColor: newStep.bgColor,
        borderColor: newStep.borderColor,
        order: newStep.order,
        createdAt: newStep.createdAt,
        updatedAt: newStep.updatedAt
      }
    });
  } catch (error) {
    console.error("POST /api/pipeline/steps error:", error);
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

// PUT update pipeline step order (for reordering)
export async function PUT(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { steps, organizationId } = await req.json();
    
    if (!steps || !organizationId) {
      return NextResponse.json({ 
        success: false, 
        error: "Steps array and organization ID are required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const stepsCollection = db.collection("pipeline_steps");
    
    // Update order for each step
    const bulkOps = steps.map((step: any, index: number) => ({
      updateOne: {
        filter: { id: step.id, organizationId, isActive: true },
        update: { 
          $set: { 
            order: index + 1,
            updatedAt: new Date().toISOString()
          }
        }
      }
    }));
    
    await stepsCollection.bulkWrite(bulkOps);
    
    return NextResponse.json({
      success: true,
      message: "Steps reordered successfully"
    });
  } catch (error) {
    console.error("PUT /api/pipeline/steps error:", error);
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