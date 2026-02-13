import { PresenceTable } from "@/components/dashboard/presence-table";
import { canManageUsers } from "@/lib/abac";
import { getPostCreatorsPresence } from "@/lib/api/presence";
import { getSession } from "@/lib/auth";
import type { PostCreatorPresenceView } from "@/types/api";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Online Users" };

function buildEmptyPresence(): PostCreatorPresenceView {
  return {
    checkedAt: new Date().toISOString(),
    total: 0,
    onlineCount: 0,
    offlineCount: 0,
    users: [],
  };
}

export default async function PresencePage() {
  const session = await getSession();
  if (!canManageUsers(session)) {
    redirect("/dashboard?forbidden=true");
  }

  let initialPresence = buildEmptyPresence();
  let initialError: string | undefined;

  try {
    initialPresence = await getPostCreatorsPresence();
    console.log(initialPresence);
  } catch (error) {
    initialError =
      error instanceof Error ? error.message : "Failed to load online status";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Online Users</h1>
        <p className="text-sm text-muted-foreground">
          Live status for admins and users who can create posts.
        </p>
      </div>
      <PresenceTable
        initialData={initialPresence}
        initialError={initialError}
      />
    </div>
  );
}
