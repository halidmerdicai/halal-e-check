import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 font-semibold" aria-label="Halal E-Check home">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>Halal E-Check</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href="/guide">Guide</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/about">About</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
