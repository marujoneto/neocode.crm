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

export interface Company {
  id?: string;
  name: string;
  industry: string;
  size: string;
  website: string;
  status: "Active" | "Inactive" | "Prospect";
  contractedCourses: string[];
  customProjects: string[];
}

const COLLECTION = "companies";

export const companiesService = {
  async getAll() {
    const querySnapshot = await getDocs(collection(db, COLLECTION));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Company[];
  },

  async create(company: Omit<Company, "id">) {
    const docRef = await addDoc(collection(db, COLLECTION), company);
    return { id: docRef.id, ...company };
  },

  async update(id: string, company: Partial<Company>) {
    await updateDoc(doc(db, COLLECTION, id), company);
    return { id, ...company };
  },

  async delete(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  async getByStatus(status: Company["status"]) {
    const q = query(collection(db, COLLECTION), where("status", "==", status));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Company[];
  },

  async getByIndustry(industry: string) {
    const q = query(
      collection(db, COLLECTION),
      where("industry", "==", industry),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Company[];
  },

  async getSorted(field: keyof Company, direction: "asc" | "desc" = "asc") {
    const q = query(collection(db, COLLECTION), orderBy(field, direction));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Company[];
  },
};
