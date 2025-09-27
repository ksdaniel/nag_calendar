"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import posthog from "posthog-js";
import { Event } from "../api/events/types";

export default function EventsList() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedZi, setSelectedZi] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedEvents, setSavedEvents] = useState<string[]>([]);
  const [showSavedEvents, setShowSavedEvents] = useState<boolean>(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

    // Load saved events from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("nag_2025_saved");
      if (saved) {
        try {
          const parsedSaved = JSON.parse(saved);
          if (Array.isArray(parsedSaved)) {
            setSavedEvents(parsedSaved);
          }
        } catch (error) {
          console.error("Error parsing saved events from localStorage:", error);
        }
      }
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Filter events when selectedZi, searchTerm, or showSavedEvents changes
  useEffect(() => {
    let filtered = events;

    // Filter by saved events if showSavedEvents is active
    if (showSavedEvents) {
      filtered = filtered.filter((event) => savedEvents.includes(event.id));
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (event) =>
          event.titlu.toLowerCase().includes(searchLower) ||
          event.Loc.toLowerCase().includes(searchLower) ||
          event.zi.toLowerCase().includes(searchLower),
      );
    }

    // Filter by selected zi
    if (selectedZi !== null) {
      filtered = filtered.filter((event) => event.zi === selectedZi);
    }

    // Sort: single-day events first, then by start date
    filtered = filtered.sort((a, b) => {
      const aIsSingle = isSingleDayEvent(a);
      const bIsSingle = isSingleDayEvent(b);

      // If one is single-day and the other isn't, prioritize single-day
      if (aIsSingle && !bIsSingle) return -1;
      if (!aIsSingle && bIsSingle) return 1;

      // If both are the same type (both single or both not), sort by date
      return (
        new Date(a["start date"]).getTime() -
        new Date(b["start date"]).getTime()
      );
    });

    setFilteredEvents(filtered);
  }, [selectedZi, searchTerm, events, showSavedEvents, savedEvents]);

  // Get unique zi values for filter buttons
  const uniqueZi = Array.from(new Set(events.map((event) => event.zi)));

  const handleZiFilter = (zi: string) => {
    const newSelection = selectedZi === zi ? null : zi;
    setSelectedZi(newSelection);

    // Clear saved events filter when using day filter
    if (showSavedEvents) {
      setShowSavedEvents(false);
    }

    // Track PostHog event
    if (typeof window !== "undefined") {
      posthog.capture("date_filter_clicked", {
        selected_day: zi,
        action: newSelection === null ? "deselected" : "selected",
        previous_selection: selectedZi,
        total_events: events.length,
        filtered_events_count:
          newSelection === null
            ? events.length
            : events.filter((event) => event.zi === zi).length,
        saved_filter_was_active: showSavedEvents,
      });
    }
  };

  const handleSearchChange = (newSearchTerm: string) => {
    const previousTerm = searchTerm;
    setSearchTerm(newSearchTerm);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set up debounced PostHog tracking
    searchTimeoutRef.current = setTimeout(() => {
      if (typeof window !== "undefined") {
        // Calculate filtered results for the new search term
        let searchFilteredEvents = events;
        if (newSearchTerm.trim()) {
          const searchLower = newSearchTerm.toLowerCase().trim();
          searchFilteredEvents = events.filter(
            (event) =>
              event.titlu.toLowerCase().includes(searchLower) ||
              event.Loc.toLowerCase().includes(searchLower) ||
              event.zi.toLowerCase().includes(searchLower),
          );
        }

        posthog.capture("search_used", {
          search_term: newSearchTerm,
          search_term_length: newSearchTerm.length,
          previous_search_term: previousTerm,
          action: newSearchTerm.trim() === "" ? "cleared" : "searched",
          total_events: events.length,
          search_results_count: searchFilteredEvents.length,
          has_date_filter: selectedZi !== null,
          selected_day: selectedZi,
        });
      }
    }, 250); // 250ms debounce
  };

  const handleDetaliiClick = (event: Event) => {
    // Track PostHog event for DETALII clicks
    if (typeof window !== "undefined") {
      posthog.capture("event_details_clicked", {
        event_id: event.id,
        event_title: event.titlu,
        event_location: event.Loc,
        event_day: event.zi,
        event_date: event["start date"],
        has_link: !!event.Link,
        link_url: event.Link || null,
        has_image: !!(event.Attachments && event.Attachments.length > 0),
        search_term_active: searchTerm.trim() !== "",
        current_search_term: searchTerm.trim() || null,
        date_filter_active: selectedZi !== null,
        selected_day: selectedZi,
      });
    }
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
    // Ensure time is displayed as hh:mm format with leading zeros
    if (timeString.includes(":")) {
      const [hours, minutes] = timeString.split(":");
      const paddedHours = hours.padStart(2, "0");
      const paddedMinutes = minutes.padStart(2, "0");
      return `${paddedHours}:${paddedMinutes}`;
    }
    // If no colon, assume it's just hours and add :00
    const paddedHours = timeString.padStart(2, "0");
    return `${paddedHours}:00`;
  };

  const isSingleDayEvent = (event: Event) => {
    // Count how many events have the same location
    const locationCount = events.filter((e) => e.Loc === event.Loc).length;

    // Return true if this location appears only once in the entire events array
    return locationCount === 1;
  };

  const handleSaveEvent = (eventId: string) => {
    if (typeof window !== "undefined") {
      const event = events.find((e) => e.id === eventId);
      const isCurrentlySaved = savedEvents.includes(eventId);
      let updatedSavedEvents: string[];

      if (isCurrentlySaved) {
        // Remove from saved events if already saved
        updatedSavedEvents = savedEvents.filter((id) => id !== eventId);
      } else {
        // Add to saved events if not already saved
        updatedSavedEvents = [...savedEvents, eventId];
      }

      setSavedEvents(updatedSavedEvents);
      localStorage.setItem(
        "nag_2025_saved",
        JSON.stringify(updatedSavedEvents),
      );

      // Track PostHog event
      if (event) {
        posthog.capture(isCurrentlySaved ? "event_unsaved" : "event_saved", {
          event_id: eventId,
          event_title: event.titlu,
          event_location: event.Loc,
          event_day: event.zi,
          event_date: event["start date"],
          action: isCurrentlySaved ? "unsaved" : "saved",
          total_saved_events: updatedSavedEvents.length,
          has_link: !!event.Link,
          is_single_day_event: isSingleDayEvent(event),
          search_term_active: searchTerm.trim() !== "",
          current_search_term: searchTerm.trim() || null,
          date_filter_active: selectedZi !== null,
          selected_day: selectedZi,
          saved_filter_active: showSavedEvents,
        });
      }
    }
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
      <div className="sticky top-0 z-50 bg-gray-100 dark:bg-gray-800 py-4 sm:py-8 mb-4 sm:mb-8 rounded-lg">
        {/* Header Image */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <img
            src="nag_logo.png"
            alt="Nag Events"
            className="h-16 sm:h-20 w-auto object-contain"
          />
        </div>

        <div className="flex justify-center items-center gap-1 sm:gap-2 flex-wrap">
          {uniqueZi.map((zi, index) => (
            <div key={zi} className="flex items-center">
              {/* Filter Button */}
              <button
                onClick={() => handleZiFilter(zi)}
                className={`relative w-10 h-10 sm:w-16 sm:h-16 rounded-full font-bold text-xs sm:text-sm uppercase tracking-wider transition-all duration-300 ${
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
                <div className="mx-1 sm:mx-2 w-2 sm:w-6 border-t-2 border-dotted border-orange-300"></div>
              )}
            </div>
          ))}

          {/* Saved Events Button - Only show if there are saved events */}
          {savedEvents.length > 0 && (
            <div className="flex items-center">
              <div className="mx-1 sm:mx-2 w-2 sm:w-6 border-t-2 border-dotted border-orange-300"></div>
              <button
                onClick={() => {
                  const newShowSavedEvents = !showSavedEvents;
                  setShowSavedEvents(newShowSavedEvents);

                  // Clear other filters when showing saved events
                  if (newShowSavedEvents) {
                    setSelectedZi(null);
                    setSearchTerm("");
                    setShowSearch(false);
                  }

                  // Track PostHog event
                  if (typeof window !== "undefined") {
                    posthog.capture("saved_events_filter_clicked", {
                      action: newShowSavedEvents ? "show_saved" : "hide_saved",
                      total_saved_events: savedEvents.length,
                      previous_search_term: searchTerm.trim() || null,
                      previous_date_filter: selectedZi,
                      filters_cleared: newShowSavedEvents,
                      total_events: events.length,
                    });
                  }
                }}
                className={`relative w-10 h-10 sm:w-16 sm:h-16 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center ${
                  showSavedEvents
                    ? "bg-red-500 text-white shadow-lg transform scale-110"
                    : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 shadow-md"
                }`}
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <div className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  {savedEvents.length}
                </div>
                {showSavedEvents && (
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500"></div>
                )}
              </button>
            </div>
          )}

          {/* Search Toggle Button */}
          <div className="flex items-center">
            <div className="mx-1 sm:mx-2 w-2 sm:w-6 border-t-2 border-dotted border-orange-300"></div>
            <button
              onClick={() => {
                setShowSearch(!showSearch);

                // Clear saved events filter when using search
                if (showSavedEvents) {
                  setShowSavedEvents(false);
                }
              }}
              className={`relative w-10 h-10 sm:w-16 sm:h-16 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center ${
                showSearch || searchTerm.trim()
                  ? "bg-orange-500 text-white shadow-lg transform scale-110"
                  : "bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 shadow-md"
              }`}
            >
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {(showSearch || searchTerm.trim()) && (
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-orange-500"></div>
              )}
            </button>
          </div>
        </div>

        {/* Search Input - Shows when toggled */}
        {showSearch && (
          <div className="mt-8 px-4">
            <div className="relative max-w-md mx-auto">
              <input
                type="text"
                placeholder="Caută evenimente..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-3 pl-10 pr-4 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              {searchTerm && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="text-center mt-2 text-sm text-gray-600 dark:text-gray-400">
                Se caută: &quot;
                <span className="font-semibold text-orange-500">
                  {searchTerm}
                </span>
                &quot;
              </div>
            )}
          </div>
        )}

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

      {/* Saved Events Filter Indicator */}
      {showSavedEvents && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-3 rounded-r-lg">
          <div className="flex items-center">
            <svg
              className="h-4 w-4 text-red-400 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span className="text-sm text-red-700 dark:text-red-300">
              Afișare evenimente salvate ({filteredEvents.length}{" "}
              {filteredEvents.length === 1
                ? "eveniment salvat"
                : "evenimente salvate"}
              )
            </span>
          </div>
        </div>
      )}

      {/* Search Filter Indicator */}
      {searchTerm && (
        <div className="mb-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400 p-3 rounded-r-lg">
          <div className="flex items-center">
            <svg
              className="h-4 w-4 text-orange-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <span className="text-sm text-orange-700 dark:text-orange-300">
              Rezultate filtrate pentru: &quot;
              <span className="font-semibold">{searchTerm}</span>&quot; (
              {filteredEvents.length}{" "}
              {filteredEvents.length === 1
                ? "eveniment găsit"
                : "evenimente găsite"}
              )
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow relative z-0"
          >
            {/* Single Day Badge */}
            {isSingleDayEvent(event) && (
              <div className="absolute top-3 left-3 z-10 bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                DOAR AZI
              </div>
            )}

            <div className="flex flex-col sm:flex-row">
              {/* Event Image */}
              {event.Attachments && event.Attachments[0] && (
                <div className="w-full sm:w-64 flex-shrink-0 relative">
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
              <div className="flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-3 p-3 sm:pr-6 sm:p-0">
                {/* Details Button */}
                {event.Link ? (
                  <a
                    href={event.Link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleDetaliiClick(event)}
                    className="text-orange-400 hover:text-orange-500 font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors duration-200"
                  >
                    DETALII
                  </a>
                ) : (
                  <button
                    onClick={() => handleDetaliiClick(event)}
                    className="text-gray-400 font-bold text-xs sm:text-sm uppercase tracking-wider cursor-not-allowed"
                  >
                    DETALII
                  </button>
                )}

                {/* Save Button */}
                <button
                  onClick={() => handleSaveEvent(event.id)}
                  className={`font-bold text-xs sm:text-sm uppercase tracking-wider transition-colors duration-200 ${
                    savedEvents.includes(event.id)
                      ? "text-red-600 hover:text-red-500"
                      : "text-red-500 hover:text-red-600"
                  }`}
                >
                  {savedEvents.includes(event.id) ? "SALVAT" : "SALVEAZĂ"}
                </button>
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
