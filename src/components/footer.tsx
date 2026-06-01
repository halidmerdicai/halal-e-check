import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col gap-3 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Halal E-Check provides general guidance, not final religious rulings.</p>
        <div className="flex gap-4">
          <Link href="/disclaimer" className="hover:text-foreground">
            Disclaimer
          </Link>
          <Link href="/guide" className="hover:text-foreground">
            Guide
          </Link>
        </div>
      </div>
    </footer>
  );
}
