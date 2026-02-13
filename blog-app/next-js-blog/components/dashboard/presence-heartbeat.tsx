"use client";

/**
 * =============================================================================
 * PRESENCE HEARTBEAT COMPONENT
 * =============================================================================
 *
 * A headless React component that maintains the user's online presence status.
 * This component handles the client-side of the presence tracking system by:
 *
 * - Sending periodic "ping" requests to keep the user marked as online
 * - Detecting when the user returns to the tab (visibility change)
 * - Sending "offline" signal when the user leaves or closes the page
 *
 * How it works:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │                         PRESENCE LIFECYCLE                              │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │                                                                         │
 * │  Component Mounts                                                       │
 * │        │                                                                │
 * │        ▼                                                                │
 * │  ┌─────────────┐     Every 60s      ┌─────────────┐                    │
 * │  │ Initial Ping │ ──────────────────▶│ Ping Server │ ◀──┐              │
 * │  └─────────────┘                     └─────────────┘    │              │
 * │                                            │            │              │
 * │  Tab becomes visible ──────────────────────┘            │              │
 * │                                                         │              │
 * │  Interval Timer ────────────────────────────────────────┘              │
 * │                                                                         │
 * │  Page Hide / Unmount                                                    │
 * │        │                                                                │
 * │        ▼                                                                │
 * │  ┌──────────────────┐                                                  │
 * │  │ Offline Signal   │ (via sendBeacon for reliability)                 │
 * │  └──────────────────┘                                                  │
 * │                                                                         │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Usage:
 * Place this component once in your app's root layout to enable presence
 * tracking for all authenticated users.
 *
 * @example
 * // app/layout.tsx (Next.js App Router)
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <PresenceHeartbeat />
 *       </body>
 *     </html>
 *   );
 * }
 *
 * @example
 * // Conditional rendering for authenticated users only
 * export default function AuthenticatedLayout({ children }) {
 *   const { isAuthenticated } = useAuth();
 *
 *   return (
 *     <>
 *       {children}
 *       {isAuthenticated && <PresenceHeartbeat />}
 *     </>
 *   );
 * }
 */

import { useEffect } from "react";

/**
 * =============================================================================
 * CONSTANTS
 * =============================================================================
 */

/**
 * Interval between heartbeat pings in milliseconds.
 *
 * Current value: 60 seconds (60,000ms)
 *
 * This should be shorter than the server's staleness window
 * (typically 5 minutes) to ensure the user stays marked as online.
 *
 * Trade-offs:
 * - Shorter interval → More accurate presence, but more network requests
 * - Longer interval → Risk of being marked offline prematurely
 *
 * Recommended: Keep this at 1/3 to 1/5 of the server's staleness window.
 *
 * @example
 * // Server staleness window: 5 minutes (300,000ms)
 * // Heartbeat interval: 60 seconds (60,000ms)
 * // User will send ~5 pings before being considered stale
 */
const HEARTBEAT_INTERVAL_MS = 60_000;

/**
 * =============================================================================
 * HELPER FUNCTIONS
 * =============================================================================
 */

/**
 * Sends a presence update to the server.
 *
 * @param path - The API endpoint: "/api/presence/ping" or "/api/presence/offline"
 * @returns Promise that resolves when the request completes
 *
 * Configuration:
 * - method: "POST" - Modifies server state
 * - cache: "no-store" - Ensures fresh request every time
 * - keepalive: true - Allows request to complete even if page is closing
 *
 * @example
 * // Mark user as online
 * await sendPresenceUpdate("/api/presence/ping");
 *
 * @example
 * // Mark user as offline
 * await sendPresenceUpdate("/api/presence/offline");
 */
async function sendPresenceUpdate(
  path: "/api/presence/ping" | "/api/presence/offline",
): Promise<number | undefined> {
  const res = await fetch(path, {
    method: "POST",
    cache: "no-store", // Bypass cache for accurate presence updates
    keepalive: true, // Allow request to complete during page unload
  });

  if (res.status === 429) {
    const retryAfterHeader = res.headers.get("retry-after");
    const retryAfterSeconds = Number(retryAfterHeader);

    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
      return retryAfterSeconds;
    }

    return 30;
  }

  if (!res.ok) {
    throw new Error(`Presence update failed with status ${res.status}`);
  }

  return undefined;
}

/**
 * =============================================================================
 * MAIN COMPONENT
 * =============================================================================
 */

/**
 * Headless component that maintains user presence status.
 *
 * This component renders nothing (returns null) but sets up:
 * 1. Initial ping on mount
 * 2. Periodic heartbeat interval
 * 3. Visibility change listener (for tab switching)
 * 4. Page hide listener (for navigation/close)
 * 5. Cleanup on unmount
 *
 * All event listeners and intervals are properly cleaned up on unmount
 * to prevent memory leaks.
 *
 * @returns null - This is a headless component with no visual output
 *
 * @example
 * // Basic usage - renders nothing visible
 * <PresenceHeartbeat />
 *
 * @example
 * // In a layout component
 * function DashboardLayout({ children }) {
 *   return (
 *     <div className="dashboard">
 *       <Sidebar />
 *       <main>{children}</main>
 *       <PresenceHeartbeat />
 *     </div>
 *   );
 */
export function PresenceHeartbeat() {
  useEffect(() => {
    let blockedUntil = 0;
    const pingOnlinePresence = async () => {
      if (Date.now() < blockedUntil) {
        return;
      }

      const retryAfterSeconds = await sendPresenceUpdate("/api/presence/ping");
      if (typeof retryAfterSeconds === "number" && retryAfterSeconds > 0) {
        blockedUntil = Date.now() + retryAfterSeconds * 1000;
      }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 1: Send initial ping immediately on mount
    // This marks the user as online as soon as the component loads
    // ─────────────────────────────────────────────────────────────────────────
    void pingOnlinePresence().catch(() => undefined);

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 2: Set up periodic heartbeat interval
    // Sends ping every HEARTBEAT_INTERVAL_MS (60 seconds)
    // ─────────────────────────────────────────────────────────────────────────
    const intervalId = window.setInterval(() => {
      void pingOnlinePresence().catch(() => undefined);
    }, HEARTBEAT_INTERVAL_MS);

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 3: Handle visibility changes (tab switching)
    //
    // When user switches back to this tab:
    // - Send immediate ping to update presence
    // - Don't wait for next interval
    //
    // visibilityState values:
    // - "visible": Tab is in foreground
    // - "hidden": Tab is in background or minimized
    // ─────────────────────────────────────────────────────────────────────────
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // User returned to tab - immediately update presence
        void pingOnlinePresence().catch(() => undefined);
      }
    };

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 4: Handle page hide (navigation away or closing)
    //
    // pagehide event fires when:
    // - User navigates to another page
    // - User closes the tab/browser
    // - User refreshes the page
    //
    // We use navigator.sendBeacon() when available because:
    // - It's designed for "fire and forget" requests during page unload
    // - It's more reliable than fetch during page close
    // - It doesn't block the page unload
    //
    // Fallback to fetch for older browsers that don't support sendBeacon.
    // ─────────────────────────────────────────────────────────────────────────
    const onPageHide = () => {
      if (navigator.sendBeacon) {
        // Preferred: sendBeacon is reliable during page unload
        navigator.sendBeacon("/api/presence/offline");
        return;
      }
      // Fallback: fetch with keepalive (less reliable during unload)
      void sendPresenceUpdate("/api/presence/offline").catch(() => undefined);
    };

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 5: Register event listeners
    // ─────────────────────────────────────────────────────────────────────────
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);

    // ─────────────────────────────────────────────────────────────────────────
    // STEP 6: Cleanup function (runs on unmount)
    //
    // Important: Always clean up to prevent:
    // - Memory leaks from lingering event listeners
    // - Continued interval execution after unmount
    // - Multiple listeners if component remounts
    // ─────────────────────────────────────────────────────────────────────────
    return () => {
      // Clear the heartbeat interval
      window.clearInterval(intervalId);

      // Remove event listeners
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);

      // Send final offline signal on unmount
      // This handles cases like:
      // - User logs out (component unmounts)
      // - Navigating to a page without PresenceHeartbeat
      void sendPresenceUpdate("/api/presence/offline").catch(() => undefined);
    };
  }, []); // Empty dependency array: run once on mount

  // ─────────────────────────────────────────────────────────────────────────
  // This is a headless component - renders nothing
  // ─────────────────────────────────────────────────────────────────────────
  return null;
}
