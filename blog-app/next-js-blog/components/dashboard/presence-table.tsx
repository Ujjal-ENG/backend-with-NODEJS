"use client";

/**
 * =============================================================================
 * PRESENCE TABLE COMPONENT
 * =============================================================================
 *
 * Admin dashboard component for monitoring post creator online/offline status.
 * Displays a real-time view of team availability with auto-refresh functionality.
 *
 * Features:
 * - Summary cards showing total, online, and offline counts
 * - Sortable table of users (online first, then alphabetical)
 * - Auto-refresh every 20 seconds
 * - Manual refresh button
 * - Refresh on window focus (when user returns to tab)
 * - Human-readable "last seen" timestamps
 * - Error handling with user-friendly messages
 *
 * Visual Layout:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐               │
 * │  │ Total In Scope│  │ 🟢 Online     │  │ ⚫ Offline    │               │
 * │  │     15        │  │     8         │  │     7         │               │
 * │  └───────────────┘  └───────────────┘  └───────────────┘               │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  Post Creator Presence                              [🔄 Refresh]       │
 * │  Last checked: 10:30:45 AM                                             │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │  User          │ Role    │ Post Access    │ Status  │ Last Seen        │
 * │  ─────────────────────────────────────────────────────────────────────  │
 * │  Jane Doe      │ creator │ Can create     │ Online  │ Just now         │
 * │  jane@ex.com   │         │                │         │                  │
 * │  ─────────────────────────────────────────────────────────────────────  │
 * │  John Smith    │ editor  │ No post create │ Offline │ 15 min ago       │
 * │  john@ex.com   │         │                │         │                  │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * @example
 * // Usage in a Next.js page with server-side data fetching
 * // app/admin/presence/page.tsx
 *
 * async function PresencePage() {
 *   const initialData = await getPostCreatorsPresence();
 *
 *   return (
 *     <div className="container py-8">
 *       <h1>Team Availability</h1>
 *       <PresenceTable initialData={initialData} />
 *     </div>
 *   );
 * }
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  PostCreatorPresenceUser,
  PostCreatorPresenceView,
} from "@/types/api";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

/**
 * =============================================================================
 * CONSTANTS
 * =============================================================================
 */

/**
 * Interval between automatic presence data refreshes in milliseconds.
 *
 * Current value: 20 seconds (20,000ms)
 *
 * This ensures the displayed data stays relatively fresh without
 * overwhelming the server with requests.
 *
 * Trade-offs:
 * - Shorter interval → More up-to-date data, but more API requests
 * - Longer interval → Less accurate presence, but lower server load
 */
const PRESENCE_REFRESH_INTERVAL_MS = 5000;

/**
 * =============================================================================
 * API FUNCTIONS
 * =============================================================================
 */

/**
 * Fetches the current presence status of all post creators from the API.
 *
 * @returns Promise resolving to PostCreatorPresenceView with all presence data
 * @throws Error with message from API or generic fallback
 *
 * @example
 * // Success case
 * const presence = await fetchPostCreatorsPresence();
 * // Returns: { checkedAt: Date, total: 15, onlineCount: 8, ... }
 *
 * @example
 * // Error case (non-admin user)
 * await fetchPostCreatorsPresence();
 * // Throws: Error("Only admins can view post creator online status")
 */
async function fetchPostCreatorsPresence(): Promise<PostCreatorPresenceView> {
  const res = await fetch("/api/presence/post-creators", {
    method: "GET",
    cache: "no-store", // Always fetch fresh data
  });

  if (!res.ok) {
    // Try to extract error message from response body
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? "Failed to load online users");
  }

  return res.json();
}

/**
 * =============================================================================
 * UTILITY FUNCTIONS
 * =============================================================================
 */

/**
 * Formats a timestamp into a human-readable "time ago" string.
 *
 * Output format varies based on how long ago the timestamp was:
 * - < 1 minute: "Just now"
 * - < 1 hour: "X min ago"
 * - < 24 hours: "X hr ago"
 * - >= 24 hours: Full locale date/time string
 *
 * @param lastSeenAt - ISO timestamp string or null
 * @returns Human-readable time string
 *
 * @example
 * formatLastSeen(null)
 * // Returns: "Never"
 *
 * @example
 * formatLastSeen("invalid-date")
 * // Returns: "Unknown"
 *
 * @example
 * // 30 seconds ago
 * formatLastSeen(new Date(Date.now() - 30_000).toISOString())
 * // Returns: "Just now"
 *
 * @example
 * // 15 minutes ago
 * formatLastSeen(new Date(Date.now() - 15 * 60_000).toISOString())
 * // Returns: "15 min ago"
 *
 * @example
 * // 3 hours ago
 * formatLastSeen(new Date(Date.now() - 3 * 60 * 60_000).toISOString())
 * // Returns: "3 hr ago"
 *
 * @example
 * // 2 days ago
 * formatLastSeen(new Date(Date.now() - 2 * 24 * 60 * 60_000).toISOString())
 * // Returns: "1/13/2024, 10:30:00 AM" (locale-formatted)
 */
function formatLastSeen(lastSeenAt: string | null): string {
  // Handle null (user has never been online)
  if (!lastSeenAt) {
    return "Never";
  }

  const date = new Date(lastSeenAt);

  // Handle invalid date strings
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  // Calculate time difference
  const diffMs = Date.now() - date.getTime();

  // Less than 1 minute ago
  if (diffMs < 60_000) {
    return "Just now";
  }

  // Less than 1 hour ago (show minutes)
  if (diffMs < 60 * 60_000) {
    return `${Math.floor(diffMs / 60_000)} min ago`;
  }

  // Less than 24 hours ago (show hours)
  if (diffMs < 24 * 60 * 60_000) {
    return `${Math.floor(diffMs / (60 * 60_000))} hr ago`;
  }

  // More than 24 hours ago (show full date/time)
  return date.toLocaleString();
}

/**
 * Sorts users by online status (online first) then alphabetically by name.
 *
 * Sorting logic:
 * 1. Online users appear before offline users
 * 2. Within each group, sort alphabetically by full name
 *
 * @param users - Array of presence users to sort
 * @returns New sorted array (does not mutate original)
 *
 * @example
 * const users = [
 *   { firstName: "Zoe", lastName: "Adams", isOnline: false },
 *   { firstName: "Alice", lastName: "Brown", isOnline: true },
 *   { firstName: "Bob", lastName: "Clark", isOnline: false },
 *   { firstName: "Charlie", lastName: "Davis", isOnline: true },
 * ];
 *
 * sortPresenceUsers(users);
 * // Returns:
 * // [
 * //   { firstName: "Alice", ..., isOnline: true },   // Online, alphabetically first
 * //   { firstName: "Charlie", ..., isOnline: true }, // Online, alphabetically second
 * //   { firstName: "Bob", ..., isOnline: false },    // Offline, alphabetically first
 * //   { firstName: "Zoe", ..., isOnline: false },    // Offline, alphabetically second
 * // ]
 */
function sortPresenceUsers(
  users: PostCreatorPresenceUser[],
): PostCreatorPresenceUser[] {
  // Create new array to avoid mutating the original
  return [...users].sort((a, b) => {
    // Primary sort: online status (online first)
    // Number(true) = 1, Number(false) = 0
    // b.isOnline - a.isOnline puts online (1) before offline (0)
    if (a.isOnline !== b.isOnline) {
      return Number(b.isOnline) - Number(a.isOnline);
    }

    // Secondary sort: alphabetical by full name
    return `${a.firstName} ${a.lastName ?? ""}`.localeCompare(
      `${b.firstName} ${b.lastName ?? ""}`,
    );
  });
}

/**
 * =============================================================================
 * COMPONENT PROPS
 * =============================================================================
 */

/**
 * Props for the PresenceTable component.
 */
interface PresenceTableProps {
  /**
   * Initial presence data, typically fetched server-side.
   * Used to render the table immediately without loading state.
   */
  initialData: PostCreatorPresenceView;

  /**
   * Optional initial error message.
   * If provided, the component will attempt to refresh immediately.
   */
  initialError?: string;
}

/**
 * =============================================================================
 * MAIN COMPONENT
 * =============================================================================
 */

/**
 * Displays a table of post creators with their online/offline status.
 *
 * State Management:
 * - `presence`: Current presence data (initialized from props, updated on refresh)
 * - `error`: Error message if last fetch failed
 * - `isRefreshing`: Loading state for the refresh button
 *
 * Automatic Refresh Triggers:
 * 1. On mount (if initialError is provided)
 * 2. Every PRESENCE_REFRESH_INTERVAL_MS (20 seconds)
 * 3. When window gains focus (user returns to tab)
 * 4. Manual refresh button click
 *
 * @param props - Component props with initial data
 * @returns React element with summary cards and presence table
 */
export function PresenceTable({
  initialData,
  initialError,
}: PresenceTableProps) {
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════════════════

  /** Current presence data (users, counts, timestamp) */
  const [presence, setPresence] =
    useState<PostCreatorPresenceView>(initialData);

  /** Error message from last failed fetch, or null if successful */
  const [error, setError] = useState<string | null>(initialError ?? null);

  /** True while a refresh request is in progress */
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ═══════════════════════════════════════════════════════════════════════════
  // CALLBACKS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Fetches fresh presence data from the API.
   *
   * - Sets loading state during fetch
   * - Updates presence state on success
   * - Sets error state on failure
   * - Clears error on success
   */
  const refreshPresence = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const nextPresence = await fetchPostCreatorsPresence();
      setPresence(nextPresence);
      setError(null); // Clear any previous error
    } catch (refreshError) {
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Failed to refresh online status",
      );
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Sets up automatic refresh behavior:
   * 1. Immediate refresh if there was an initial error
   * 2. Periodic refresh every PRESENCE_REFRESH_INTERVAL_MS
   * 3. Refresh when window gains focus
   */
  useEffect(() => {
    // ─────────────────────────────────────────────────────────────────────────
    // If server-side fetch failed, try again immediately on client
    // ─────────────────────────────────────────────────────────────────────────
    if (initialError) {
      void refreshPresence();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Set up periodic refresh interval
    // ─────────────────────────────────────────────────────────────────────────
    const intervalId = window.setInterval(() => {
      void refreshPresence();
    }, PRESENCE_REFRESH_INTERVAL_MS);

    // ─────────────────────────────────────────────────────────────────────────
    // Refresh when user returns to the tab
    // This ensures data is fresh when the user starts looking at the page
    // ─────────────────────────────────────────────────────────────────────────
    const onFocus = () => {
      void refreshPresence();
    };

    window.addEventListener("focus", onFocus);

    // ─────────────────────────────────────────────────────────────────────────
    // Cleanup: clear interval and remove listener on unmount
    // ─────────────────────────────────────────────────────────────────────────
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [initialError, refreshPresence]);

  // ═══════════════════════════════════════════════════════════════════════════
  // DERIVED STATE
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Memoized sorted users list.
   * Only recalculates when presence.users changes.
   * Sorts online users first, then alphabetically.
   */
  const sortedUsers = useMemo(
    () => sortPresenceUsers(presence.users),
    [presence.users],
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-4">
      {/* ─────────────────────────────────────────────────────────────────────
          SUMMARY CARDS
          Three cards showing total, online, and offline counts.
          Grid layout: 1 column on mobile, 2 on tablet, 3 on desktop.
      ───────────────────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Users Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total In Scope
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{presence.total}</div>
          </CardContent>
        </Card>

        {/* Online Count Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Wifi className="h-4 w-4 text-emerald-500" />
              Online
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{presence.onlineCount}</div>
          </CardContent>
        </Card>

        {/* Offline Count Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <WifiOff className="h-4 w-4 text-muted-foreground" />
              Offline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{presence.offlineCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────────────
          PRESENCE TABLE CARD
          Contains header with title, timestamp, refresh button, and the table.
      ───────────────────────────────────────────────────────────────────── */}
      <Card>
        {/* Card Header: Title, timestamp, and refresh button */}
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Post Creator Presence</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Last checked: {new Date(presence.checkedAt).toLocaleTimeString()}
            </p>
          </div>

          {/* Manual Refresh Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => void refreshPresence()}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {/* ─────────────────────────────────────────────────────────────────
              ERROR MESSAGE
              Displayed above the table if there was a fetch error.
          ───────────────────────────────────────────────────────────────── */}
          {error ? (
            <div className="px-6 pb-4 text-sm text-destructive">{error}</div>
          ) : null}

          {/* ─────────────────────────────────────────────────────────────────
              USERS TABLE
              Displays all post creators with their status.
              Columns: User (name/email), Role, Post Access, Status, Last Seen
          ───────────────────────────────────────────────────────────────── */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Post Access</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* ─────────────────────────────────────────────────────────────
                  EMPTY STATE
                  Shown when no users match the criteria.
              ───────────────────────────────────────────────────────────── */}
              {sortedUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No admins or post creators found.
                  </TableCell>
                </TableRow>
              ) : (
                /* ─────────────────────────────────────────────────────────────
                   USER ROWS
                   One row per user with all their presence info.
                ───────────────────────────────────────────────────────────── */
                sortedUsers.map((user) => (
                  <TableRow key={user.id}>
                    {/* User Column: Name and email */}
                    <TableCell>
                      <div className="font-medium">
                        {user.firstName} {user.lastName ?? ""}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </TableCell>

                    {/* Role Column: User's role (capitalized) */}
                    <TableCell className="capitalize">{user.role}</TableCell>

                    {/* Post Access Column: Badge showing create permission */}
                    <TableCell>
                      <Badge
                        variant={user.canCreatePost ? "default" : "outline"}
                      >
                        {user.canCreatePost
                          ? "Can create post"
                          : "No post create"}
                      </Badge>
                    </TableCell>

                    {/* Status Column: Online/Offline badge */}
                    <TableCell>
                      <Badge variant={user.isOnline ? "default" : "secondary"}>
                        {user.isOnline ? "Online" : "Offline"}
                      </Badge>
                    </TableCell>

                    {/* Last Seen Column: Human-readable timestamp */}
                    <TableCell>{formatLastSeen(user.lastSeenAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
