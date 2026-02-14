import Link from "next/link";
import { getSession } from "@/lib/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";

export async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold"
          >
            <PenLine className="h-5 w-5" />
            Blog App
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            <Link
              href="/posts"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Posts
            </Link>
            <Link
              href="/dashboard/pricing"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session ? (
            <UserMenu email={session.email} />
          ) : (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/sign-up">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
