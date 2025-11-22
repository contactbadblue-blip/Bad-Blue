import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, Shield, FileText, AlertCircle, DollarSign, Gavel, Clock, Users, BookOpen, ChevronRight, CheckCircle2 } from "lucide-react";
import { LAWSUIT_DIY_PRICING, LAWSUIT_FULL_SERVICE_PRICING } from "@shared/schema";
import { SEOHead } from "@/components/SEOHead";

export default function Section1983() {
  const [, navigate] = useLocation();

  const handleStartLawsuit = () => {
    navigate("/lawsuit-form");
  };

  return (
    <>
      <SEOHead 
        title="Section 1983 Civil Rights Lawsuits Against Police | Bad Blue"
        description="File a Section 1983 civil rights lawsuit against police officers for constitutional violations. Get legal assistance with police misconduct, excessive force, false arrest, and wrongful detention cases."
        keywords="section 1983, civil rights lawsuit, police misconduct, constitutional violations, excessive force, false arrest, police accountability, 42 USC 1983"
      />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Main Heading with SEO-optimized H1 */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4" data-testid="text-1983-heading">
            Section 1983 Civil Rights Lawsuits Against Police
          </h1>
          <p className="text-xl text-muted-foreground">
            Hold law enforcement accountable for constitutional violations through federal civil rights litigation
          </p>
        </div>

        {/* Comprehensive SEO Content Section */}
        <div className="prose max-w-none mb-12 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold mb-4">Understanding Section 1983 Civil Rights Claims</h2>
            <p className="mb-4">
              Section 1983, codified as 42 U.S.C. § 1983, is a powerful federal statute that allows individuals to sue government officials, including police officers, for violations of constitutional rights. This law, enacted during the Reconstruction Era as part of the Civil Rights Act of 1871, remains one of the most important tools for holding law enforcement accountable for misconduct and protecting citizens' civil liberties.
            </p>
            <p className="mb-4">
              When police officers exceed their authority, use excessive force, conduct unlawful arrests, or violate your constitutional rights in other ways, Section 1983 provides a legal pathway to seek both monetary compensation and injunctive relief. These lawsuits serve not only to compensate victims but also to deter future misconduct and establish important legal precedents that protect everyone's rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Common Types of Police Misconduct Claims Under Section 1983</h2>
            <p className="mb-4">
              Police misconduct can take many forms, and Section 1983 covers a wide range of constitutional violations. The most common claims include:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li><strong>Excessive Force (Fourth Amendment):</strong> When officers use more force than reasonably necessary during arrests, investigatory stops, or other seizures. This includes beatings, unnecessary use of tasers or pepper spray, shootings, and chokeholds that violate department policy or constitutional standards.</li>
              <li><strong>False Arrest and False Imprisonment (Fourth Amendment):</strong> Arresting or detaining someone without probable cause or valid legal justification. This includes arrests based on fabricated evidence or made in retaliation for exercising constitutional rights.</li>
              <li><strong>Malicious Prosecution (Fourth Amendment):</strong> Pursuing criminal charges without probable cause and with malicious intent, causing damages to the defendant through the legal process itself.</li>
              <li><strong>Failure to Intervene:</strong> When officers witness fellow officers violating someone's rights but fail to take reasonable steps to prevent or stop the violation.</li>
              <li><strong>Denial of Medical Care (Eighth/Fourteenth Amendment):</strong> Deliberately ignoring serious medical needs of arrestees or pretrial detainees in custody.</li>
              <li><strong>First Amendment Violations:</strong> Retaliating against individuals for exercising free speech, filming police activities, or participating in peaceful protests.</li>
              <li><strong>Equal Protection Violations:</strong> Discriminatory policing based on race, ethnicity, religion, or other protected characteristics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">The Manual Process of Filing a Section 1983 Lawsuit</h2>
            <p className="mb-4">
              Traditionally, pursuing a Section 1983 claim involves numerous complex steps that can be overwhelming for victims of police misconduct:
            </p>
            <ol className="list-decimal pl-6 mb-4 space-y-3">
              <li><strong>Finding and Retaining an Attorney:</strong> Civil rights attorneys often require substantial retainers or work on contingency only for cases with clear liability and significant damages. Many victims struggle to find representation, especially for smaller claims.</li>
              <li><strong>Extensive Investigation:</strong> Gathering police reports, body camera footage, witness statements, medical records, and other evidence. This often requires filing FOIA requests and waiting months for responses.</li>
              <li><strong>Drafting the Complaint:</strong> Creating a detailed federal complaint that properly alleges constitutional violations, identifies all defendants, and meets strict pleading standards under federal rules.</li>
              <li><strong>Navigating Qualified Immunity:</strong> Overcoming the qualified immunity doctrine, which protects officers unless they violated "clearly established" constitutional rights that a reasonable officer would have known.</li>
              <li><strong>Managing Complex Litigation:</strong> Federal litigation involves extensive discovery, depositions, motion practice, and potentially years of court proceedings before reaching trial or settlement.</li>
              <li><strong>Meeting Strict Deadlines:</strong> Section 1983 claims must be filed within the statute of limitations, which varies by state but is typically 1-3 years from the incident.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Legal Considerations and Challenges</h2>
            <p className="mb-4">
              Filing a Section 1983 lawsuit involves several important legal considerations that plaintiffs must understand:
            </p>
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Qualified Immunity</h3>
              <p className="mb-3">
                The qualified immunity doctrine is perhaps the biggest hurdle in Section 1983 cases. Courts grant officers immunity unless they violated a constitutional right that was "clearly established" at the time of the incident. This means finding prior cases with nearly identical facts where courts ruled the conduct unconstitutional. This doctrine has been criticized for creating an almost insurmountable barrier to accountability.
              </p>
            </div>
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Municipal Liability (Monell Claims)</h3>
              <p className="mb-3">
                To hold cities or police departments liable, plaintiffs must prove the violation resulted from an official policy, custom, or practice, or from deliberate indifference in training or supervision. This "Monell" standard, named after the Supreme Court case, requires showing a pattern of misconduct or systemic failures, not just individual officer wrongdoing.
              </p>
            </div>
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Damages and Relief</h3>
              <p className="mb-3">
                Successful Section 1983 plaintiffs can recover compensatory damages for physical injuries, emotional distress, lost wages, and other harms. Punitive damages may be available for particularly egregious conduct. Attorneys' fees are also recoverable under 42 U.S.C. § 1988, making it possible for lawyers to take cases on contingency.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">How Bad Blue Simplifies Section 1983 Lawsuits</h2>
            <p className="mb-4">
              Bad Blue transforms the complex process of filing Section 1983 lawsuits into a streamlined, accessible system that empowers citizens to seek justice without the traditional barriers:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">Automated Document Generation</h3>
                <p className="mb-3">
                  Our AI-powered system generates professionally drafted federal complaints that meet all technical requirements. By answering guided questions about your incident, Bad Blue creates comprehensive legal documents that properly allege constitutional violations, identify appropriate defendants, and include all necessary legal elements.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Evidence Organization and Analysis</h3>
                <p className="mb-3">
                  Upload your evidence—videos, photos, medical records, witness information—and our system helps organize and analyze it to build the strongest possible case. We identify key facts that support constitutional claims and help overcome qualified immunity defenses.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Legal Research Integration</h3>
                <p className="mb-3">
                  Bad Blue's AI searches relevant case law in your jurisdiction to find precedents supporting your claims. This helps establish that officers violated "clearly established" rights, a crucial element in defeating qualified immunity.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Affordable Access Options</h3>
                <p className="mb-3">
                  Choose between our DIY option for self-represented litigants or our full-service option with attorney review. Both are priced to be accessible, removing the financial barriers that prevent many victims from seeking justice.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Integrated FOIA Support</h3>
                <p className="mb-3">
                  Need body camera footage or police records? Bad Blue can generate and track FOIA requests to gather crucial evidence for your case, all within the same platform.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Building Your Section 1983 Case</h2>
            <p className="mb-4">
              Success in Section 1983 litigation requires thorough preparation and strong evidence. Here's what you should gather:
            </p>
            <ul className="list-disc pl-6 mb-4 space-y-2">
              <li>All documentation of the incident (police reports, arrest records, citations)</li>
              <li>Medical records showing injuries and treatment</li>
              <li>Photographs of injuries, property damage, or the scene</li>
              <li>Video evidence from phones, security cameras, or body cameras</li>
              <li>Contact information for all witnesses</li>
              <li>Documentation of lost wages or other economic damages</li>
              <li>Records of emotional distress treatment or therapy</li>
              <li>Any prior complaints or lawsuits against the involved officers</li>
            </ul>
            <p className="mb-4">
              Bad Blue's platform guides you through collecting and organizing this evidence, ensuring nothing important is overlooked. Our system also helps identify additional evidence you may need and generates FOIA requests to obtain it.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">Timeline and Process</h2>
            <p className="mb-4">
              Understanding the timeline of a Section 1983 lawsuit helps set realistic expectations:
            </p>
            <ol className="list-decimal pl-6 mb-4 space-y-2">
              <li><strong>Immediate (0-30 days):</strong> Document injuries, preserve evidence, seek medical treatment, file complaints with internal affairs</li>
              <li><strong>Investigation Phase (1-6 months):</strong> Gather evidence, interview witnesses, obtain records through FOIA requests</li>
              <li><strong>Filing (before statute of limitations):</strong> File complaint in federal court, serve defendants</li>
              <li><strong>Discovery Phase (6-18 months):</strong> Exchange evidence, take depositions, file motions</li>
              <li><strong>Resolution (1-3 years):</strong> Settlement negotiations, mediation, or trial</li>
            </ol>
            <p className="mb-4">
              Bad Blue helps accelerate this timeline by automating document preparation, evidence organization, and legal research that typically takes attorneys months to complete.
            </p>
          </section>
        </div>

        {/* Call to Action Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                DIY Section 1983 Filing
              </CardTitle>
              <CardDescription>
                Self-file with AI-generated documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-1 text-primary" />
                  <span>Complete federal complaint drafting</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-1 text-primary" />
                  <span>Evidence organization tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-1 text-primary" />
                  <span>Legal research assistance</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-1 text-primary" />
                  <span>Filing instructions and guidance</span>
                </li>
              </ul>
              <div className="text-2xl font-bold mb-2">{LAWSUIT_DIY_PRICING}</div>
              <Button 
                className="w-full" 
                onClick={handleStartLawsuit}
                data-testid="button-start-diy-1983"
              >
                Start DIY Filing
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Full-Service Legal Support
              </CardTitle>
              <CardDescription>
                Attorney review and representation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-1 text-primary" />
                  <span>Licensed attorney review</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-1 text-primary" />
                  <span>Professional filing and service</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-1 text-primary" />
                  <span>Court representation</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-1 text-primary" />
                  <span>Settlement negotiation</span>
                </li>
              </ul>
              <div className="text-2xl font-bold mb-2">{LAWSUIT_FULL_SERVICE_PRICING}</div>
              <Button 
                variant="default" 
                className="w-full"
                onClick={handleStartLawsuit}
                data-testid="button-start-fullservice-1983"
              >
                Get Legal Representation
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Information Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Statute of Limitations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Section 1983 claims must be filed within your state's personal injury statute of limitations, typically 1-3 years. Don't wait—evidence disappears and memories fade.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Qualified Immunity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Officers have qualified immunity unless they violated clearly established rights. Our AI helps identify precedents to overcome this defense.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Potential Recovery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Recover compensatory damages, punitive damages, and attorneys' fees. Settlements range from thousands to millions depending on the violations.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-lg mb-4">
            Don't let police misconduct go unchallenged. Take the first step toward justice today.
          </p>
          <Button 
            size="lg" 
            onClick={handleStartLawsuit}
            data-testid="button-start-1983-bottom"
          >
            Start Your Section 1983 Lawsuit
            <Scale className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </>
  );
}