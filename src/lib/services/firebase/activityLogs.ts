import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface ActivityLog {
  id?: string;
  action: string;
  entityType:
    | "lead"
    | "student"
    | "course"
    | "instructor"
    | "company"
    | "contact";
  entityId: string;
  entityName: string;
  userId: string;
  userName: string;
  timestamp: Timestamp;
  details?: Record<string, any>;
}

const COLLECTION = "activityLogs";

export const activityLogsService = {
  async getAll(limitTo: number = 50) {
    const q = query(
      collection(db, COLLECTION),
      orderBy("timestamp", "desc"),
      limit(limitTo),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ActivityLog[];
  },

  async create(log: Omit<ActivityLog, "id" | "timestamp">) {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...log,
      timestamp: Timestamp.now(),
    });
    return { id: docRef.id, ...log };
  },

  async getByEntity(entityType: ActivityLog["entityType"], entityId: string) {
    const q = query(
      collection(db, COLLECTION),
      orderBy("timestamp", "desc"),
      limit(10),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ActivityLog[];
  },
};
