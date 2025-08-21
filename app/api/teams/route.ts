import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

// GET - list distinct teams
export async function GET(req: NextRequest) {
  let client: MongoClient | null = null;
  try {
    if (!uri || !dbName) {
      return NextResponse.json({ success: false, error: "Missing MongoDB configuration" }, { status: 500 });
    }

    client = new MongoClient(uri);
    await client.connect();

    const db = client.db(dbName);
    const usersCollection = db.collection("users");

    // Distinct non-empty teamId values
    const teams: string[] = (await usersCollection.distinct("teamId")).filter(t => !!t && typeof t === 'string');

    return NextResponse.json({ success: true, teams });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  } finally {
    if (client) await client.close();
  }
}