import { NextRequest, NextResponse } from "next/server";
import Airtable from "airtable";
import { Event, EventFields } from "./types";

// Configure Airtable with Personal Access Token
const base = new Airtable({
  apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
}).base(process.env.AIRTABLE_BASE_ID!);

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

interface CacheEntry {
  data: Event[];
  timestamp: number;
}

let cache: CacheEntry | null = null;

export async function GET(
  request: NextRequest,
): Promise<
  NextResponse<
    Event[] | { error: string; details?: string; statusCode?: number }
  >
> {
  console.log(request.method);

  try {
    // Check if we have valid cached data
    const now = Date.now();
    if (cache && now - cache.timestamp < CACHE_DURATION) {
      console.log("Returning cached events data");
      return NextResponse.json(cache.data);
    }

    console.log("Fetching fresh data from Airtable");
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

    // Sort events by start date
    const sortedEvents = events.sort((a: Event, b: Event) => {
      return (
        new Date(a["start date"]).getTime() -
        new Date(b["start date"]).getTime()
      );
    });

    // Update cache
    cache = {
      data: sortedEvents,
      timestamp: now,
    };

    console.log(`Cached ${sortedEvents.length} events`);
    return NextResponse.json(sortedEvents);
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
