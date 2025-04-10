import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export interface MetricsListener {
  unsubscribe: () => void;
}

export const metricsService = {
  subscribeToMetrics(onUpdate: (metrics: any) => void): MetricsListener {
    const unsubscribers: (() => void)[] = [];

    // Leads listener
    const leadsUnsubscribe = onSnapshot(collection(db, "leads"), (snapshot) => {
      const total = snapshot.docs.length;
      const newLeads = snapshot.docs.filter(
        (doc) => doc.data().status === "New",
      ).length;
      onUpdate({
        type: "leads",
        total,
        new: newLeads,
        trend: ((newLeads / total) * 100).toFixed(1),
      });
    });
    unsubscribers.push(leadsUnsubscribe);

    // Students listener
    const studentsUnsubscribe = onSnapshot(
      collection(db, "students"),
      (snapshot) => {
        const total = snapshot.docs.length;
        const active = snapshot.docs.filter(
          (doc) => doc.data().status === "Active",
        ).length;
        onUpdate({
          type: "students",
          total,
          active,
          trend: ((active / total) * 100).toFixed(1),
        });
      },
    );
    unsubscribers.push(studentsUnsubscribe);

    // Courses listener
    const coursesUnsubscribe = onSnapshot(
      collection(db, "courses"),
      (snapshot) => {
        const total = snapshot.docs.length;
        const completed = snapshot.docs.filter(
          (doc) => doc.data().status === "Completed",
        ).length;
        onUpdate({
          type: "courses",
          total,
          completed,
          completionRate: ((completed / total) * 100).toFixed(1),
        });
      },
    );
    unsubscribers.push(coursesUnsubscribe);

    // Revenue listener (from courses)
    const revenueUnsubscribe = onSnapshot(
      query(collection(db, "courses"), where("status", "==", "Active")),
      (snapshot) => {
        const totalRevenue = snapshot.docs.reduce((acc, doc) => {
          const data = doc.data();
          return acc + data.price * (data.enrolledCount || 0);
        }, 0);
        onUpdate({
          type: "revenue",
          total: totalRevenue,
          trend: 0, // You'll need to calculate this based on historical data
        });
      },
    );
    unsubscribers.push(revenueUnsubscribe);

    return {
      unsubscribe: () => unsubscribers.forEach((unsubscribe) => unsubscribe()),
    };
  },
};
