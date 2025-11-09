import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Shield, CheckCircle, Clock, FileText, Scale, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { LawsuitFiling } from "@shared/schema";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function LawsuitDetail() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/lawsuit/:id");
  const lawsuitId = params?.id;
  const [isFormPreviewOpen, setIsFormPreviewOpen] = useState(false);

  const { data: lawsuit, isLoading } = useQuery<LawsuitFiling>({
    queryKey: ['/api/lawsuits', lawsuitId],
    enabled: !!lawsuitId,
  });

  // Show success message if coming from payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      toast({
        title: "Payment Successful",
        description: "Your lawsuit has been generated with state-specific legal templates.",
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
        <div className="text-lg">Loading lawsuit details...</div>
      </div>
    );
  }

  if (!lawsuit) {
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
              <CardTitle>Lawsuit Not Found</CardTitle>
              <CardDescription>The lawsuit you're looking for doesn't exist or you don't have access to it.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => window.location.href = "/history"} data-testid="button-back-history">
                View My History
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const statusColor = lawsuit.paymentStatus === 'completed' ? 'default' : 
                      lawsuit.paymentStatus === 'pending' ? 'secondary' : 'outline';

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
            onClick={() => window.location.href = "/history"}
            data-testid="button-back"
          >
            ← Back to History
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Scale className="w-6 h-6" />
                  Lawsuit Details
                </CardTitle>
                <CardDescription>Filed on {lawsuit.createdAt ? new Date(lawsuit.createdAt).toLocaleDateString() : 'N/A'}</CardDescription>
              </div>
              <Badge variant={statusColor} data-testid="badge-status">
                {lawsuit.paymentStatus === 'completed' ? (
                  <><CheckCircle className="w-4 h-4 mr-1" /> Paid</>
                ) : (
                  <><Clock className="w-4 h-4 mr-1" /> {lawsuit.paymentStatus}</>
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
                      <span className="font-semibold">View Lawsuit Form Preview</span>
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
                      This is a preview of your submitted lawsuit form. All information below was submitted with your lawsuit.
                    </p>
                    
                    {/* Form Fields Preview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Officer Name</Label>
                        <div className="p-2 bg-background rounded border" data-testid="preview-officer-name">
                          {lawsuit.officerName}
                        </div>
                      </div>
                      
                      {lawsuit.officerBadge && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Badge Number</Label>
                          <div className="p-2 bg-background rounded border" data-testid="preview-badge-number">
                            {lawsuit.officerBadge}
                          </div>
                        </div>
                      )}
                      
                      {lawsuit.officerDepartment && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Department</Label>
                          <div className="p-2 bg-background rounded border" data-testid="preview-department">
                            {lawsuit.officerDepartment}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">State</Label>
                        <div className="p-2 bg-background rounded border" data-testid="preview-state">
                          {lawsuit.state}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">City</Label>
                        <div className="p-2 bg-background rounded border" data-testid="preview-city">
                          {lawsuit.city}
                        </div>
                      </div>
                      
                      {lawsuit.county && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">County</Label>
                          <div className="p-2 bg-background rounded border" data-testid="preview-county">
                            {lawsuit.county}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Lawsuit Type</Label>
                        <div className="p-2 bg-background rounded border capitalize" data-testid="preview-lawsuit-type">
                          {lawsuit.lawsuitType.replace(/_/g, ' ')}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Incident Date</Label>
                        <div className="p-2 bg-background rounded border" data-testid="preview-incident-date">
                          {new Date(lawsuit.incidentDate).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {lawsuit.damagesRequested && (
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Damages Requested</Label>
                          <div className="p-2 bg-background rounded border" data-testid="preview-damages">
                            ${(lawsuit.damagesRequested / 100).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Description</Label>
                      <div className="p-3 bg-background rounded border whitespace-pre-wrap" data-testid="preview-description">
                        {lawsuit.description}
                      </div>
                    </div>
                    
                    {lawsuit.evidenceUrls && lawsuit.evidenceUrls.length > 0 && (
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Evidence Files</Label>
                        <div className="p-2 bg-background rounded border">
                          <ul className="space-y-1">
                            {lawsuit.evidenceUrls.map((url, idx) => (
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
                Defendant Information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Name:</span>
                  <p className="font-medium" data-testid="text-officer-name">{lawsuit.officerName}</p>
                </div>
                {lawsuit.officerBadge && (
                  <div>
                    <span className="text-muted-foreground">Badge Number:</span>
                    <p className="font-medium" data-testid="text-badge-number">{lawsuit.officerBadge}</p>
                  </div>
                )}
                {lawsuit.officerDepartment && (
                  <div>
                    <span className="text-muted-foreground">Department:</span>
                    <p className="font-medium" data-testid="text-department">{lawsuit.officerDepartment}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Lawsuit Details */}
            <div>
              <h3 className="font-semibold mb-2">Case Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium capitalize" data-testid="text-lawsuit-type">
                    {lawsuit.lawsuitType.replace(/_/g, ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Incident Date:</span>
                  <p className="font-medium" data-testid="text-incident-date">
                    {new Date(lawsuit.incidentDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Jurisdiction:</span>
                  <p className="font-medium" data-testid="text-location">
                    {lawsuit.city}, {lawsuit.county && `${lawsuit.county} County, `}{lawsuit.state}
                  </p>
                </div>
                {lawsuit.damagesRequested && (
                  <div>
                    <span className="text-muted-foreground">Damages Sought:</span>
                    <p className="font-medium" data-testid="text-damages">
                      ${(lawsuit.damagesRequested / 100).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <span className="text-muted-foreground">Description:</span>
                <p className="mt-1 text-sm" data-testid="text-description">{lawsuit.description}</p>
              </div>
            </div>

            {/* Payment Information */}
            {lawsuit.paymentStatus === 'completed' && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Payment Complete - Document Generated
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your lawsuit has been generated with state-specific statutes and legal codes. The document will be submitted to the appropriate court based on your jurisdiction.
                </p>
                {lawsuit.paymentId && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Payment ID: {lawsuit.paymentId}
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
                <li>Your lawsuit will be filed with the appropriate court</li>
                <li>The document includes state-specific statutes and legal codes</li>
                <li>You will receive email updates on the filing status</li>
                <li>Consider consulting with an attorney to review the filing</li>
                <li>Keep this confirmation for your records</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
