import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Delete user from Firebase Authentication when deleted from Firestore
export const onUserDeleted = functions.firestore
  .document("users/{userId}")
  .onDelete(async (snap, context) => {
    const userId = context.params.userId;
    try {
      // Check if this is a Firebase Auth UID
      await admin.auth().getUser(userId);

      // If we get here, the user exists in Firebase Auth
      await admin.auth().deleteUser(userId);
      console.log(`Successfully deleted user ${userId} from Firebase Auth`);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting user ${userId} from Firebase Auth:`, error);
      // Don't throw an error, as the Firestore deletion has already happened
      return { success: false, error: error.message };
    }
  });

// Create a user in Firebase Auth from Firestore data
export const createAuthUser = functions.https.onCall(async (data, context) => {
  // Check if the caller is authenticated and has admin role
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated",
    );
  }

  // Verify admin permissions
  const callerUid = context.auth.uid;
  const callerDoc = await admin
    .firestore()
    .collection("users")
    .doc(callerUid)
    .get();

  if (!callerDoc.exists || callerDoc.data()?.role !== "Admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can create users",
    );
  }

  // Validate required fields
  const { email, password, displayName, role } = data;
  if (!email || !password || !displayName) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Email, password, and display name are required",
    );
  }

  try {
    // Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
      disabled: false,
    });

    // Create or update the user document in Firestore
    const now = new Date().toISOString();
    await admin
      .firestore()
      .collection("users")
      .doc(userRecord.uid)
      .set({
        uid: userRecord.uid,
        email,
        displayName,
        role: role || "Staff",
        status: "Active",
        permissions: [],
        createdAt: now,
        updatedAt: now,
        lastLogin: now,
      });

    return { success: true, uid: userRecord.uid };
  } catch (error) {
    console.error("Error creating user:", error);
    throw new functions.https.HttpsError(
      "internal",
      `Failed to create user: ${error.message}`,
    );
  }
});
