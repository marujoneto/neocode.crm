import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/contexts/AuthContext";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const VerifyEmailBanner = () => {
  const { authUser, isEmailVerified, sendVerificationEmail } = useAuth();
  const [sending, setSending] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Don't show banner if user is not logged in, email is verified, or banner was dismissed
  if (!authUser || isEmailVerified || dismissed) {
    return null;
  }

  const handleSendVerificationEmail = async () => {
    setSending(true);
    try {
      await sendVerificationEmail();
      toast({
        title: "Verification Email Sent",
        description:
          "Please check your inbox and follow the link to verify your email.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification email",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3 flex-1 md:flex md:justify-between md:items-center">
          <p className="text-sm text-yellow-700">
            Your email address is not verified. Some features may be limited.
          </p>
          <div className="mt-3 flex md:mt-0 md:ml-6 space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendVerificationEmail}
              disabled={sending}
            >
              {sending ? "Sending..." : "Resend Verification"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/verify-email")}
            >
              Verify Now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailBanner;
