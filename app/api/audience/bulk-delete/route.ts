import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

export async function DELETE(req: NextRequest) {
  let client: MongoClient | null = null;
  
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ 
        success: false, 
        error: "Missing MongoDB configuration" 
      }, { status: 500 });
    }

    const { audienceIds, userEmail } = await req.json();
    
    if (!audienceIds || !Array.isArray(audienceIds) || audienceIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Audience IDs array is required" 
      }, { status: 400 });
    }

    if (!userEmail) {
      return NextResponse.json({ 
        success: false, 
        error: "User email is required" 
      }, { status: 400 });
    }

    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const audienceCollection = db.collection("leads");
    
    // Convert string IDs to ObjectIds
    const objectIds = audienceIds.map(id => new ObjectId(id));
    
    // Delete the audience members
    const result = await audienceCollection.deleteMany({
      _id: { $in: objectIds },
      uploadedBy: userEmail
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "No audience members found to delete" 
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} audience member(s)`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error("DELETE /api/audience/bulk-delete error:", error);
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

