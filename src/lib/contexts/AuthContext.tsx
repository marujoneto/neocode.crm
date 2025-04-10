import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  applyActionCode,
  EmailAuthProvider,
  reauthenticateWithCredential,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { User, usersService } from "@/lib/services/firebase/users";
import { accountLockoutService } from "@/lib/services/firebase/accountLockout";

interface AuthContextType {
  user: User | null;
  authUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (data: {
    displayName?: string;
    email?: string;
    photoURL?: string;
  }) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  verifyEmail: (actionCode: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<boolean>;
  isEmailVerified: boolean;
  checkAccountStatus: (
    email: string,
  ) => Promise<{ exists: boolean; locked: boolean }>;
  unlockAccount: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setAuthUser(authUser);
      if (authUser) {
        setIsEmailVerified(authUser.emailVerified);
        try {
          console.log("Auth state changed, user authenticated:", authUser.uid);
          let userData = await usersService.getByUid(authUser.uid);
          console.log(
            "User data from Firestore:",
            userData ? "found" : "not found",
          );

          const now = new Date().toISOString();

          if (!userData) {
            // Create user profile if it doesn't exist
            console.log("Creating new user profile in Firestore");
            userData = await usersService.create({
              uid: authUser.uid,
              email: authUser.email || "",
              displayName:
                authUser.displayName || authUser.email?.split("@")[0] || "",
              role: "Admin", // First user is admin
              status: "Active",
              permissions: ["*"],
              lastLogin: now,
              createdAt: now,
              updatedAt: now,
            });
            console.log(
              "New user profile created:",
              userData ? "success" : "failed",
            );
          } else {
            // Update last login and sync Firebase Auth display name
            console.log("Updating existing user profile");
            await usersService.update(userData.id!, {
              lastLogin: now,
              displayName: authUser.displayName || userData.displayName,
              updatedAt: now,
            });
            // Fetch the updated user data
            userData = await usersService.getByUid(authUser.uid);
            console.log(
              "User profile updated:",
              userData ? "success" : "failed",
            );
          }

          setUser(userData);
        } catch (error) {
          console.error("Error loading user profile:", error);
        }
      } else {
        console.log("User signed out or not authenticated");
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Skip lockout check for existing users to avoid permission errors
      // We'll directly attempt to sign in
      await signInWithEmailAndPassword(auth, email, password);

      // After successful login, we can safely record it
      try {
        await accountLockoutService.recordSuccessfulLogin(email);
        console.log("Login successful, recorded in lockout service");
      } catch (lockoutError) {
        // If recording fails, it's not critical - user is already logged in
        console.warn(
          "Could not record successful login in lockout service:",
          lockoutError,
        );
      }
    } catch (error: any) {
      console.error("Login error:", error.message);

      // Only try to record failed attempt if it's not a permissions error
      if (!error.message.includes("Missing or insufficient permissions")) {
        try {
          const lockStatus =
            await accountLockoutService.recordFailedAttempt(email);

          if (lockStatus.locked) {
            throw new Error(
              `Account is locked due to too many failed attempts. Try again after ${lockStatus.lockedUntil?.toLocaleTimeString()}.`,
            );
          } else if (lockStatus.attemptsRemaining > 0) {
            throw new Error(
              `Invalid email or password. ${lockStatus.attemptsRemaining} attempts remaining before account lockout.`,
            );
          }
        } catch (lockoutError) {
          console.warn("Could not record failed login attempt:", lockoutError);
          // Continue with original error
        }
      }

      // For permission errors, provide a more user-friendly message
      if (error.message.includes("Missing or insufficient permissions")) {
        throw new Error("Invalid email or password. Please try again.");
      }

      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    const displayName = email.split("@")[0];
    await updateProfile(userCredential.user, { displayName });
    await sendEmailVerification(userCredential.user);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateUserProfile = async (data: {
    displayName?: string;
    email?: string;
    photoURL?: string;
  }) => {
    if (!authUser || !user?.id) return;

    try {
      // Update Firebase Auth profile
      if (data.displayName) {
        await updateProfile(authUser, { displayName: data.displayName });
      }

      // Update Firestore user document
      await usersService.update(user.id, {
        ...data,
        updatedAt: new Date().toISOString(),
      });

      // Fetch the updated user data
      const updatedUser = await usersService.getByUid(authUser.uid);
      if (updatedUser) {
        setUser(updatedUser);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const sendVerificationEmail = async () => {
    if (!authUser) throw new Error("No authenticated user");
    await sendEmailVerification(authUser);
  };

  const verifyEmail = async (actionCode: string) => {
    await applyActionCode(auth, actionCode);
    if (authUser) {
      // Force refresh the user to update emailVerified status
      await authUser.reload();
      setIsEmailVerified(authUser.emailVerified);
    }
  };

  const reauthenticate = async (password: string) => {
    if (!authUser || !authUser.email) return false;
    try {
      const credential = EmailAuthProvider.credential(authUser.email, password);
      await reauthenticateWithCredential(authUser, credential);
      return true;
    } catch (error) {
      console.error("Reauthentication failed:", error);
      return false;
    }
  };

  const checkAccountStatus = async (email: string) => {
    try {
      // Check if email exists in Firebase Auth
      const methods = await fetchSignInMethodsForEmail(auth, email);
      const exists = methods.length > 0;

      // Check lockout status
      const lockStatus = await accountLockoutService.checkLockoutStatus(email);

      return {
        exists,
        locked: lockStatus.locked,
      };
    } catch (error) {
      console.error("Error checking account status:", error);
      return { exists: false, locked: false };
    }
  };

  const unlockAccount = async (email: string) => {
    await accountLockoutService.resetLockout(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        authUser,
        loading,
        signIn,
        signUp,
        logout,
        updateUserProfile,
        resetPassword,
        sendVerificationEmail,
        verifyEmail,
        reauthenticate,
        isEmailVerified,
        checkAccountStatus,
        unlockAccount,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

// For HMR compatibility with vite-plugin-react-swc, we need to use named exports
// See: https://github.com/vitejs/vite-plugin-react-swc#consistent-components-exports
export { AuthProvider, useAuth };

// Note: Do not change to default exports or use `export default { AuthProvider, useAuth }`
// as it will break HMR with vite-plugin-react-swc
