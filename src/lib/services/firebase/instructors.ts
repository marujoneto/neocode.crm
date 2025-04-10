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

export interface Instructor {
  id?: string;
  name: string;
  email: string;
  specialization: string;
  courseIds: string[];
  status: "Active" | "On Leave" | "Inactive";
  joinDate: string;
}

const COLLECTION = "instructors";

export const instructorsService = {
  async getAll() {
    const querySnapshot = await getDocs(collection(db, COLLECTION));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Instructor[];
  },

  async create(instructor: Omit<Instructor, "id">) {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...instructor,
      courseIds: instructor.courseIds || [],
    });
    return { id: docRef.id, ...instructor };
  },

  async update(id: string, instructor: Partial<Instructor>) {
    await updateDoc(doc(db, COLLECTION, id), instructor);
    return { id, ...instructor };
  },

  async delete(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  async addCourse(instructorId: string, courseId: string) {
    await updateDoc(doc(db, COLLECTION, instructorId), {
      courseIds: arrayUnion(courseId),
    });
  },

  async removeCourse(instructorId: string, courseId: string) {
    await updateDoc(doc(db, COLLECTION, instructorId), {
      courseIds: arrayRemove(courseId),
    });
  },

  async getByCourse(courseId: string) {
    const q = query(
      collection(db, COLLECTION),
      where("courseIds", "array-contains", courseId),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Instructor[];
  },

  async getByStatus(status: Instructor["status"]) {
    const q = query(collection(db, COLLECTION), where("status", "==", status));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Instructor[];
  },

  async getSorted(field: keyof Instructor, direction: "asc" | "desc" = "asc") {
    const q = query(collection(db, COLLECTION), orderBy(field, direction));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Instructor[];
  },
};
