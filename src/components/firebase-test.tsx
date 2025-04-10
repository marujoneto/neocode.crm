import { useState } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  writeBatch,
  doc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const FirebaseTest = () => {
  const { toast } = useToast();
  const [testResult, setTestResult] = useState<string>("");

  const initializeCollections = async () => {
    try {
      const collections = [
        "leads",
        "students",
        "courses",
        "instructors",
        "companies",
        "contacts",
        "activityLogs",
      ];

      // Create collections one by one
      for (const collectionName of collections) {
        try {
          // Check if collection exists
          const querySnapshot = await getDocs(collection(db, collectionName));

          // If collection is empty, add a test document
          if (querySnapshot.empty) {
            const testDoc = {
              _test: true,
              timestamp: new Date(),
              name: `Test ${collectionName}`,
              status: "Active",
              email: `test@${collectionName}.com`,
            };

            await addDoc(collection(db, collectionName), testDoc);
            console.log(`Created collection: ${collectionName}`);
          } else {
            console.log(`Collection ${collectionName} already exists`);
          }
        } catch (error) {
          console.error(`Error creating collection ${collectionName}:`, error);
          throw error;
        }
      }

      // Verify all collections
      let verificationResults = [];
      for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db, collectionName));
        verificationResults.push(
          `${collectionName}: ${querySnapshot.size} documents`,
        );
      }

      const resultMessage = `Collections initialized successfully!\n${verificationResults.join(
        "\n",
      )}`;

      setTestResult(resultMessage);
      console.log(resultMessage);

      toast({
        title: "Collections Created",
        description: "All required collections have been initialized.",
      });
    } catch (error: any) {
      const errorMessage = `Error: ${error.message}`;
      setTestResult(errorMessage);
      console.error("Initialization error:", error);
      toast({
        title: "Initialization Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Button onClick={initializeCollections}>Initialize Collections</Button>
      {testResult && (
        <div
          className={`p-4 rounded-md ${testResult.includes("Error") ? "bg-red-100" : "bg-green-100"}`}
        >
          <pre className="whitespace-pre-wrap">{testResult}</pre>
        </div>
      )}
    </div>
  );
};

export default FirebaseTest;
