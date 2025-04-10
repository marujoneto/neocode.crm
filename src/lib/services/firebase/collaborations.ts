import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Comment {
  id?: string;
  content: string;
  userId: string;
  userName: string;
  timestamp: Timestamp;
}

export interface Reminder {
  id?: string;
  title: string;
  description: string;
  dueDate: string;
  tags: string[];
  completed: boolean;
  assignedTo: string;
  createdBy: string;
  createdByName: string;
  timestamp: Timestamp;
}

export interface Interaction {
  id?: string;
  type: "call" | "email" | "meeting" | "note";
  description: string;
  userId: string;
  userName: string;
  timestamp: Timestamp;
  outcome?: string;
  followUpDate?: string;
}

const COMMENTS_COLLECTION = "comments";
const REMINDERS_COLLECTION = "reminders";
const INTERACTIONS_COLLECTION = "interactions";

export const collaborationService = {
  // Comments
  async getCommentsByEntity(entityType: string, entityId: string) {
    const q = query(
      collection(db, COMMENTS_COLLECTION),
      where("entityType", "==", entityType),
      where("entityId", "==", entityId),
      orderBy("timestamp", "desc"),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Comment[];
  },

  async addComment(
    entityType: string,
    entityId: string,
    comment: Omit<Comment, "id" | "timestamp">,
  ) {
    const docRef = await addDoc(collection(db, COMMENTS_COLLECTION), {
      ...comment,
      entityType,
      entityId,
      timestamp: Timestamp.now(),
    });
    return { id: docRef.id, ...comment, timestamp: Timestamp.now() };
  },

  async deleteComment(commentId: string) {
    await deleteDoc(doc(db, COMMENTS_COLLECTION, commentId));
  },

  // Reminders
  async getRemindersByEntity(entityType: string, entityId: string) {
    const q = query(
      collection(db, REMINDERS_COLLECTION),
      where("entityType", "==", entityType),
      where("entityId", "==", entityId),
      orderBy("dueDate", "asc"),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Reminder[];
  },

  async getRemindersByUser(userId: string) {
    const q = query(
      collection(db, REMINDERS_COLLECTION),
      where("assignedTo", "==", userId),
      where("completed", "==", false),
      orderBy("dueDate", "asc"),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Reminder[];
  },

  async addReminder(
    entityType: string,
    entityId: string,
    reminder: Omit<Reminder, "id" | "timestamp">,
  ) {
    const docRef = await addDoc(collection(db, REMINDERS_COLLECTION), {
      ...reminder,
      entityType,
      entityId,
      timestamp: Timestamp.now(),
    });
    return { id: docRef.id, ...reminder, timestamp: Timestamp.now() };
  },

  async updateReminder(reminderId: string, updates: Partial<Reminder>) {
    await updateDoc(doc(db, REMINDERS_COLLECTION, reminderId), updates);
  },

  async deleteReminder(reminderId: string) {
    await deleteDoc(doc(db, REMINDERS_COLLECTION, reminderId));
  },

  // Interactions
  async getInteractionsByEntity(entityType: string, entityId: string) {
    const q = query(
      collection(db, INTERACTIONS_COLLECTION),
      where("entityType", "==", entityType),
      where("entityId", "==", entityId),
      orderBy("timestamp", "desc"),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Interaction[];
  },

  async addInteraction(
    entityType: string,
    entityId: string,
    interaction: Omit<Interaction, "id" | "timestamp">,
  ) {
    const docRef = await addDoc(collection(db, INTERACTIONS_COLLECTION), {
      ...interaction,
      entityType,
      entityId,
      timestamp: Timestamp.now(),
    });
    return { id: docRef.id, ...interaction, timestamp: Timestamp.now() };
  },

  async updateInteraction(
    interactionId: string,
    updates: Partial<Interaction>,
  ) {
    await updateDoc(doc(db, INTERACTIONS_COLLECTION, interactionId), updates);
  },

  async deleteInteraction(interactionId: string) {
    await deleteDoc(doc(db, INTERACTIONS_COLLECTION, interactionId));
  },
};
