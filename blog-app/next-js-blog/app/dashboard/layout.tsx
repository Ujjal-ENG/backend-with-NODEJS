import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { PresenceHeartbeat } from "@/components/dashboard/presence-heartbeat";
import { canManageTags, canManageUsers } from "@/lib/abac";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        canManageTags={canManageTags(session)}
        canManageUsers={canManageUsers(session)}
      />
      <div className="flex flex-1 flex-col">
        <PresenceHeartbeat />
        <DashboardHeader email={session.email} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
