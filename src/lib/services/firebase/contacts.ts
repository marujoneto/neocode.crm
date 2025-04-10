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

export interface Contact {
  id?: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  companyId: string;
  department: string;
  role: "Stakeholder" | "Decision Maker" | "Technical Contact" | "HR Contact";
  notes: string;
  involvedCourses: string[];
  involvedProjects: string[];
  createdBy?: {
    id: string;
    name: string;
  };
}

const COLLECTION = "contacts";

export const contactsService = {
  async getAll() {
    const querySnapshot = await getDocs(collection(db, COLLECTION));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Ensure arrays are initialized
      involvedCourses: doc.data().involvedCourses || [],
      involvedProjects: doc.data().involvedProjects || [],
    })) as Contact[];
  },

  async create(contact: Omit<Contact, "id">) {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...contact,
      // Ensure arrays are initialized
      involvedCourses: contact.involvedCourses || [],
      involvedProjects: contact.involvedProjects || [],
    });
    return { id: docRef.id, ...contact };
  },

  async update(id: string, contact: Partial<Contact>) {
    await updateDoc(doc(db, COLLECTION, id), contact);
    return { id, ...contact };
  },

  async delete(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  async getByCompany(companyId: string) {
    const q = query(
      collection(db, COLLECTION),
      where("companyId", "==", companyId),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      involvedCourses: doc.data().involvedCourses || [],
      involvedProjects: doc.data().involvedProjects || [],
    })) as Contact[];
  },

  async getByRole(role: Contact["role"]) {
    const q = query(collection(db, COLLECTION), where("role", "==", role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      involvedCourses: doc.data().involvedCourses || [],
      involvedProjects: doc.data().involvedProjects || [],
    })) as Contact[];
  },

  async getSorted(field: keyof Contact, direction: "asc" | "desc" = "asc") {
    const q = query(collection(db, COLLECTION), orderBy(field, direction));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      involvedCourses: doc.data().involvedCourses || [],
      involvedProjects: doc.data().involvedProjects || [],
    })) as Contact[];
  },
};
