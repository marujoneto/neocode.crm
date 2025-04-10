import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

interface LockoutRecord {
  email: string;
  failedAttempts: number;
  lastFailedAttempt: Timestamp | null;
  lockedUntil: Timestamp | null;
  lockoutCount: number;
}

const COLLECTION = "accountLockouts";
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const ATTEMPT_RESET_MINUTES = 30;

export const accountLockoutService = {
  /**
   * Records a failed login attempt for an email
   * @param email The email address that failed to login
   * @returns Information about the lockout status
   */
  async recordFailedAttempt(email: string): Promise<{
    locked: boolean;
    attemptsRemaining: number;
    lockedUntil: Date | null;
  }> {
    console.log(`Recording failed login attempt for email: ${email}`);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const docRef = doc(db, COLLECTION, normalizedEmail);
      const docSnap = await getDoc(docRef);

      const now = new Date();
      const nowTimestamp = Timestamp.fromDate(now);

      if (!docSnap.exists()) {
        // First failed attempt
        try {
          await setDoc(docRef, {
            email: normalizedEmail,
            failedAttempts: 1,
            lastFailedAttempt: nowTimestamp,
            lockedUntil: null,
            lockoutCount: 0,
          });
        } catch (error) {
          console.error("Error creating lockout record:", error);
          // If we can't create the record, just return default values
        }

        return {
          locked: false,
          attemptsRemaining: MAX_FAILED_ATTEMPTS - 1,
          lockedUntil: null,
        };
      }

      const data = docSnap.data() as LockoutRecord;

      // Check if account is currently locked
      if (data.lockedUntil && data.lockedUntil.toDate() > now) {
        // Extend lockout time for attempts during lockout
        const extendedLockout = new Date(
          now.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
        );
        try {
          await updateDoc(docRef, {
            lockedUntil: Timestamp.fromDate(extendedLockout),
          });
        } catch (error) {
          console.error("Error updating lockout time:", error);
        }

        return {
          locked: true,
          attemptsRemaining: 0,
          lockedUntil: extendedLockout,
        };
      }

      // Check if we should reset the counter due to time elapsed
      if (data.lastFailedAttempt) {
        const lastAttemptTime = data.lastFailedAttempt.toDate();
        const minutesSinceLastAttempt =
          (now.getTime() - lastAttemptTime.getTime()) / (60 * 1000);

        if (minutesSinceLastAttempt > ATTEMPT_RESET_MINUTES) {
          // Reset counter if it's been a while since last attempt
          try {
            await updateDoc(docRef, {
              failedAttempts: 1,
              lastFailedAttempt: nowTimestamp,
              lockedUntil: null,
            });
          } catch (error) {
            console.error("Error resetting attempt counter:", error);
          }

          return {
            locked: false,
            attemptsRemaining: MAX_FAILED_ATTEMPTS - 1,
            lockedUntil: null,
          };
        }
      }

      // Increment failed attempts
      const newFailedAttempts = data.failedAttempts + 1;

      // Check if account should be locked
      if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutEnd = new Date(
          now.getTime() + LOCKOUT_DURATION_MINUTES * 60 * 1000,
        );
        try {
          await updateDoc(docRef, {
            failedAttempts: 0, // Reset attempts counter
            lastFailedAttempt: nowTimestamp,
            lockedUntil: Timestamp.fromDate(lockoutEnd),
            lockoutCount: (data.lockoutCount || 0) + 1,
          });
        } catch (error) {
          console.error("Error locking account:", error);
        }

        return {
          locked: true,
          attemptsRemaining: 0,
          lockedUntil: lockoutEnd,
        };
      } else {
        // Update failed attempts
        try {
          await updateDoc(docRef, {
            failedAttempts: newFailedAttempts,
            lastFailedAttempt: nowTimestamp,
          });
        } catch (error) {
          console.error("Error updating failed attempts:", error);
        }

        return {
          locked: false,
          attemptsRemaining: MAX_FAILED_ATTEMPTS - newFailedAttempts,
          lockedUntil: null,
        };
      }
    } catch (error) {
      console.error("Error in recordFailedAttempt:", error);
      // If there's a permission error, return default values
      return {
        locked: false,
        attemptsRemaining: MAX_FAILED_ATTEMPTS - 1,
        lockedUntil: null,
      };
    }
  },

  /**
   * Checks if an account is currently locked out
   * @param email The email address to check
   * @returns Lockout status information
   */
  async checkLockoutStatus(email: string): Promise<{
    locked: boolean;
    attemptsRemaining: number;
    lockedUntil: Date | null;
  }> {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const docRef = doc(db, COLLECTION, normalizedEmail);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return {
          locked: false,
          attemptsRemaining: MAX_FAILED_ATTEMPTS,
          lockedUntil: null,
        };
      }

      const data = docSnap.data() as LockoutRecord;
      const now = new Date();

      // Check if account is currently locked
      if (data.lockedUntil && data.lockedUntil.toDate() > now) {
        return {
          locked: true,
          attemptsRemaining: 0,
          lockedUntil: data.lockedUntil.toDate(),
        };
      }

      // Check if we should reset the counter due to time elapsed
      if (data.lastFailedAttempt) {
        const lastAttemptTime = data.lastFailedAttempt.toDate();
        const minutesSinceLastAttempt =
          (now.getTime() - lastAttemptTime.getTime()) / (60 * 1000);

        if (minutesSinceLastAttempt > ATTEMPT_RESET_MINUTES) {
          // Counter would be reset on next attempt
          return {
            locked: false,
            attemptsRemaining: MAX_FAILED_ATTEMPTS,
            lockedUntil: null,
          };
        }
      }

      return {
        locked: false,
        attemptsRemaining: MAX_FAILED_ATTEMPTS - data.failedAttempts,
        lockedUntil: null,
      };
    } catch (error) {
      console.error("Error checking lockout status:", error);
      // If there's a permission error, return default unlocked state
      return {
        locked: false,
        attemptsRemaining: MAX_FAILED_ATTEMPTS,
        lockedUntil: null,
      };
    }
  },

  /**
   * Resets the lockout status for an account
   * @param email The email address to unlock
   */
  async resetLockout(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const docRef = doc(db, COLLECTION, normalizedEmail);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await updateDoc(docRef, {
        failedAttempts: 0,
        lockedUntil: null,
      });
    }
  },

  /**
   * Records a successful login
   * @param email The email that successfully logged in
   */
  async recordSuccessfulLogin(email: string): Promise<void> {
    console.log(`Recording successful login for email: ${email}`);
    const normalizedEmail = email.toLowerCase().trim();
    const docRef = doc(db, COLLECTION, normalizedEmail);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log(`Found lockout record for ${email}, resetting it`);
      await updateDoc(docRef, {
        failedAttempts: 0,
        lastFailedAttempt: null,
        lockedUntil: null,
      });
    } else {
      console.log(`No lockout record exists for ${email}`);
    }
  },
};
