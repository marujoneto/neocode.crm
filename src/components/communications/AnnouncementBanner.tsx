import React, { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Megaphone, X } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notificationsService } from "@/lib/services/firebase/notifications";

interface AnnouncementBannerProps {
  announcement?: {
    title: string;
    message: string;
    type?: "info" | "warning" | "success";
  };
  onDismiss?: () => void;
}

const AnnouncementBanner = ({
  onDismiss,
  announcement: propAnnouncement,
}: AnnouncementBannerProps) => {
  const { user } = useAuth();
  const [announcement, setAnnouncement] = useState(propAnnouncement || null);

  useEffect(() => {
    if (propAnnouncement) {
      setAnnouncement(propAnnouncement);
      return;
    }

    // Fetch the latest announcement if none provided
    const fetchLatestAnnouncement = async () => {
      try {
        const q = query(
          collection(db, "announcements"),
          orderBy("createdAt", "desc"),
          limit(1),
        );
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setAnnouncement({
            title: data.title,
            message: data.message,
            type: "info",
          });

          // Mark related notification as read if it exists
          if (user?.uid) {
            const notificationsSnapshot = await getDocs(
              query(
                collection(db, "notifications"),
                where("userId", "==", user.uid),
                where("announcementId", "==", snapshot.docs[0].id),
                where("read", "==", false),
              ),
            );

            notificationsSnapshot.docs.forEach((doc) => {
              notificationsService.markAsRead(doc.id);
            });
          }
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };

    if (user?.uid) {
      fetchLatestAnnouncement();
    }
  }, [user?.uid, propAnnouncement]);

  if (!announcement || !user) return null;

  return (
    <Alert className="relative bg-blue-50 border-blue-200">
      <Megaphone className="h-4 w-4 text-blue-500" />
      <AlertTitle className="text-blue-700">{announcement.title}</AlertTitle>
      <AlertDescription className="text-blue-600">
        {announcement.message}
      </AlertDescription>
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-blue-500 hover:text-blue-600 hover:bg-blue-100"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
};

export default AnnouncementBanner;
