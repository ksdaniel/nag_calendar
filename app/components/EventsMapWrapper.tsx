"use client";

import dynamic from "next/dynamic";

// Dynamic import with no SSR to avoid Leaflet window issues
const EventsMap = dynamic(() => import("./EventsMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
      <div className="text-lg text-gray-600 dark:text-gray-400">
        Se încarcă harta...
      </div>
    </div>
  ),
});

export default function EventsMapWrapper() {
  return <EventsMap />;
}
