import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  FileText,
  DollarSign,
  ExternalLink,
  Download,
  Mail,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import type { Complaint, LawsuitFiling } from "@shared/schema";
import { SocialShare } from "@/components/SocialShare";

interface FilingInfo {
  filingFee: number;
  eFilingPortalUrl: string;
  eFilingPortalName: string;
  filingInstructions: string;
}

export default function Confirmation() {
  const [, params] = useRoute("/confirmation/:type/:id");
  const [, navigate] = useLocation();

  const type = params?.type as "complaint" | "lawsuit" | "petition";
  const id = params?.id;

  if (!type || !id || (type !== "complaint" && type !== "lawsuit" && type !== "petition")) {
    navigate("/");
    return null;
  }

  // Fetch the submission data
  const { data: submission, isLoading } = useQuery<Complaint | LawsuitFiling>({
    queryKey: [type === "complaint" ? "/api/complaints" : "/api/lawsuits", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading confirmation...</p>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Alert>
          <AlertDescription>
            Submission not found. Please contact support if you believe this is an error.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const isComplaint = type === "complaint";
  const lawsuit = !isComplaint ? (submission as LawsuitFiling) : null;
  const complaint = isComplaint ? (submission as Complaint) : null;

  const filingFee = lawsuit?.filingFee || 0;
  const eFilingPortalUrl = lawsuit?.eFilingPortalUrl || "";
  const eFilingPortalName = lawsuit?.eFilingPortalName || "State E-Filing Portal";
  const filingInstructions = lawsuit?.filingInstructions || "";
  const clerkOfCourtAddress = lawsuit?.clerkOfCourtAddress || "";
  const tortNoticeRequired = lawsuit?.tortNoticeRequired || false;
  const tortNoticeSent = lawsuit?.tortNoticeSent || false;
  const tortNoticeAgency = lawsuit?.tortNoticeAgency || "";
  const relevantPrecedents = lawsuit?.relevantPrecedents || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/">
        <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-home">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </Link>

      {/* Success Header */}
      <Card className="mb-6 border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            <div>
              <CardTitle className="text-2xl text-green-900 dark:text-green-100">
                Payment Successful!
              </CardTitle>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Your {isComplaint ? "complaint" : "lawsuit"} has been processed
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Officer</p>
              <p className="font-medium" data-testid="text-officer-name">{submission.officerName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-medium">{submission.city}, {submission.state}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Amount Paid</p>
              <p className="font-medium" data-testid="text-amount-paid">
                ${((submission.amountPaid || 0) / 100).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge data-testid="badge-status">Paid</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaint Auto-Submission Info */}
      {isComplaint && complaint && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Complaint Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                Your complaint has been automatically submitted to the appropriate authorities via email.
              </AlertDescription>
            </Alert>

            {complaint.submissionVenue && (
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Submitted To</p>
                  <p className="font-medium" data-testid="text-submission-venue">{complaint.submissionVenue}</p>
                </div>
                {complaint.submissionEmail && (
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Email</p>
                    <p className="font-medium" data-testid="text-submission-email">{complaint.submissionEmail}</p>
                  </div>
                )}
                {complaint.submissionAddress && (
                  <div>
                    <p className="text-sm text-muted-foreground">Physical Address</p>
                    <p className="font-medium text-sm">{complaint.submissionAddress}</p>
                  </div>
                )}
              </div>
            )}

            <p className="text-sm text-muted-foreground mt-4">
              You will also receive a copy of your complaint via email for your records.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lawsuit Filing Instructions */}
      {!isComplaint && lawsuit && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Filing Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertDescription>
                  You are responsible for filing your lawsuit with the appropriate court.
                  Follow the instructions below to complete the filing process.
                </AlertDescription>
              </Alert>

              {filingInstructions && (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm">{filingInstructions}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filing Fee Information */}
          {filingFee > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {submission.state} Court Filing Fee
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-primary" data-testid="text-filing-fee">
                    ${(filingFee / 100).toFixed(2)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    This fee must be paid directly to the court when you file your lawsuit.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Note: Filing fees are subject to change. Please verify the current fee with your local court.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* E-Filing Portal Link */}
          {eFilingPortalUrl && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  E-Filing Portal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Use the official {submission.state} e-filing portal to submit your lawsuit electronically:
                </p>
                <a
                  href={eFilingPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-efiling-portal"
                >
                  <Button className="w-full" size="lg">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open {eFilingPortalName}
                  </Button>
                </a>
                <p className="text-xs text-muted-foreground mt-3">
                  This link will open in a new window and take you to the official state court e-filing system.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Clerk of Court Address (when e-filing not available) */}
          {!eFilingPortalUrl && clerkOfCourtAddress && (
            <Card className="mb-6 border-amber-200 dark:border-amber-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                  <FileText className="h-5 w-5" />
                  Clerk of Court - Physical Filing
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                  <AlertDescription className="text-amber-900 dark:text-amber-100">
                    E-filing is not available for {submission.state}. You must file your lawsuit in person or by mail at the clerk of court.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Clerk of Court Address:</p>
                  <div className="bg-muted p-3 rounded-md">
                    <p className="text-sm whitespace-pre-line" data-testid="text-clerk-address">
                      {clerkOfCourtAddress}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    You will need to print your lawsuit documents and deliver them to this address along with the filing fee.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tort Notice Status */}
          {tortNoticeRequired && (
            <Card className="mb-6 border-blue-200 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                  <Mail className="h-5 w-5" />
                  Tort Claim Notice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                  <AlertDescription className="text-blue-900 dark:text-blue-100">
                    {submission.state} requires a tort claim notice to be filed before pursuing a lawsuit against government entities.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  {tortNoticeSent ? (
                    <>
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        ✓ Tort claim notice has been automatically sent to: {tortNoticeAgency}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        You will also receive a copy of the tort claim notice via email for your records.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium">
                        Tort claim notice is required for: {tortNoticeAgency}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Please check your email for the tort claim notice document and filing instructions. You may need to file this separately before proceeding with your lawsuit.
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Relevant Legal Precedents */}
          {relevantPrecedents.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Relevant Legal Precedents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Our AI has identified these relevant case law precedents that may support your claim:
                </p>
                <div className="space-y-3">
                  {relevantPrecedents.map((precedent, index) => (
                    <div key={index} className="bg-muted p-3 rounded-md">
                      <p className="text-xs font-mono text-sm" data-testid={`text-precedent-${index}`}>
                        {precedent}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  These precedents are provided for informational purposes. Consult with an attorney to determine their applicability to your specific case.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Document Download (placeholder - will be implemented with PDF) */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Your Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Your lawsuit documents and pre-filled cover sheet will be sent to your email shortly.
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" disabled data-testid="button-download-lawsuit">
                  <Download className="h-4 w-4 mr-2" />
                  Download Lawsuit Document (PDF)
                </Button>
                <Button variant="outline" className="w-full" disabled data-testid="button-download-coversheet">
                  <Download className="h-4 w-4 mr-2" />
                  Download Cover Sheet (PDF)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Documents will be available for download after processing (typically within a few minutes).
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>What Happens Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-3 text-sm">
            {isComplaint ? (
              <>
                <li>You will receive a confirmation email with a copy of your complaint</li>
                <li>The authorities will review your complaint according to their internal procedures</li>
                <li>You may be contacted for additional information or follow-up</li>
                <li>Keep all documentation and correspondence for your records</li>
              </>
            ) : (
              <>
                <li>Check your email for the lawsuit documents and cover sheet (PDF format)</li>
                <li>Review all documents carefully before filing</li>
                <li>Access the e-filing portal using the link above</li>
                <li>Upload your documents and pay the filing fee to the court</li>
                <li>Keep all confirmation receipts and case numbers</li>
                <li>Consider consulting with a local attorney for guidance</li>
              </>
            )}
          </ol>
        </CardContent>
      </Card>

      <div className="text-center mt-6">
        <div className="flex gap-2">
          <Button
            onClick={() => window.location.href = '/'}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return Home
          </Button>
          <SocialShare
            title={`${type === 'complaint' ? 'Filed Police Complaint' : 'Filed Civil Rights Lawsuit'} via BadBlue`}
            description={`I just filed a ${type === 'complaint' ? 'formal complaint' : 'civil rights lawsuit'} against ${submission.officerName || 'a police officer'} using BadBlue - making police accountability accessible to everyone.`}
            hashtags={['PoliceAccountability', 'CivilRights', 'Justice', 'BadBlue']}
          />
        </div>
      </div>
    </div>
  );
}