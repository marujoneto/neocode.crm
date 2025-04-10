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
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Student {
  id?: string;
  name: string;
  email: string;
  status: "Active" | "Inactive" | "Graduated";
  course: string;
  courseTitle?: string;
  enrollmentDate: string;
}

const COLLECTION = "students";

export const studentsService = {
  async getAll() {
    const querySnapshot = await getDocs(collection(db, COLLECTION));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Student[];
  },

  async create(student: Omit<Student, "id">) {
    const docRef = await addDoc(collection(db, COLLECTION), student);
    return { id: docRef.id, ...student };
  },

  async update(id: string, student: Partial<Student>) {
    await updateDoc(doc(db, COLLECTION, id), student);
    return { id, ...student };
  },

  async delete(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  async getByStatus(status: Student["status"]) {
    const q = query(collection(db, COLLECTION), where("status", "==", status));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Student[];
  },

  async getByCourse(course: string) {
    const q = query(collection(db, COLLECTION), where("course", "==", course));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Student[];
  },

  async getSorted(field: keyof Student, direction: "asc" | "desc" = "asc") {
    const q = query(collection(db, COLLECTION), orderBy(field, direction));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Student[];
  },
};
