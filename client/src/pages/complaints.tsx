import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Shield, Plus, FileText, Lock, Calendar, MapPin, TrendingUp, ArrowLeft } from "lucide-react";
import type { Complaint } from "@shared/schema";
import { format } from "date-fns";

export default function Complaints() {
  const { user, isLoading: authLoading, isPremiumTier } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [user, authLoading, toast]);

  const { data: complaints, isLoading } = useQuery<Complaint[]>({
    queryKey: ["/api/complaints"],
    enabled: !!user,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'under_review': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'resolved': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'closed': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg">BadBlue</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              Complaints
            </h1>
            <p className="text-muted-foreground">
              {isPremiumTier 
                ? "Track and manage your filed complaints"
                : "View your filed complaints. Upgrade to Premium for status tracking."}
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild data-testid="button-new-complaint">
              <Link href="/complaints/new">
                <Plus className="w-4 h-4 mr-2" />
                New Complaint
              </Link>
            </Button>
            <Button variant="ghost" asChild data-testid="link-home">
              <Link href="/">Home</Link>
            </Button>
          </div>
        </div>

        {/* Premium Upsell for Basic Users */}
        {!isPremiumTier && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Unlock Complaint Tracking with Premium</h3>
                  <p className="text-muted-foreground mb-4">
                    See real-time status updates, track case progress, and access detailed analytics for your complaints. Get bulk upload capabilities and priority support.
                  </p>
                  <Button asChild data-testid="button-upgrade-premium">
                    <Link href="/subscription">
                      <Lock className="w-4 h-4 mr-2" />
                      Upgrade to Premium - $19.99/mo
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Complaints List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : complaints && complaints.length > 0 ? (
          <div className="space-y-4">
            {complaints.map((complaint) => (
              <Card key={complaint.id} className="hover-elevate" data-testid={`card-complaint-${complaint.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">
                          {complaint.officerName}
                        </CardTitle>
                        {isPremiumTier && (
                          <Badge className={`${getStatusColor(complaint.status)} border`}>
                            {getStatusLabel(complaint.status)}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="flex flex-wrap gap-4 text-sm">
                        {complaint.officerBadge && (
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            Badge #{complaint.officerBadge}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(complaint.incidentDate), 'MMM dd, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {complaint.incidentLocation}
                        </span>
                      </CardDescription>
                    </div>
                    {!isPremiumTier && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Lock className="w-4 h-4" />
                        <span>Premium Feature</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {complaint.officerDepartment && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Department</div>
                        <div className="font-medium">{complaint.officerDepartment}</div>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Description</div>
                      <p className="text-sm line-clamp-3">{complaint.description}</p>
                    </div>

                    {isPremiumTier && complaint.statusUpdatedAt && (
                      <div className="pt-3 border-t text-sm text-muted-foreground">
                        Last updated: {format(new Date(complaint.statusUpdatedAt), 'MMM dd, yyyy h:mm a')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Complaints Filed</h3>
              <p className="text-muted-foreground mb-6">
                You haven't filed any complaints yet. Start by uploading a badge photo or create a complaint directly.
              </p>
              <Button asChild data-testid="button-file-first-complaint">
                <Link href="/complaints/new">
                  <Plus className="w-4 h-4 mr-2" />
                  File Your First Complaint
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
