import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

export interface BulkStepData {
  title: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

// POST create multiple pipeline steps
export async function POST(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { steps, organizationId, createdBy } = await req.json();
    
    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Steps array is required and must not be empty" 
      }, { status: 400 });
    }

    if (!organizationId || !createdBy) {
      return NextResponse.json({ 
        success: false, 
        error: "Organization ID and creator are required" 
      }, { status: 400 });
    }

    // Validate steps
    const validSteps = steps.filter((step: BulkStepData) => step.title?.trim());
    if (validSteps.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "At least one step must have a title" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const stepsCollection = db.collection("pipeline_steps");
    
    // Get the current highest order number
    const lastStep = await stepsCollection.findOne(
      { organizationId, isActive: true },
      { sort: { order: -1 } }
    );
    const startOrder = lastStep ? lastStep.order + 1 : 1;
    
    // Create new steps
    const newSteps = validSteps.map((step: BulkStepData, index: number) => {
      const stepId = (Date.now() + index).toString();
      return {
        id: stepId,
        title: step.title.trim(),
        description: step.description?.trim() || '',
        color: step.color,
        bgColor: step.bgColor,
        borderColor: step.borderColor,
        order: startOrder + index,
        organizationId,
        createdBy,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true
      };
    });
    
    const result = await stepsCollection.insertMany(newSteps);
    
    return NextResponse.json({
      success: true,
      steps: newSteps.map(step => ({
        id: step.id,
        title: step.title,
        description: step.description,
        color: step.color,
        bgColor: step.bgColor,
        borderColor: step.borderColor,
        order: step.order,
        createdAt: step.createdAt,
        updatedAt: step.updatedAt
      })),
      message: `${newSteps.length} pipeline steps created successfully`
    });
  } catch (error) {
    console.error("POST /api/pipeline/steps/bulk error:", error);
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