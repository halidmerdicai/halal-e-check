import Link from "next/link";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container grid min-h-[70vh] place-items-center py-12">
      <div className="w-full max-w-xl space-y-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Not found</p>
        <h1 className="text-4xl font-bold">We do not have that E-number yet.</h1>
        <p className="text-muted-foreground">Try another code, additive name, or alias.</p>
        <SearchBar />
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
