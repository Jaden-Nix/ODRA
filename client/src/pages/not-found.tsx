import { Link } from "wouter";
import { Home, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-6">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-10 pb-8 px-8">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Code2 className="h-10 w-10 text-primary" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold mb-2">404</h1>
          <h2 className="text-xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-8">
            The contract you're looking for doesn't exist in this deployment. 
            It might have been moved or deleted.
          </p>
          
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/" data-testid="link-home">
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/editor" data-testid="link-editor">
                <Code2 className="h-4 w-4 mr-2" />
                Open Editor
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
