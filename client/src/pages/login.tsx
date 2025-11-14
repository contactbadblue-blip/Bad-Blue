import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, FileText, Scale, Upload, Bell, ArrowLeft } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { SEOHead } from "@/components/SEOHead";
import { SupportEmailFooter } from "@/components/SupportEmailFooter";
import SampleLegalConsultation from "@/components/SampleLegalConsultation";
import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { FULL_ACCESS_PRICING, LAWSUIT_DIY_PRICING, LAWSUIT_FULL_SERVICE_PRICING, COMPLAINT_PRICING, PETITION_PRICING, FOIA_REQUEST_PRICING } from "@shared/schema";

export default function Login() {
  const [login, setLogin] = useState(""); // Changed from username to login
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Local login mutation (works for both regular users and admin)
  const loginMutation = useMutation({
    mutationFn: async (data: { username: string; password?: string }) => {
      const res = await apiRequest("/api/login/local", "POST", data);
      return await res.json();
    },
    onSuccess: (data: any) => {
      // Don't show different messages for admin - keep it inconspicuous
      toast({
        title: "Welcome Back",
        description: "Sign in successful",
      });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Sign In Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  // Local registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: { username: string; password: string; email: string }) => {
      const res = await apiRequest("/api/register/local", "POST", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Created",
        description: "Please sign in with your new credentials",
      });
      setPassword("");
      setEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Sign Up Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter login and password",
        variant: "destructive",
      });
      return;
    }
    // Admin login is inconspicuous - works seamlessly through same form
    loginMutation.mutate({ username: login, password });
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login || !password || !email) {
      toast({
        title: "Missing Information",
        description: "Please enter login, email, and password",
        variant: "destructive",
      });
      return;
    }
    if (!email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate({ username: login, password, email });
  };

  // Unmute video on first user interaction (click, keypress, or scroll)
  useEffect(() => {
    const unmuteVideo = () => {
      if (videoRef.current && videoRef.current.muted) {
        videoRef.current.muted = false;
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
          // Silently handle play rejection
        });
        // Remove all listeners after first interaction
        document.removeEventListener('pointerdown', unmuteVideo);
        document.removeEventListener('keydown', unmuteVideo);
        document.removeEventListener('wheel', unmuteVideo);
        document.removeEventListener('scroll', unmuteVideo, true);
      }
    };

    document.addEventListener('pointerdown', unmuteVideo, { once: false });
    document.addEventListener('keydown', unmuteVideo, { once: false });
    document.addEventListener('wheel', unmuteVideo, { once: false, passive: true });
    document.addEventListener('scroll', unmuteVideo, { once: false, passive: true, capture: true });

    return () => {
      document.removeEventListener('pointerdown', unmuteVideo);
      document.removeEventListener('keydown', unmuteVideo);
      document.removeEventListener('wheel', unmuteVideo);
      document.removeEventListener('scroll', unmuteVideo, true);
    };
  }, []);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "BadBlue",
    "description": "Police accountability platform for filing complaints and civil rights lawsuits online",
    "url": "https://badblue.com",
    "applicationCategory": "LegalService",
    "offers": {
      "@type": "Offer",
      "price": "9.75",
      "priceCurrency": "USD"
    },
    "featureList": [
      "AI-powered officer badge identification",
      "Automated complaint routing to proper authorities",
      "Civil rights lawsuit document generation",
      "State-specific legal templates",
      "Secure evidence upload",
      "Legal actionability analysis"
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Login | BadBlue - Professional Police Accountability Platform | File Police Complaint Online"
        description="Access BadBlue's legal empowerment platform to file police complaints online, sue officers for misconduct, bad cops & civil rights violations. Professional justice accessibility."
        keywords="file police complaint online, file officer complaint online, police misconduct complaint, officer misconduct grievance, civil rights lawsuit police, civil rights lawsuit officer, police brutality complaint, officer brutality lawsuit, police assault complaint, officer assault lawsuit, excessive force police complaint, excessive force officer lawsuit, file complaint against police, file lawsuit against officer, police accountability documents, officer accountability FOIA, report police misconduct, report officer assault, police brutality legal help, officer brutality legal advice, search police officer, find officer information, locate police department, FOIA request police, FOIA request officer, police complaint form online, officer grievance form online, lawsuit police department, complaint officer department, legal advice police case, legal help officer lawsuit, police information search, officer background search, police documents request, officer records FOIA, petition police officer, petition officer resignation, police harassment complaint, officer harassment grievance, false arrest police lawsuit, wrongful arrest officer complaint, police discrimination complaint, officer discrimination lawsuit, police violence complaint, officer violence lawsuit, department misconduct grievance, department brutality complaint, how to file police complaint, how to sue police officer, how to file officer lawsuit, how to get police documents, how to search officer information, how to file FOIA police records, help filing police complaint, help suing officer, assistance with police lawsuit, guidance police grievance, support officer complaint filing, resources police legal case, police brutality attorney alternative, officer assault lawyer alternative, police lawsuit online filing, officer complaint online submission, department grievance online process, civil rights police violation, constitutional rights officer violation, police excessive force documentation, officer assault evidence collection, police complaint process help, officer lawsuit filing assistance, department accountability legal help, police misconduct legal advice, officer conduct complaint filing, police rights violation lawsuit, officer abuse complaint online, police corruption grievance, department cover-up complaint, police retaliation lawsuit, officer negligence complaint, police civil rights lawsuit 42 USC 1983, officer section 1983 lawsuit, police qualified immunity lawsuit, officer constitutional violation complaint, find police officer by badge, search officer by name, locate police department address, get officer information online, police brutality help online, officer assault legal resources, file police grievance online, submit officer complaint online, police legal assistance online, officer lawsuit guidance online"
        ogTitle="BadBlue - Police Accountability Platform | File Complaints & Lawsuits"
        ogDescription="Step-by-step platform to file police misconduct complaints and civil rights lawsuits. AI-powered badge identification, legal analysis, and automated routing to proper authorities."
        canonicalUrl="https://badblue.com/login"
        structuredData={structuredData}
      />
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => window.location.href = "/landing"}
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <span className="font-bold text-xl">BadBlue</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Video Section */}
        <div className="max-w-2xl mx-auto mb-16">
          <div className="relative w-full rounded-lg overflow-hidden shadow-lg" style={{ aspectRatio: '720/980' }}>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              muted
              playsInline
              preload="auto"
              disablePictureInPicture
              controlsList="nodownload nofullscreen noremoteplayback"
              style={{ 
                pointerEvents: 'none', 
                display: 'block'
              }}
            >
              <source src="/video/badblue-demo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            
            {/* White overlay to cover URL at top */}
            <div 
              className="absolute left-0 right-0 bg-background"
              style={{ 
                top: 0,
                height: '5%',
                pointerEvents: 'none'
              }}
            />
            
            {/* White overlay to cover URL at bottom */}
            <div 
              className="absolute left-0 right-0 bg-background"
              style={{ 
                bottom: 0,
                height: '20%',
                pointerEvents: 'none'
              }}
            />
          </div>
          
          {/* Website URL */}
          <div className="text-center mt-6 mb-16">
            <p className="text-2xl font-semibold text-primary">https://Bad-Blue.com</p>
          </div>
        </div>

        {/* How It Works */}
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How BadBlue Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              BadBlue empowers citizens to hold law enforcement accountable through AI-powered complaint filing and lawsuit drafting. Here's how our platform makes justice accessible.
            </p>
          </div>

          <div className="space-y-8">
            {/* Step 1: Sign In */}
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-2">Sign In & Get Access</h3>
                    <p className="text-muted-foreground mb-4">Get access to legal consultation and officer search</p>
                    <p className="text-muted-foreground mb-3">
                      Create an account or sign in using your email. After signing in, get access to unlock LegalAI Consultation and comprehensive officer search.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Choose Your Service */}
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-4">Choose Your Service</h3>
                    
                    {/* Tier 1: Platform Access */}
                    <div className="border-2 border-primary/40 rounded-lg p-4 mb-4 bg-primary/5">
                      <p className="text-sm text-muted-foreground mb-3">Access to comprehensive legal consultation and in-depth officer search</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">Legal Consultation</Badge>
                        <Badge variant="secondary">Officer Search</Badge>
                      </div>
                    </div>

                    {/* Tier 2: Additional Services */}
                    <div className="border rounded-lg p-4 mb-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">FOIA Request</Badge>
                        <Badge variant="outline" className="text-xs">Officer Complaint</Badge>
                        <Badge variant="outline" className="text-xs">Officer Resignation Petition</Badge>
                      </div>
                    </div>

                    {/* Tier 3: Civil Lawsuits */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Civil Lawsuits</h4>
                      <p className="text-xs text-muted-foreground mb-3">Civilsuits tailored per your state's requirements, with relevant statutes, legal codes, and precedence. Choose between two options: The first is 'You file' the civilsuit, to save money, complete with filing instructions. The second is 'BadBlue files' the civilsuit, and the filing process is done for you, complete with coversheet.</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">You File Civilsuit</Badge>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs">BadBlue Files Civilsuit</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          (Includes filing fees)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 3: LegalAI Consultation */}
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-2">Get LegalAI Consultation</h3>
                    <p className="text-muted-foreground mb-4">Comprehensive legal research & analysis included</p>
                    <p className="text-muted-foreground mb-3">
                      Start by describing your incident to our LegalAI Consultation system. It researches federal and state statutes, relevant case law, analyzes your case for legal actionability, provides plausibility scoring, and recommends whether to file a complaint, lawsuit, or officer resignation petition.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>AI-Powered Analysis:</strong> Our advanced AI identifies applicable laws, statutes, and legal precedents relevant to your specific situation.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 4: Upload Evidence & AI Analysis */}
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl flex-shrink-0">
                    4
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-2">Upload Supporting Evidence & AI-Powered Badge Analysis</h3>
                    <p className="text-muted-foreground mb-4">Strengthen your case with photos, videos, and documents</p>
                    <p className="text-muted-foreground mb-3">
                      Upload up to 10 files including photos of injuries, body cam footage, medical records, witness statements, or badge photos. Our AI can analyze badge images to extract badge number, department name, officer rank, and identification details—even from blurry or partial photos. All evidence is stored securely with private access controls.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-sm text-blue-900 dark:text-blue-100">
                        <strong>Security:</strong> All evidence files are encrypted and only accessible by you.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 5: Review & Pay */}
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl flex-shrink-0">
                    5
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-2">Review & Pay Securely</h3>
                    <p className="text-muted-foreground mb-4">Preview everything before submission</p>
                    <p className="text-muted-foreground mb-3">
                      Review all details, officer information, incident description, and evidence files before proceeding. Then complete your secure payment via Stripe.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Step 6: Processing & Email */}
            <Card className="border-primary/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xl flex-shrink-0">
                    6
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-semibold mb-2">Automatic Processing & Email Confirmation</h3>
                    <p className="text-muted-foreground mb-4">We handle the routing and send you a complete copy</p>
                    <p className="text-muted-foreground mb-3">
                      Immediately after payment, you'll receive a comprehensive email containing a complete copy of your complaint or lawsuit document, submission details, and next steps for filing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Login Card - Moved to bottom */}
        <Card className="max-w-md mx-auto mb-16">
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2">Sign In</h1>
              <p className="text-muted-foreground">
                Get started with BadBlue
              </p>
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin" data-testid="tab-signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Sign In Form */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-login">Login</Label>
                    <Input
                      id="signin-login"
                      data-testid="input-signin-login"
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      placeholder="Enter your login"
                      disabled={loginMutation.isPending}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      data-testid="input-signin-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      disabled={loginMutation.isPending}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    data-testid="button-signin"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Form */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-login">Login</Label>
                    <Input
                      id="signup-login"
                      data-testid="input-signup-login"
                      value={login}
                      onChange={(e) => setLogin(e.target.value)}
                      placeholder="Choose your login"
                      disabled={registerMutation.isPending}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      data-testid="input-signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      disabled={registerMutation.isPending}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Required for confirmation emails and account recovery
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      data-testid="input-signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Choose a password (min 8 characters)"
                      disabled={registerMutation.isPending}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    data-testid="button-signup"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? "Creating Account..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Sample Legal Consultation - Below sign-in form */}
        <div className="mt-8">
          <SampleLegalConsultation />
        </div>
      </div>
      
      <SupportEmailFooter />
    </div>
  );
}
