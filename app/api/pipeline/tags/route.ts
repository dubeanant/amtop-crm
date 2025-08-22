import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

export interface PipelineTag {
  _id?: ObjectId;
  id: string;
  name: string;
  description: string;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// GET pipeline tags for organization
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
    const tagsCollection = db.collection("pipeline_tags");
    
    const tags = await tagsCollection.find({
      organizationId: organizationId,
      isActive: true
    }).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json({
      success: true,
      tags: tags.map(tag => ({
        id: tag.id,
        name: tag.name,
        description: tag.description,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt
      }))
    });
  } catch (error) {
    console.error("GET /api/pipeline/tags error:", error);
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

// POST create new pipeline tag
export async function POST(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { name, description, organizationId, createdBy } = await req.json();
    
    if (!name || !description || !organizationId || !createdBy) {
      return NextResponse.json({ 
        success: false, 
        error: "Name, description, organization ID, and creator are required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const tagsCollection = db.collection("pipeline_tags");
    
    // Check for duplicate tag names within the organization
    const existingTag = await tagsCollection.findOne({
      organizationId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      isActive: true
    });
    
    if (existingTag) {
      return NextResponse.json({ 
        success: false, 
        error: "A tag with this name already exists in your organization" 
      }, { status: 400 });
    }
    
    const tagId = Date.now().toString();
    const newTag: PipelineTag = {
      id: tagId,
      name: name.trim(),
      description: description.trim(),
      organizationId,
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    
    const result = await tagsCollection.insertOne(newTag);
    
    return NextResponse.json({
      success: true,
      tag: {
        id: newTag.id,
        name: newTag.name,
        description: newTag.description,
        createdAt: newTag.createdAt,
        updatedAt: newTag.updatedAt
      }
    });
  } catch (error) {
    console.error("POST /api/pipeline/tags error:", error);
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