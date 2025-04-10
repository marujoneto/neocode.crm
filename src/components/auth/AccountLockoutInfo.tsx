import { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LockIcon,
  UnlockIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "lucide-react";

const AccountLockoutInfo = () => {
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [accountStatus, setAccountStatus] = useState<{
    exists: boolean;
    locked: boolean;
  } | null>(null);
  const { checkAccountStatus, unlockAccount } = useAuth();
  const { toast } = useToast();

  const handleCheckStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setChecking(true);
    try {
      const status = await checkAccountStatus(email);
      setAccountStatus(status);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check account status",
        variant: "destructive",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleUnlockAccount = async () => {
    if (!email || !accountStatus?.exists) return;

    setUnlocking(true);
    try {
      await unlockAccount(email);
      toast({
        title: "Account Unlocked",
        description: `The account for ${email} has been successfully unlocked.`,
      });
      // Refresh status
      const status = await checkAccountStatus(email);
      setAccountStatus(status);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unlock account",
        variant: "destructive",
      });
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LockIcon className="h-5 w-5" />
          Account Lockout Status
        </CardTitle>
        <CardDescription>
          Check if an account is locked due to too many failed login attempts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCheckStatus} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email to check"
              required
            />
          </div>
          <Button type="submit" disabled={checking || !email}>
            {checking ? "Checking..." : "Check Status"}
          </Button>
        </form>

        {accountStatus && (
          <div className="mt-6 p-4 border rounded-md">
            <div className="flex items-center gap-2 mb-2">
              {accountStatus.exists ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangleIcon className="h-5 w-5 text-yellow-500" />
              )}
              <span className="font-medium">
                Account {accountStatus.exists ? "exists" : "not found"}
              </span>
            </div>

            {accountStatus.exists && (
              <div className="flex items-center gap-2">
                {accountStatus.locked ? (
                  <LockIcon className="h-5 w-5 text-red-500" />
                ) : (
                  <UnlockIcon className="h-5 w-5 text-green-500" />
                )}
                <span>
                  Account is currently{" "}
                  {accountStatus.locked ? "locked" : "not locked"}
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {accountStatus?.exists && accountStatus.locked && (
        <CardFooter>
          <Button
            onClick={handleUnlockAccount}
            disabled={unlocking}
            variant="secondary"
            className="w-full"
          >
            {unlocking ? "Unlocking..." : "Unlock Account"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default AccountLockoutInfo;
