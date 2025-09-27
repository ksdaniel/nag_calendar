"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Event } from "../api/events/types";

export default function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedZi, setSelectedZi] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events");
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        const eventsData = await response.json();
        setEvents(eventsData);
        setFilteredEvents(eventsData);

        // Set default selection to first zi value
        if (eventsData.length > 0) {
          const uniqueZiValues = Array.from(
            new Set(eventsData.map((event: Event) => event.zi)),
          );
          if (uniqueZiValues.length > 0) {
            setSelectedZi(uniqueZiValues[0] as string);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter events when selectedZi changes
  useEffect(() => {
    if (selectedZi === null) {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(events.filter((event) => event.zi === selectedZi));
    }
  }, [selectedZi, events]);

  // Get unique zi values for filter buttons
  const uniqueZi = Array.from(new Set(events.map((event) => event.zi)));

  const handleZiFilter = (zi: string) => {
    setSelectedZi(selectedZi === zi ? null : zi);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ro-RO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (timeString: string) => {
    return timeString.replace(":00", "");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">Se încarcă evenimentele...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-red-500">Eroare: {error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-3 sm:p-6">
      {/* Day Filter Header */}
      <div className="bg-gray-100 dark:bg-gray-800 py-4 sm:py-8 mb-4 sm:mb-8 rounded-lg">
        <div className="flex justify-center items-center gap-2 sm:gap-4 flex-wrap">
          {uniqueZi.map((zi, index) => (
            <div key={zi} className="flex items-center">
              {/* Filter Button */}
              <button
                onClick={() => handleZiFilter(zi)}
                className={`relative w-12 h-12 sm:w-20 sm:h-20 rounded-full font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 ${
                  selectedZi === zi
                    ? "bg-orange-500 text-white shadow-lg transform scale-110"
                    : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 shadow-md"
                }`}
              >
                {zi.slice(0, 3).toUpperCase()}
                {selectedZi === zi && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-orange-500"></div>
                )}
              </button>

              {/* Dotted Line */}
              {index < uniqueZi.length - 1 && (
                <div className="mx-2 sm:mx-4 w-4 sm:w-8 border-t-2 border-dotted border-orange-300"></div>
              )}
            </div>
          ))}
        </div>

        {/* Active Filter Info */}
        {selectedZi && (
          <div className="text-center mt-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Afișare evenimente pentru:{" "}
              <span className="font-semibold text-orange-500">
                {selectedZi}
              </span>
            </span>
            <button
              onClick={() => setSelectedZi(null)}
              className="ml-2 text-xs text-gray-500 hover:text-orange-500 underline"
            >
              (afișează toate)
            </button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="flex flex-col sm:flex-row">
              {/* Event Image */}
              {event.Attachments && event.Attachments[0] && (
                <div className="w-full sm:w-64 flex-shrink-0">
                  <Image
                    src={event.Attachments[0].thumbnails.large.url}
                    alt={event.titlu}
                    width={256}
                    height={192}
                    className="w-full sm:w-64 h-32 sm:h-48 object-cover"
                  />
                </div>
              )}

              {/* Event Details */}
              <div className="flex-1 p-3 sm:p-6">
                {/* Category/Type */}
                <div className="text-xs font-medium text-orange-400 uppercase tracking-wider mb-1 sm:mb-2">
                  {event.titlu}
                </div>

                {/* Title */}
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-4 uppercase">
                  {event.Loc}
                </h2>

                {/* Date and Location Info */}
                <div className="flex flex-wrap gap-3 sm:gap-8 text-xs sm:text-sm">
                  <div>
                    <div className="text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">
                      DATA
                    </div>
                    <div className="text-gray-900 dark:text-white font-semibold">
                      {formatDate(event["start date"])}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">
                      PROGRAM
                    </div>
                    <div className="text-gray-900 dark:text-white font-semibold">
                      {formatTime(event["ora deschidere"])} -{" "}
                      {formatTime(event["ora închidere"])}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action/Status */}
              <div className="flex items-center p-3 sm:pr-6 sm:p-0">
                <div className="text-orange-400 font-bold text-xs sm:text-sm uppercase tracking-wider">
                  DETALII
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && events.length > 0 && (
        <div className="text-center text-gray-500 p-8">
          Nu au fost găsite evenimente pentru{" "}
          <span className="font-semibold">{selectedZi}</span>.
        </div>
      )}

      {events.length === 0 && (
        <div className="text-center text-gray-500 p-8">
          Nu au fost găsite evenimente.
        </div>
      )}
    </div>
  );
}
