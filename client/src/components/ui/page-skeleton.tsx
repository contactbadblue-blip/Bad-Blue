import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Skeleton for generic page loading
export function PageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-500">
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Content cards skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Skeleton for landing page
export function LandingSkeleton() {
  return (
    <div className="min-h-screen animate-in fade-in duration-500">
      {/* Hero section skeleton */}
      <section className="relative h-[100vh] bg-muted flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <Skeleton className="h-16 w-full max-w-2xl mx-auto" />
          <Skeleton className="h-6 w-full max-w-3xl mx-auto" />
          <Skeleton className="h-6 w-full max-w-3xl mx-auto" />
          <div className="flex justify-center gap-4 pt-8">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>
      </section>
    </div>
  );
}

// Skeleton for authentication loading
export function AuthLoadingSkeleton() {
  return (
    <div className="flex items-center justify-center min-h-screen animate-in fade-in duration-300">
      <div className="text-center space-y-4">
        <div className="spinner w-12 h-12 mx-auto" />
        <p className="text-muted-foreground">Checking authentication...</p>
      </div>
    </div>
  );
}

// CSS for spinner (if not already in global styles)
const spinnerStyles = `
  .spinner {
    border: 3px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// Add spinner styles to head if not present
if (typeof document !== "undefined" && !document.querySelector("#spinner-styles")) {
  const style = document.createElement("style");
  style.id = "spinner-styles";
  style.textContent = spinnerStyles;
  document.head.appendChild(style);
}