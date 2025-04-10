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
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  body: string;
  type: "welcome" | "lead" | "course" | "announcement" | "custom";
  variables: string[];
  createdAt: string;
  updatedAt: string;
}

const COLLECTION = "emailTemplates";

export const emailTemplatesService = {
  async getAll() {
    const querySnapshot = await getDocs(collection(db, COLLECTION));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EmailTemplate[];
  },

  async create(
    template: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">,
  ) {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...template,
      createdAt: now,
      updatedAt: now,
    });
    return { id: docRef.id, ...template, createdAt: now, updatedAt: now };
  },

  async update(id: string, template: Partial<EmailTemplate>) {
    const updates = {
      ...template,
      updatedAt: new Date().toISOString(),
    };
    await updateDoc(doc(db, COLLECTION, id), updates);
    return { id, ...updates };
  },

  async delete(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  async getByType(type: EmailTemplate["type"]) {
    const q = query(collection(db, COLLECTION), where("type", "==", type));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EmailTemplate[];
  },

  async getSorted(
    field: keyof EmailTemplate,
    direction: "asc" | "desc" = "asc",
  ) {
    const q = query(collection(db, COLLECTION), orderBy(field, direction));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EmailTemplate[];
  },
};
