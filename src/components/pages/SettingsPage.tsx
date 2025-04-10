import React from "react";
import DashboardHeader from "../layout/DashboardHeader";
import Sidebar from "../layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EmailPreferences from "@/components/users/EmailPreferences";
import EmailTemplatesTable from "@/components/communications/EmailTemplatesTable";
import BackupManager from "@/components/settings/BackupManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import AccountLockoutInfo from "@/components/auth/AccountLockoutInfo";

const SettingsPage = () => {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "Admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    try {
      await updateUserProfile({
        displayName: formData.get("displayName") as string,
        email: formData.get("email") as string,
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader userName={user?.displayName} userEmail={user?.email} />

      <div className="flex h-screen pt-16">
        <Sidebar
          className="fixed left-0 h-[calc(100vh-64px)]"
          activeItem="settings"
        />

        <main className="flex-1 ml-[280px] p-6 space-y-6 overflow-auto">
          <div className="max-w-[800px] mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="displayName">Name</Label>
                      <Input
                        id="displayName"
                        name="displayName"
                        defaultValue={user?.displayName}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={user?.email}
                        required
                      />
                    </div>
                    <Button type="submit">Save Changes</Button>
                  </form>
                </CardContent>
              </Card>

              <EmailPreferences />

              {isAdmin && (
                <Card>
                  <CardHeader>
                    <CardTitle>Account Security Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AccountLockoutInfo />
                  </CardContent>
                </Card>
              )}

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Email Templates</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmailTemplatesTable />
                </CardContent>
              </Card>

              <BackupManager />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
