import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle, Clock, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Complaint } from "@shared/schema";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function ComplaintDetail() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/complaint/:id");
  const complaintId = params?.id;
  const [isFormPreviewOpen, setIsFormPreviewOpen] = useState(false);

  const { data: complaint, isLoading } = useQuery<Complaint>({
    queryKey: ['/api/complaints', complaintId],
    enabled: !!complaintId,
  });

  // Show success message if coming from payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      toast({
        title: "Payment Successful",
        description: "Your complaint has been filed and will be routed to the appropriate authorities.",
      });
    }
  }, [toast]);

  if (!user) {
    window.location.href = "/api/login";
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading complaint details...</div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-semibold text-lg">BadBlue</span>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Complaint Not Found</CardTitle>
              <CardDescription>The complaint you're looking for doesn't exist or you don't have access to it.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.href = "/complaints"} data-testid="button-back-complaints">
                View My Complaints
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const statusColor = complaint.paymentStatus === 'completed' ? 'default' : 
                      complaint.paymentStatus === 'pending' ? 'secondary' : 'outline';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-semibold text-lg">BadBlue</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              onClick={() => window.location.href = "/api/logout"}
              data-testid="button-logout"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/complaints"}
            data-testid="button-back"
          >
            ← Back to Complaints
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Complaint Details</CardTitle>
                <CardDescription>Filed on {complaint.createdAt ? new Date(complaint.createdAt).toLocaleDateString() : 'N/A'}</CardDescription>
              </div>
              <Badge variant={statusColor} data-testid="badge-status">
                {complaint.paymentStatus === 'completed' ? (
                  <><CheckCircle className="w-4 h-4 mr-1" /> Paid</>
                ) : (
                  <><Clock className="w-4 h-4 mr-1" /> {complaint.paymentStatus}</>
                )}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Form Preview Section */}
            <Collapsible open={isFormPreviewOpen} onOpenChange={setIsFormPreviewOpen}>
              <div className="bg-muted/30 rounded-lg border">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-4 h-auto"
                    data-testid="button-toggle-form-preview"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="font-semibold">View Complaint Form Preview</span>
                    </div>
                    {isFormPreviewOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="px-4 pb-4 space-y-4 border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                      This is a preview of your submitted complaint form. All information below was submitted with your complaint.
                    </p>
                    
                    {/* Form Fields Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Officer Name</Label>
                        <div className="p-2 bg-background rounded border" data-testid="preview-officer-name">
                          {complaint.officerName}
                        </div>
                      </div>
                      
                      {complaint.officerBadge && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Badge Number</Label>
                          <div className="p-2 bg-background rounded border" data-testid="preview-badge-number">
                            {complaint.officerBadge}
                          </div>
                        </div>
                      )}
                      
                      {complaint.officerDepartment && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Department</Label>
                          <div className="p-2 bg-background rounded border" data-testid="preview-department">
                            {complaint.officerDepartment}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">State</Label>
                        <div className="p-2 bg-background rounded border" data-testid="preview-state">
                          {complaint.state}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">City</Label>
                        <div className="p-2 bg-background rounded border" data-testid="preview-city">
                          {complaint.city}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Complaint Type</Label>
                        <div className="p-2 bg-background rounded border capitalize" data-testid="preview-complaint-type">
                          {complaint.complaintType.replace(/_/g, ' ')}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Incident Date</Label>
                        <div className="p-2 bg-background rounded border" data-testid="preview-incident-date">
                          {new Date(complaint.incidentDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <div className="p-3 bg-background rounded border whitespace-pre-wrap" data-testid="preview-description">
                        {complaint.description}
                      </div>
                    </div>
                    
                    {complaint.evidenceUrls && complaint.evidenceUrls.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Evidence Files</Label>
                        <div className="p-2 bg-background rounded border">
                          <ul className="space-y-1">
                            {complaint.evidenceUrls.map((url, idx) => (
                              <li key={idx} className="text-sm">
                                {url.split('/').pop()}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Officer Information */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Officer Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <p className="font-medium" data-testid="text-officer-name">{complaint.officerName}</p>
                </div>
                {complaint.officerBadge && (
                  <div>
                    <span className="text-muted-foreground">Badge Number:</span>
                    <p className="font-medium" data-testid="text-badge-number">{complaint.officerBadge}</p>
                  </div>
                )}
                {complaint.officerDepartment && (
                  <div>
                    <span className="text-muted-foreground">Department:</span>
                    <p className="font-medium" data-testid="text-department">{complaint.officerDepartment}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Incident Details */}
            <div>
              <h3 className="font-semibold mb-2">Incident Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium capitalize" data-testid="text-complaint-type">
                    {complaint.complaintType.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <p className="font-medium" data-testid="text-incident-date">
                    {new Date(complaint.incidentDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <p className="font-medium" data-testid="text-location">
                    {complaint.city}, {complaint.state}
                  </p>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Description:</span>
                <p className="mt-1 text-sm" data-testid="text-description">{complaint.description}</p>
              </div>
            </div>

            {/* Payment Information */}
            {complaint.paymentStatus === 'completed' && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Payment Complete
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your complaint has been paid for and will be automatically routed to the appropriate authorities based on your jurisdiction.
                </p>
                {complaint.paymentId && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Payment ID: {complaint.paymentId}
                  </p>
                )}
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Next Steps
              </h3>
              <ul className="text-sm space-y-2 list-disc list-inside">
                <li>Your complaint will be submitted to the appropriate authorities</li>
                <li>You will receive email updates on the status of your complaint</li>
                <li>Authorities typically respond within 30-60 days</li>
                <li>Keep this confirmation for your records</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
