import { collection, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLLECTIONS_TO_BACKUP = [
  "leads",
  "students",
  "courses",
  "instructors",
  "companies",
  "contacts",
  "users",
  "emailTemplates",
  "activityLogs",
];

export const backupService = {
  async createBackup() {
    const backup: Record<string, any> = {};
    const timestamp = Timestamp.now();

    // Collect data from all collections
    for (const collectionName of COLLECTIONS_TO_BACKUP) {
      const querySnapshot = await getDocs(collection(db, collectionName));
      backup[collectionName] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    // Store backup in backups collection
    const backupDoc = {
      timestamp,
      data: backup,
      collections: COLLECTIONS_TO_BACKUP,
    };

    const docRef = await addDoc(collection(db, "backups"), backupDoc);
    return { id: docRef.id, timestamp };
  },

  async getBackups() {
    const querySnapshot = await getDocs(collection(db, "backups"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      timestamp: doc.data().timestamp,
      collections: doc.data().collections,
    }));
  },

  async downloadBackup(backupId: string) {
    const querySnapshot = await getDocs(collection(db, "backups"));
    const backup = querySnapshot.docs.find((doc) => doc.id === backupId);
    if (!backup) throw new Error("Backup not found");

    const data = backup.data();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-${data.timestamp.toDate().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
