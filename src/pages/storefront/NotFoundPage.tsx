import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Seo } from "@/lib/seo";

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Seo title="Page not found | RAES TECH" noindex />
      <p className="text-7xl font-black text-muted-foreground/30">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you're looking for doesn't exist or has moved.
      </p>
      <Button asChild className="mt-6">
        <Link to="/">Back to Home</Link>
      </Button>
    </div>
  );
}
