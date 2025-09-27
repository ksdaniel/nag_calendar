"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";

function PostHogPageviewImpl() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window !== "undefined" && pathname) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function PostHogPageview() {
  return (
    <Suspense fallback={null}>
      <PostHogPageviewImpl />
    </Suspense>
  );
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY || "", {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
        person_profiles: "identified_only",
        loaded: (posthog) => {
          if (process.env.NODE_ENV === "development")
            console.log("PostHog loaded");
        },
      });
    }
  }, []);

  return (
    <>
      <PostHogPageview />
      {children}
    </>
  );
}
