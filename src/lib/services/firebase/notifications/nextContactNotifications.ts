import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notificationsService } from "../notifications";
import { Lead } from "../leads";

export const nextContactNotifications = {
  async checkDueContacts() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Query leads with nextContactDate set to today or earlier
    const q = query(
      collection(db, "leads"),
      where("nextContactDate", "<=", today.toISOString().split("T")[0]),
    );

    try {
      const querySnapshot = await getDocs(q);
      const dueLeads = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Lead[];

      // Create notifications for each due lead
      for (const lead of dueLeads) {
        if (!lead.lastInteractionBy) continue;

        // Find the user ID for the assigned person
        const userQuery = query(
          collection(db, "users"),
          where("displayName", "==", lead.lastInteractionBy),
        );

        const userSnapshot = await getDocs(userQuery);
        if (userSnapshot.empty) continue;

        const userId = userSnapshot.docs[0].id;

        // Create notification
        await notificationsService.create({
          userId,
          type: "lead",
          title: "Follow-up Reminder",
          message: `It's time to follow up with ${lead.name}. The scheduled contact date was ${new Date(lead.nextContactDate!).toLocaleDateString()}.`,
        });
      }

      return dueLeads.length;
    } catch (error) {
      console.error("Error checking due contacts:", error);
      return 0;
    }
  },
};
