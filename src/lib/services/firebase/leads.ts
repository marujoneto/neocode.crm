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
  Timestamp,
  getDoc,
  WhereFilterOp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { studentsService } from "./students";
import { companiesService } from "./companies";
import { notificationsService } from "./notifications";
import { SegmentCriteria } from "./marketing";

export interface Lead {
  id?: string;
  name: string;
  email: string;
  status: "New" | "Contacted" | "Qualified" | "Lost" | "Converted";
  source: string;
  date: string;
  type: "Inbound" | "Outbound";
  campaign?: string;
  companyId?: string;
  notes?: string;
  pipeline:
    | "Prospecting"
    | "Initial Contact"
    | "Meeting Scheduled"
    | "Proposal"
    | "Negotiation"
    | "Closed Won"
    | "Closed Lost";
  courseOfInterest?: string;
  selectedCourses?: string[];
  contractName?: string;
  converted?: boolean;
  lastInteractionBy?: string;
  lastInteractionDate?: string;
  nextContactDate?: string;
}

const COLLECTION = "leads";

export const leadsService = {
  async getAll(segmentCriteria?: SegmentCriteria[]) {
    // If no segment criteria provided, return all leads
    if (!segmentCriteria || segmentCriteria.length === 0) {
      const querySnapshot = await getDocs(collection(db, COLLECTION));
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Lead[];
    }

    // Start with a base query
    let q = collection(db, COLLECTION);

    // Apply filters based on segment criteria
    // Note: Firebase has limitations on compound queries
    // For complex filtering, we'll get all leads and filter in memory
    const simpleFilters = segmentCriteria.filter(
      (criteria) =>
        ["equals", "not_equals", "greater_than", "less_than"].includes(
          criteria.operator,
        ) && criteria.field !== "id",
    );

    // Apply simple filters directly to the query if possible
    if (simpleFilters.length > 0) {
      // We can only apply one filter at a time with Firebase
      // So we'll use the first simple filter
      const firstFilter = simpleFilters[0];
      let operator: FirebaseFirestore.WhereFilterOp;

      switch (firstFilter.operator) {
        case "equals":
          operator = "==";
          break;
        case "not_equals":
          operator = "!=";
          break;
        case "greater_than":
          operator = ">";
          break;
        case "less_than":
          operator = "<";
          break;
        default:
          operator = "==";
      }

      q = query(q, where(firstFilter.field, operator, firstFilter.value));
    }

    // Execute the query
    const querySnapshot = await getDocs(q);
    let leads = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Lead[];

    // Apply remaining filters in memory
    if (segmentCriteria.length > (simpleFilters.length > 0 ? 1 : 0)) {
      leads = leads.filter((lead) => {
        return segmentCriteria.every((criteria) => {
          const fieldValue = lead[criteria.field as keyof Lead];

          switch (criteria.operator) {
            case "equals":
              return fieldValue === criteria.value;
            case "not_equals":
              return fieldValue !== criteria.value;
            case "contains":
              return (
                typeof fieldValue === "string" &&
                fieldValue
                  .toLowerCase()
                  .includes(String(criteria.value).toLowerCase())
              );
            case "not_contains":
              return (
                typeof fieldValue === "string" &&
                !fieldValue
                  .toLowerCase()
                  .includes(String(criteria.value).toLowerCase())
              );
            case "greater_than":
              return fieldValue > criteria.value;
            case "less_than":
              return fieldValue < criteria.value;
            case "in":
              return (
                Array.isArray(criteria.value) &&
                criteria.value.includes(fieldValue)
              );
            case "not_in":
              return (
                Array.isArray(criteria.value) &&
                !criteria.value.includes(fieldValue)
              );
            case "exists":
              return fieldValue !== undefined && fieldValue !== null;
            case "not_exists":
              return fieldValue === undefined || fieldValue === null;
            default:
              return true;
          }
        });
      });
    }

    return leads;
  },

  async create(lead: Omit<Lead, "id">) {
    const docRef = await addDoc(collection(db, COLLECTION), lead);

    // Create notifications for admin/manager users when a new lead is created
    try {
      const usersSnapshot = await getDocs(
        query(
          collection(db, "users"),
          where("role", "in", ["Admin", "Manager"]),
        ),
      );

      if (!usersSnapshot.empty) {
        const notifications = usersSnapshot.docs.map((userDoc) => ({
          userId: userDoc.id,
          type: "lead" as const,
          message: `New lead created: ${lead.name}`,
          title: "New Lead",
        }));

        // Create notifications in batch
        await notificationsService.createBatch(notifications);
      }
    } catch (error) {
      console.error("Error creating lead notifications:", error);
    }

    return { id: docRef.id, ...lead };
  },

  async update(id: string, lead: Partial<Lead>) {
    // Get the current lead data before updating
    const leadDoc = await getDoc(doc(db, COLLECTION, id));
    const currentLead = leadDoc.exists() ? (leadDoc.data() as Lead) : null;

    await updateDoc(doc(db, COLLECTION, id), lead);

    // Create notification if status changed to Qualified
    if (
      currentLead &&
      lead.status === "Qualified" &&
      currentLead.status !== "Qualified"
    ) {
      try {
        // Create notification for the lead (using email as identifier)
        if (currentLead.email) {
          // Find user with matching email
          const usersSnapshot = await getDocs(
            query(
              collection(db, "users"),
              where("email", "==", currentLead.email),
            ),
          );

          if (!usersSnapshot.empty) {
            const userId = usersSnapshot.docs[0].id;
            await notificationsService.create({
              userId,
              type: "lead",
              title: "Lead Status Update",
              message: `Your lead status has been updated to Qualified`,
            });
          }
        }
      } catch (error) {
        console.error("Error creating lead qualification notification:", error);
      }
    }

    return { id, ...lead };
  },

  async delete(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  async convertToStudent(leadId: string, courseIds: string[]) {
    const lead = (await this.getById(leadId)) as Lead;
    if (!lead) throw new Error("Lead not found");

    // Get course ID to use (either from courseOfInterest or selectedCourses)
    const courseId = lead.courseOfInterest || courseIds[0] || "";

    // Get course title if we have a course ID
    let courseTitle = "";
    if (courseId) {
      try {
        const courseDoc = await getDoc(doc(db, "courses", courseId));
        if (courseDoc.exists()) {
          courseTitle = courseDoc.data().title || "";
        }
      } catch (error) {
        console.error("Error fetching course title:", error);
      }
    }

    // Create student record
    await studentsService.create({
      name: lead.name,
      email: lead.email,
      status: "Active",
      course: courseId,
      courseTitle: courseTitle,
      enrollmentDate: new Date().toISOString(),
    });

    // Update lead status
    await this.update(leadId, {
      status: "Converted",
      pipeline: "Closed Won",
      selectedCourses: courseIds,
      converted: true,
    });
  },

  async convertToContract(
    leadId: string,
    contractName: string,
    courseIds: string[],
  ) {
    const lead = (await this.getById(leadId)) as Lead;
    if (!lead || !lead.companyId) throw new Error("Lead or company not found");

    // Update company with new contracted courses
    await companiesService.update(lead.companyId, {
      contractedCourses: courseIds,
      status: "Active",
    });

    // Update lead status
    await this.update(leadId, {
      status: "Converted",
      pipeline: "Closed Won",
      selectedCourses: courseIds,
      contractName,
      converted: true,
    });
  },

  async getById(id: string) {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Lead;
    }
    return null;
  },

  async getByStatus(status: Lead["status"]) {
    const q = query(collection(db, COLLECTION), where("status", "==", status));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Lead[];
  },

  async getByPipeline(pipeline: Lead["pipeline"]) {
    const q = query(
      collection(db, COLLECTION),
      where("pipeline", "==", pipeline),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Lead[];
  },

  async getByType(type: Lead["type"]) {
    const q = query(collection(db, COLLECTION), where("type", "==", type));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Lead[];
  },

  async getSorted(field: keyof Lead, direction: "asc" | "desc" = "asc") {
    const q = query(collection(db, COLLECTION), orderBy(field, direction));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Lead[];
  },
};
