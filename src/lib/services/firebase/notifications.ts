import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  updateDoc,
  doc,
  onSnapshot,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Notification {
  id?: string;
  userId: string;
  type: "announcement" | "lead" | "message";
  title?: string;
  message: string;
  read: boolean;
  createdAt: Timestamp;
  announcementId?: string;
}

const COLLECTION = "notifications";

export const notificationsService = {
  async getAll(userId: string, limitTo: number = 50) {
    const q = query(
      collection(db, COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitTo),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
  },

  async create(notification: Omit<Notification, "id" | "createdAt" | "read">) {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...notification,
      createdAt: Timestamp.now(),
      read: false,
    });
    return {
      id: docRef.id,
      ...notification,
      createdAt: Timestamp.now(),
      read: false,
    };
  },

  async createBatch(
    notifications: Omit<Notification, "id" | "createdAt" | "read">[],
  ) {
    const batch = writeBatch(db);
    const now = Timestamp.now();

    notifications.forEach((notification) => {
      const notificationRef = doc(collection(db, COLLECTION));
      batch.set(notificationRef, {
        ...notification,
        createdAt: now,
        read: false,
      });
    });

    await batch.commit();
  },

  async markAsRead(notificationId: string) {
    await updateDoc(doc(db, COLLECTION, notificationId), {
      read: true,
    });
  },

  async markAllAsRead(userId: string) {
    const notifications = await this.getAll(userId);
    const batch = writeBatch(db);

    notifications.forEach((notification) => {
      if (!notification.read && notification.id) {
        const notificationRef = doc(db, COLLECTION, notification.id);
        batch.update(notificationRef, { read: true });
      }
    });

    await batch.commit();
  },

  subscribeToNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void,
  ) {
    const q = query(
      collection(db, COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(50),
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];
      callback(notifications);
    });
  },
};
