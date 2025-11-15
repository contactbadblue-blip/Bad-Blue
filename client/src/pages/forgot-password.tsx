import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { SEOHead } from "@/components/SEOHead";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const requestResetMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const res = await apiRequest("/api/auth/request-password-reset", "POST", data);
      return await res.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    requestResetMutation.mutate({ email: email.toLowerCase().trim() });
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <SEOHead 
          title="Password Reset Sent - BadBlue"
          description="Check your email for password reset instructions"
        />
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              If an account exists with that email, we've sent password reset instructions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Please check your email inbox for a message from contact.badblue@gmail.com.
                The reset link will expire in 1 hour for security reasons.
              </AlertDescription>
            </Alert>
            
            <p className="text-sm text-muted-foreground text-center">
              Didn't receive an email? Check your spam folder or try again with a different email address.
            </p>
            
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsSuccess(false);
                  setEmail("");
                }}
                className="w-full"
                data-testid="button-try-again"
              >
                Try Another Email
              </Button>
              
              <Link href="/login">
                <Button variant="ghost" className="w-full" data-testid="link-back-login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <SEOHead 
        title="Forgot Password - BadBlue"
        description="Reset your BadBlue account password"
      />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot Your Password?</CardTitle>
          <CardDescription>
            No worries! Enter your email address and we'll send you instructions to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {requestResetMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {(requestResetMutation.error as any)?.message || 
                   "Failed to send reset email. Please try again."}
                </AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={requestResetMutation.isPending}
                data-testid="input-email"
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={requestResetMutation.isPending || !email}
              data-testid="button-reset-password"
            >
              {requestResetMutation.isPending ? (
                "Sending..."
              ) : (
                "Send Reset Link"
              )}
            </Button>
            
            <div className="text-center pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                Remember your password?
              </p>
              <Link href="/login">
                <Button variant="ghost" className="w-full" data-testid="link-back-login">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}