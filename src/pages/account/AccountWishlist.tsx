import { Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function AccountWishlist() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Wishlist</h1>
      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <Heart className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">Your wishlist is empty</p>
          <Button asChild className="mt-5"><a href="/phones">Discover phones</a></Button>
        </CardContent>
      </Card>
    </div>
  );
}
