import React, { useEffect } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { usersService } from "@/lib/services/firebase/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface EmailPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

const defaultPreferences: EmailPreference[] = [
  {
    id: "new_leads",
    label: "New Lead Notifications",
    description: "Get notified when new leads are assigned to you",
    enabled: true,
  },
  {
    id: "lead_updates",
    label: "Lead Status Updates",
    description: "Receive updates when lead status changes",
    enabled: true,
  },
  {
    id: "course_updates",
    label: "Course Updates",
    description: "Get notified about course changes and updates",
    enabled: true,
  },
  {
    id: "announcements",
    label: "Announcements",
    description: "Receive company-wide announcements",
    enabled: true,
  },
  {
    id: "digest",
    label: "Daily Digest",
    description: "Receive a daily summary of all activities",
    enabled: false,
  },
];

const EmailPreferences = () => {
  const { toast } = useToast();
  const [preferences, setPreferences] =
    React.useState<EmailPreference[]>(defaultPreferences);

  const handleToggle = (id: string) => {
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.id === id ? { ...pref, enabled: !pref.enabled } : pref,
      ),
    );
  };

  const { user } = useAuth();

  useEffect(() => {
    if (user?.emailPreferences) {
      setPreferences((prev) =>
        prev.map((pref) => ({
          ...pref,
          enabled: user.emailPreferences?.[pref.id] ?? pref.enabled,
        })),
      );
    }
  }, [user]);

  const handleSave = async () => {
    if (!user?.id) return;

    try {
      const emailPreferences = preferences.reduce(
        (acc, pref) => ({
          ...acc,
          [pref.id]: pref.enabled,
        }),
        {},
      );

      await usersService.update(user.id, { emailPreferences });
      toast({
        title: "Preferences Saved",
        description: "Your email notification preferences have been updated.",
      });
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {preferences.map((preference) => (
          <div
            key={preference.id}
            className="flex items-center justify-between space-x-4"
          >
            <div className="flex-1 space-y-1">
              <Label htmlFor={preference.id}>{preference.label}</Label>
              <p className="text-sm text-muted-foreground">
                {preference.description}
              </p>
            </div>
            <Switch
              id={preference.id}
              checked={preference.enabled}
              onCheckedChange={() => handleToggle(preference.id)}
            />
          </div>
        ))}
        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Preferences</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailPreferences;
