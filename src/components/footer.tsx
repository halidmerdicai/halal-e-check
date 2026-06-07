import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col gap-3 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Halal E-Check provides general guidance, not final religious rulings.</p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/disclaimer" className="hover:text-foreground">
            Disclaimer
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/guide" className="hover:text-foreground">
            Guide
          </Link>
          <Link href="/methodology" className="hover:text-foreground">
            Method
          </Link>
          <Link href="/corrections" className="hover:text-foreground">
            Corrections
          </Link>
        </div>
      </div>
    </footer>
  );
}
