import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";

export function DashboardHeader({ email }: { email: string }) {
  return (
    <header className="flex h-16 items-center justify-between border-b px-6">
      <h2 className="text-lg font-semibold">Dashboard</h2>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <UserMenu email={email} />
      </div>
    </header>
  );
}
