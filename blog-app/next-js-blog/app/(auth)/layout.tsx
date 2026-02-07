import Link from "next/link";
import { PenLine } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
      <Link
        href="/"
        className="mb-8 flex items-center gap-2 text-2xl font-bold"
      >
        <PenLine className="h-6 w-6" />
        Blog App
      </Link>
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
