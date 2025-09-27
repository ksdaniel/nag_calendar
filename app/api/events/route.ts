import { NextRequest, NextResponse } from "next/server";
import Airtable from "airtable";
import { Event, EventFields } from "./types";

// Configure Airtable with Personal Access Token

const base = new Airtable({
  apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
}).base(process.env.AIRTABLE_BASE_ID!);

export async function GET(
  request: NextRequest,
): Promise<
  NextResponse<
    Event[] | { error: string; details?: string; statusCode?: number }
  >
> {
  console.log(request);

  try {
    const records = await base(process.env.AIRTABLE_TABLE_NAME!)
      .select({
        // Remove maxRecords limit to get all events
        maxRecords: 200,
      })
      .all();

    const events: Event[] = records.map((record) => ({
      id: record.id,
      ...(record.fields as unknown as EventFields),
    }));

    return NextResponse.json(events);
  } catch (error) {
    console.error("Error fetching events from Airtable:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch events",
        details: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
