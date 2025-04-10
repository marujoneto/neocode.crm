import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Message {
  id?: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  content: string;
  timestamp: Timestamp;
  read: boolean;
}

const COLLECTION = "messages";

import { onSnapshot } from "firebase/firestore";

export const messagesService = {
  async getAll(userId: string) {
    const q = query(
      collection(db, COLLECTION),
      where("recipientId", "==", userId),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Message[],
      )
      .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
  },

  async create(message: Omit<Message, "id" | "timestamp" | "read">) {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...message,
      timestamp: Timestamp.now(),
      read: false,
    });
    return { id: docRef.id, ...message };
  },

  async markAsRead(messageId: string) {
    const docRef = doc(db, COLLECTION, messageId);
    await updateDoc(docRef, { read: true });
  },

  subscribeToMessages(userId: string, callback: (messages: Message[]) => void) {
    const q = query(
      collection(db, COLLECTION),
      where("recipientId", "==", userId),
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as Message[],
        )
        .sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
      callback(messages);
    });
  },
};
