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
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface User {
  id?: string;
  uid: string;
  email: string;
  displayName: string;
  role: "Admin" | "Manager" | "Instructor" | "Staff";
  status: "Active" | "Inactive" | "Pending";
  permissions: string[];
  emailPreferences?: Record<string, boolean>;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
}

const COLLECTION = "users";

const DEFAULT_PERMISSIONS = {
  Admin: ["*"],
  Manager: [
    "view_dashboard",
    "manage_leads",
    "manage_students",
    "manage_courses",
    "view_reports",
  ],
  Instructor: ["view_dashboard", "view_courses", "manage_students"],
  Staff: ["view_dashboard", "view_leads"],
};

const getDefaultPermissions = (role: User["role"]) => {
  return DEFAULT_PERMISSIONS[role] || ["view_dashboard"];
};

export const usersService = {
  async getAll() {
    const querySnapshot = await getDocs(collection(db, COLLECTION));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  },

  async create(user: Omit<User, "id">) {
    const docRef = doc(db, COLLECTION, user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Usuário já existe, atualize os campos necessários
      const updates = {
        ...user,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(docRef, updates);
      return { id: user.uid, ...updates };
    } else {
      // Usuário não existe, crie um novo documento
      const userData = {
        ...user,
        permissions: user.permissions || getDefaultPermissions(user.role),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(docRef, userData);
      return { id: user.uid, ...userData };
    }
  },
  async update(id: string, user: Partial<User>) {
    try {
      // First check if the user exists
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error(`User with ID ${id} does not exist`);
      }

      const updates = {
        ...user,
        updatedAt: new Date().toISOString(),
        ...(user.role && { permissions: getDefaultPermissions(user.role) }),
      };

      await updateDoc(docRef, updates);

      // Verify the update was successful
      const updatedDoc = await getDoc(docRef);
      if (!updatedDoc.exists()) {
        throw new Error(`Failed to verify update for user ${id}`);
      }

      return { id, ...updatedDoc.data() } as User;
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  },

  async delete(id: string) {
    try {
      if (!id) {
        throw new Error("Invalid user ID: ID is empty");
      }

      // First check if the user exists
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error(`User with ID ${id} does not exist in the database`);
      }

      // Get user data for logging
      const userData = docSnap.data();
      console.log(
        `Attempting to delete user: ${id}, Email: ${userData.email}, Name: ${userData.displayName}`,
      );

      // Perform deletion
      await deleteDoc(docRef);

      // Verify deletion was successful
      const verifyDoc = await getDoc(docRef);
      if (verifyDoc.exists()) {
        throw new Error(
          `Failed to delete user ${id} - document still exists after deletion`,
        );
      }

      console.log(`Successfully deleted user: ${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  },

  async getByRole(role: User["role"]) {
    const q = query(collection(db, COLLECTION), where("role", "==", role));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  },

  async getByStatus(status: User["status"]) {
    const q = query(collection(db, COLLECTION), where("status", "==", status));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  },

  async getByUid(uid: string) {
    if (!uid) return undefined;

    try {
      const docRef = doc(db, COLLECTION, uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return undefined;
    } catch (error) {
      console.error(`Error getting user by UID ${uid}:`, error);
      return undefined;
    }
  },

  // Get user by email - useful for checking duplicates
  async getByEmail(email: string) {
    if (!email) return undefined;

    try {
      const q = query(collection(db, COLLECTION), where("email", "==", email));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as User;
      }
      return undefined;
    } catch (error) {
      console.error(`Error getting user by email ${email}:`, error);
      return undefined;
    }
  },

  async getSorted(field: keyof User, direction: "asc" | "desc" = "asc") {
    const q = query(collection(db, COLLECTION), orderBy(field, direction));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
  },
};
