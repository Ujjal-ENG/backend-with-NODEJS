export function Footer() {
  return (
    <footer className="border-t py-8">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} Blog App. Built with Next.js &
          NestJS.
        </p>
      </div>
    </footer>
  );
}
