import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { usersService, User } from "./users";

export const userManagementService = {
  /**
   * Creates a new user in both Firebase Authentication and Firestore
   * @param userData User data including email, password, and other profile information
   * @returns The created user object
   */
  async createUser(userData: {
    email: string;
    password: string;
    displayName: string;
    role: User["role"];
    status: User["status"];
    permissions?: string[];
  }) {
    try {
      console.log(`Creating new user in Firebase Auth: ${userData.email}`);

      // First create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password,
      );

      // Set the display name
      await updateProfile(userCredential.user, {
        displayName: userData.displayName,
      });

      console.log(
        `User created in Firebase Auth with UID: ${userCredential.user.uid}`,
      );

      // Then create the user profile in Firestore
      const now = new Date().toISOString();
      const firestoreUser = await usersService.create({
        uid: userCredential.user.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        status: userData.status,
        permissions: userData.permissions || [],
        lastLogin: now,
        createdAt: now,
        updatedAt: now,
      });

      console.log(`User profile created in Firestore: ${firestoreUser.id}`);

      return firestoreUser;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  /**
   * Deletes a user from both Firebase Authentication and Firestore
   * @param userId The user ID to delete
   */
  async deleteUser(userId: string) {
    try {
      // First delete from Firestore
      await usersService.delete(userId);

      // Note: Deleting from Firebase Auth requires admin SDK or callable functions
      // This would need to be implemented in a Cloud Function
      console.log(
        `User ${userId} deleted from Firestore. Firebase Auth deletion requires admin SDK.`,
      );

      return true;
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  },
};
