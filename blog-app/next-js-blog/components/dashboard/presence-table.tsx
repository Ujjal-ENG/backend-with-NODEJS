"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
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
import type { PostCreatorPresenceUser, PostCreatorPresenceView } from "@/types/api";

const PRESENCE_REFRESH_INTERVAL_MS = 20_000;

async function fetchPostCreatorsPresence(): Promise<PostCreatorPresenceView> {
  const res = await fetch("/api/presence/post-creators", {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? "Failed to load online users");
  }

  return res.json();
}

function formatLastSeen(lastSeenAt: string | null): string {
  if (!lastSeenAt) {
    return "Never";
  }

  const date = new Date(lastSeenAt);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  const diffMs = Date.now() - date.getTime();

  if (diffMs < 60_000) {
    return "Just now";
  }
  if (diffMs < 60 * 60_000) {
    return `${Math.floor(diffMs / 60_000)} min ago`;
  }
  if (diffMs < 24 * 60 * 60_000) {
    return `${Math.floor(diffMs / (60 * 60_000))} hr ago`;
  }

  return date.toLocaleString();
}

function sortPresenceUsers(
  users: PostCreatorPresenceUser[],
): PostCreatorPresenceUser[] {
  return [...users].sort((a, b) => {
    if (a.isOnline !== b.isOnline) {
      return Number(b.isOnline) - Number(a.isOnline);
    }

    return `${a.firstName} ${a.lastName ?? ""}`.localeCompare(
      `${b.firstName} ${b.lastName ?? ""}`,
    );
  });
}

interface PresenceTableProps {
  initialData: PostCreatorPresenceView;
  initialError?: string;
}

export function PresenceTable({ initialData, initialError }: PresenceTableProps) {
  const [presence, setPresence] = useState<PostCreatorPresenceView>(initialData);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshPresence = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const nextPresence = await fetchPostCreatorsPresence();
      setPresence(nextPresence);
      setError(null);
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

  useEffect(() => {
    if (initialError) {
      void refreshPresence();
    }

    const intervalId = window.setInterval(() => {
      void refreshPresence();
    }, PRESENCE_REFRESH_INTERVAL_MS);

    const onFocus = () => {
      void refreshPresence();
    };

    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [initialError, refreshPresence]);

  const sortedUsers = useMemo(
    () => sortPresenceUsers(presence.users),
    [presence.users],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Post Creator Presence</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Last checked: {new Date(presence.checkedAt).toLocaleTimeString()}
            </p>
          </div>
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
          {error ? (
            <div className="px-6 pb-4 text-sm text-destructive">{error}</div>
          ) : null}

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
                sortedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">
                        {user.firstName} {user.lastName ?? ""}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>
                      <Badge variant={user.canCreatePost ? "default" : "outline"}>
                        {user.canCreatePost ? "Can create post" : "No post create"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isOnline ? "default" : "secondary"}>
                        {user.isOnline ? "Online" : "Offline"}
                      </Badge>
                    </TableCell>
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
