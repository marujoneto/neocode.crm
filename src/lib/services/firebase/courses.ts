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
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Course {
  id?: string;
  title: string;
  description: string;
  instructorIds: string[];
  status: "Active" | "Upcoming" | "Completed";
  startDate: string;
  endDate: string;
  capacity: number;
  enrolledCount: number;
  price: number;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
}

const COLLECTION = "courses";

export const coursesService = {
  async getAll() {
    const querySnapshot = await getDocs(collection(db, COLLECTION));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[];
  },

  async create(course: Omit<Course, "id">) {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...course,
      instructorIds: course.instructorIds || [],
    });
    return { id: docRef.id, ...course };
  },

  async update(id: string, course: Partial<Course>) {
    await updateDoc(doc(db, COLLECTION, id), course);
    return { id, ...course };
  },

  async delete(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  async addInstructor(courseId: string, instructorId: string) {
    await updateDoc(doc(db, COLLECTION, courseId), {
      instructorIds: arrayUnion(instructorId),
    });
  },

  async removeInstructor(courseId: string, instructorId: string) {
    await updateDoc(doc(db, COLLECTION, courseId), {
      instructorIds: arrayRemove(instructorId),
    });
  },

  async getByInstructor(instructorId: string) {
    const q = query(
      collection(db, COLLECTION),
      where("instructorIds", "array-contains", instructorId),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[];
  },

  async getByStatus(status: Course["status"]) {
    const q = query(collection(db, COLLECTION), where("status", "==", status));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[];
  },

  async getByCategory(category: string) {
    const q = query(
      collection(db, COLLECTION),
      where("category", "==", category),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[];
  },

  async getSorted(field: keyof Course, direction: "asc" | "desc" = "asc") {
    const q = query(collection(db, COLLECTION), orderBy(field, direction));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Course[];
  },
};
