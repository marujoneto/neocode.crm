import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, CheckCircle, Mail } from "lucide-react";

const EmailVerification = () => {
  const { authUser, isEmailVerified, sendVerificationEmail, verifyEmail } =
    useAuth();
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Extract action code from URL if present
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const actionCode = queryParams.get("oobCode");
    const mode = queryParams.get("mode");

    if (mode === "verifyEmail" && actionCode) {
      handleVerifyEmail(actionCode);
    }
  }, [location]);

  const handleVerifyEmail = async (actionCode: string) => {
    setVerifying(true);
    setError(null);
    try {
      await verifyEmail(actionCode);
      setSuccess("Your email has been verified successfully!");
      // Redirect to home after 3 seconds
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error: any) {
      setError(error.message || "Failed to verify email");
    } finally {
      setVerifying(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    setSending(true);
    setError(null);
    try {
      await sendVerificationEmail();
      toast({
        title: "Verification Email Sent",
        description:
          "Please check your inbox and follow the link to verify your email.",
      });
    } catch (error: any) {
      setError(error.message || "Failed to send verification email");
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
            <h2 className="mt-4 text-2xl font-bold">Not Logged In</h2>
            <p className="mt-2 text-gray-600">
              You need to be logged in to verify your email.
            </p>
            <Button onClick={() => navigate("/login")} className="mt-6">
              Go to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-2xl font-bold">Email Verified!</h2>
            <p className="mt-2 text-gray-600">{success}</p>
            <p className="mt-2 text-gray-500">Redirecting to dashboard...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (isEmailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-2xl font-bold">Email Already Verified</h2>
            <p className="mt-2 text-gray-600">
              Your email address has already been verified.
            </p>
            <Button onClick={() => navigate("/")} className="mt-6">
              Go to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="p-8 max-w-md w-full">
        <div className="text-center">
          <Mail className="mx-auto h-12 w-12 text-blue-500" />
          <h2 className="mt-4 text-2xl font-bold">Verify Your Email</h2>
          <p className="mt-2 text-gray-600">
            Please verify your email address to access all features.
          </p>
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          <Button
            onClick={handleSendVerificationEmail}
            className="mt-6 w-full"
            disabled={sending || verifying}
          >
            {sending ? "Sending..." : "Send Verification Email"}
          </Button>
          <p className="mt-4 text-sm text-gray-500">
            Check your inbox for the verification link. If you don't see it,
            check your spam folder or request a new link.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="mt-4 w-full"
          >
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default EmailVerification;
