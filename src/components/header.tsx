"use client";

import Link from "next/link";
import { CheckCircle2, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const secondaryLinks = [
  { href: "/guide", label: "Guide" },
  { href: "/methodology", label: "Method" },
  { href: "/request", label: "Request" },
  { href: "/corrections", label: "Corrections" },
  { href: "/about", label: "About" }
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container relative flex h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 font-semibold"
          aria-label="Halal E-Check home"
          onClick={() => setMenuOpen(false)}
        >
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="truncate">Halal E-Check</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary navigation">
          <Button asChild variant="ghost" size="sm">
            <Link href="/guide">Guide</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/methodology">Method</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/check">Check</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/request">Request</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/corrections">Corrections</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/about">About</Link>
          </Button>
        </nav>

        <div className="flex flex-none items-center gap-2 lg:hidden">
          <Button asChild size="sm">
            <Link href="/check" onClick={() => setMenuOpen(false)}>
              Check
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-9 px-0"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-4 w-4" aria-hidden="true" /> : <Menu className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </div>

        {menuOpen ? (
          <nav
            id="mobile-navigation"
            className="absolute left-4 right-4 top-[calc(100%+0.5rem)] rounded-lg border bg-background p-2 shadow-lg lg:hidden"
            aria-label="Mobile navigation"
          >
            <div className="grid gap-1">
              {secondaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
