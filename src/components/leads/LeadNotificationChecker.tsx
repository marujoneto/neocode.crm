import { useEffect, useState } from "react";
import { nextContactNotifications } from "@/lib/services/firebase/notifications/nextContactNotifications";
import { useToast } from "@/components/ui/use-toast";

const LeadNotificationChecker = () => {
  const { toast } = useToast();
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  useEffect(() => {
    // Check if we've already checked today
    const today = new Date().toISOString().split("T")[0];
    const storedLastChecked = localStorage.getItem("lastNotificationCheck");

    if (storedLastChecked === today) {
      setLastChecked(storedLastChecked);
      return;
    }

    // Check for due contacts
    const checkNotifications = async () => {
      try {
        const dueCount = await nextContactNotifications.checkDueContacts();

        if (dueCount > 0) {
          toast({
            title: "Follow-up Reminders",
            description: `You have ${dueCount} lead${dueCount === 1 ? "" : "s"} that need follow-up today.`,
            duration: 10000,
          });
        }

        // Store that we've checked today
        localStorage.setItem("lastNotificationCheck", today);
        setLastChecked(today);
      } catch (error) {
        console.error("Error checking notifications:", error);
      }
    };

    checkNotifications();

    // Set up interval to check every hour
    const interval = setInterval(checkNotifications, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [toast]);

  // This component doesn't render anything
  return null;
};

export default LeadNotificationChecker;
