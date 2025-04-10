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
  getDoc,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notificationsService } from "./notifications";

export type CampaignStatus =
  | "Draft"
  | "Scheduled"
  | "Active"
  | "Paused"
  | "Completed"
  | "Cancelled";

export type CampaignType =
  | "Email"
  | "SMS"
  | "Social"
  | "PaidAds"
  | "Event"
  | "Webinar"
  | "Direct"
  | "Multi-channel";

export type FunnelStage =
  | "Awareness"
  | "Interest"
  | "Consideration"
  | "Intent"
  | "Evaluation"
  | "Purchase";

export interface CampaignMetrics {
  impressions?: number;
  clicks?: number;
  opens?: number;
  responses?: number;
  conversions?: number;
  cost?: number;
  revenue?: number;
  roi?: number;
  ctr?: number;
  conversionRate?: number;
  bounceRate?: number;
  unsubscribes?: number;
}

export interface FunnelStep {
  id: string;
  name: string;
  description?: string;
  type: "Email" | "SMS" | "Notification" | "Task" | "Wait" | "Condition";
  content?: string;
  condition?: string;
  delay?: number; // in hours
  order: number;
  nextSteps?: string[];
  metrics?: {
    sent?: number;
    delivered?: number;
    opened?: number;
    clicked?: number;
    converted?: number;
  };
}

export interface SegmentCriteria {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "greater_than"
    | "less_than"
    | "in"
    | "not_in"
    | "exists"
    | "not_exists";
  value: any;
}

export interface Segment {
  id?: string;
  name: string;
  description?: string;
  criteria: SegmentCriteria[];
  type: "dynamic" | "static";
  leadCount?: number;
  lastUpdated?: string;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Campaign {
  id?: string;
  name: string;
  description?: string;
  type: CampaignType;
  status: CampaignStatus;
  target: {
    segments?: string[];
    segmentDetails?: Segment[];
    filters?: Record<string, any>;
    estimatedReach?: number;
  };
  content?: {
    subject?: string;
    body?: string;
    template?: string;
    assets?: string[];
    previewUrl?: string;
  };
  schedule?: {
    startDate: string;
    endDate?: string;
    frequency?: "Once" | "Daily" | "Weekly" | "Monthly";
    sendTime?: string;
    timezone?: string;
  };
  budget?: {
    total: number;
    spent: number;
    currency: string;
  };
  metrics?: CampaignMetrics;
  funnel?: {
    name: string;
    steps: FunnelStep[];
  };
  abTest?: {
    enabled: boolean;
    variants: {
      id: string;
      name: string;
      content: any;
      allocation: number; // percentage
      metrics?: CampaignMetrics;
    }[];
    winningVariant?: string;
  };
  tags?: string[];
  audience?: {
    segment?: string;
    segmentData?: Segment;
    segmentCriteria?: SegmentCriteria[];
  };
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
  lastSentAt?: string;
  lastError?: string;
}

const COLLECTION = "campaigns";

// Email Template interfaces
export interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  createdAt?: any;
  updatedAt?: any;
}

export const marketingService = {
  async getAll() {
    const querySnapshot = await getDocs(collection(db, COLLECTION));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Campaign[];
  },

  async create(campaign: Omit<Campaign, "id">) {
    const campaignWithTimestamps = {
      ...campaign,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Extract segment criteria from segmentData if it exists
    if (campaign.audience?.segmentData?.criteria) {
      campaignWithTimestamps.audience = {
        ...campaign.audience,
        segmentCriteria: campaign.audience.segmentData.criteria,
      };
    }

    const docRef = await addDoc(
      collection(db, COLLECTION),
      campaignWithTimestamps,
    );

    // Create notifications for admin/manager users when a new campaign is created
    try {
      const usersSnapshot = await getDocs(
        query(
          collection(db, "users"),
          where("role", "in", ["Admin", "Manager", "Marketing"]),
        ),
      );

      if (!usersSnapshot.empty) {
        const notifications = usersSnapshot.docs.map((userDoc) => ({
          userId: userDoc.id,
          type: "campaign" as const,
          message: `New campaign created: ${campaign.name}`,
          title: "New Campaign",
        }));

        // Create notifications in batch
        await notificationsService.createBatch(notifications);
      }
    } catch (error) {
      console.error("Error creating campaign notifications:", error);
    }

    return { id: docRef.id, ...campaign };
  },

  async update(id: string, campaign: Partial<Campaign>) {
    const campaignWithTimestamp = {
      ...campaign,
      updatedAt: serverTimestamp(),
    };

    // Extract segment criteria from segmentData if it exists
    if (campaign.audience?.segmentData?.criteria) {
      campaignWithTimestamp.audience = {
        ...campaign.audience,
        segmentCriteria: campaign.audience.segmentData.criteria,
      };
    }

    await updateDoc(doc(db, COLLECTION, id), campaignWithTimestamp);
    return { id, ...campaign };
  },

  async delete(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
  },

  async getById(id: string) {
    const docRef = doc(db, COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Campaign;
    }
    return null;
  },

  async getByStatus(status: CampaignStatus) {
    const q = query(collection(db, COLLECTION), where("status", "==", status));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Campaign[];
  },

  async getByType(type: CampaignType) {
    const q = query(collection(db, COLLECTION), where("type", "==", type));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Campaign[];
  },

  async getSorted(field: keyof Campaign, direction: "asc" | "desc" = "asc") {
    const q = query(collection(db, COLLECTION), orderBy(field, direction));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Campaign[];
  },

  async updateMetrics(id: string, metrics: Partial<CampaignMetrics>) {
    const campaign = await this.getById(id);
    if (!campaign) throw new Error("Campaign not found");

    const updatedMetrics = {
      ...campaign.metrics,
      ...metrics,
    };

    await this.update(id, { metrics: updatedMetrics });
    return updatedMetrics;
  },

  async addFunnelStep(campaignId: string, step: Omit<FunnelStep, "id">) {
    const campaign = await this.getById(campaignId);
    if (!campaign) throw new Error("Campaign not found");

    if (!campaign.funnel) {
      campaign.funnel = {
        name: "Default Funnel",
        steps: [],
      };
    }

    const stepId = Math.random().toString(36).substring(2, 15);
    const newStep = { ...step, id: stepId };

    campaign.funnel.steps.push(newStep);

    await this.update(campaignId, { funnel: campaign.funnel });
    return newStep;
  },

  async updateFunnelStep(
    campaignId: string,
    stepId: string,
    updates: Partial<FunnelStep>,
  ) {
    const campaign = await this.getById(campaignId);
    if (!campaign || !campaign.funnel)
      throw new Error("Campaign or funnel not found");

    const stepIndex = campaign.funnel.steps.findIndex(
      (step) => step.id === stepId,
    );
    if (stepIndex === -1) throw new Error("Funnel step not found");

    campaign.funnel.steps[stepIndex] = {
      ...campaign.funnel.steps[stepIndex],
      ...updates,
    };

    await this.update(campaignId, { funnel: campaign.funnel });
    return campaign.funnel.steps[stepIndex];
  },

  async deleteFunnelStep(campaignId: string, stepId: string) {
    const campaign = await this.getById(campaignId);
    if (!campaign || !campaign.funnel)
      throw new Error("Campaign or funnel not found");

    campaign.funnel.steps = campaign.funnel.steps.filter(
      (step) => step.id !== stepId,
    );

    await this.update(campaignId, { funnel: campaign.funnel });
  },

  async createABTestVariant(
    campaignId: string,
    variant: Omit<Campaign["abTest"]["variants"][0], "id">,
  ) {
    const campaign = await this.getById(campaignId);
    if (!campaign) throw new Error("Campaign not found");

    if (!campaign.abTest) {
      campaign.abTest = {
        enabled: true,
        variants: [],
      };
    }

    const variantId = Math.random().toString(36).substring(2, 15);
    const newVariant = { ...variant, id: variantId };

    campaign.abTest.variants.push(newVariant);

    await this.update(campaignId, { abTest: campaign.abTest });
    return newVariant;
  },

  async updateABTest(campaignId: string, abTestData: Campaign["abTest"]) {
    const campaign = await this.getById(campaignId);
    if (!campaign) throw new Error("Campaign not found");

    await this.update(campaignId, { abTest: abTestData });
    return abTestData;
  },

  async getABTestResults(campaignId: string) {
    const campaign = await this.getById(campaignId);
    if (!campaign || !campaign.abTest) {
      throw new Error("Campaign or A/B test not found");
    }

    return campaign.abTest;
  },

  async declareABTestWinner(campaignId: string, variantId: string) {
    const campaign = await this.getById(campaignId);
    if (!campaign || !campaign.abTest) {
      throw new Error("Campaign or A/B test not found");
    }

    // Verify the variant exists
    const variantExists = campaign.abTest.variants.some(
      (v) => v.id === variantId,
    );
    if (!variantExists) {
      throw new Error("Variant not found");
    }

    campaign.abTest.winningVariant = variantId;
    await this.update(campaignId, { abTest: campaign.abTest });

    return campaign.abTest;
  },

  async updateCampaignStatus(id: string, status: CampaignStatus) {
    await this.update(id, { status });

    // If campaign is being activated manually, record the last sent time and trigger email sending
    if (status === "Active") {
      await this.update(id, { lastSentAt: new Date().toISOString() });

      // Import dynamically to avoid circular dependency
      const { emailSenderService } = await import("./emailSender");
      try {
        // For email campaigns, trigger sending
        const campaign = await this.getById(id);
        if (campaign && campaign.type === "Email") {
          // Get leads based on segment criteria if available
          let targetLeads = [];
          const { leadsService } = await import("./leads");

          if (
            campaign.audience?.segmentCriteria &&
            campaign.audience.segmentCriteria.length > 0
          ) {
            targetLeads = await leadsService.getAll(
              campaign.audience.segmentCriteria,
            );
          } else {
            targetLeads = await leadsService.getAll();
          }

          const result = await emailSenderService.sendCampaignEmails(
            id,
            targetLeads,
          );
          if (!result.success) {
            console.error("Failed to send campaign emails:", result.error);
            // Update campaign with error status
            await this.update(id, {
              status: "Paused",
              lastError: result.error,
            });
            return { id, status: "Paused", error: result.error };
          }
        }
      } catch (error) {
        console.error("Error processing campaign activation:", error);
        // Update campaign with error status
        await this.update(id, {
          status: "Paused",
          lastError: error instanceof Error ? error.message : String(error),
        });
        return { id, status: "Paused", error };
      }
    }

    return { id, status };
  },

  async scheduleCampaign(id: string, scheduleData: Campaign["schedule"]) {
    if (!scheduleData || !scheduleData.startDate || !scheduleData.sendTime) {
      throw new Error("Schedule must include startDate and sendTime");
    }

    // Validate schedule data
    const startDate = new Date(scheduleData.startDate);
    if (isNaN(startDate.getTime())) {
      throw new Error("Invalid start date format");
    }

    if (scheduleData.endDate) {
      const endDate = new Date(scheduleData.endDate);
      if (isNaN(endDate.getTime())) {
        throw new Error("Invalid end date format");
      }

      if (endDate < startDate) {
        throw new Error("End date cannot be before start date");
      }
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(scheduleData.sendTime)) {
      throw new Error("Invalid time format. Use HH:MM format (24-hour)");
    }

    // Update campaign with schedule and set status to Scheduled
    await this.update(id, {
      schedule: scheduleData,
      status: "Scheduled" as CampaignStatus,
    });

    return { id, schedule: scheduleData, status: "Scheduled" };
  },

  async getCampaignsByTag(tag: string) {
    const q = query(
      collection(db, COLLECTION),
      where("tags", "array-contains", tag),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Campaign[];
  },

  async getCampaignsByDateRange(startDate: string, endDate: string) {
    const q = query(
      collection(db, COLLECTION),
      where("schedule.startDate", ">=", startDate),
      where("schedule.startDate", "<=", endDate),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Campaign[];
  },

  async duplicateCampaign(id: string, newName?: string) {
    const campaign = await this.getById(id);
    if (!campaign) throw new Error("Campaign not found");

    const { id: _, ...campaignData } = campaign;

    const duplicatedCampaign = {
      ...campaignData,
      name: newName || `${campaign.name} (Copy)`,
      status: "Draft" as CampaignStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    return this.create(duplicatedCampaign);
  },

  // Email Templates Methods
  async getAllEmailTemplates() {
    const querySnapshot = await getDocs(collection(db, "emailTemplates"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EmailTemplate[];
  },

  async getEmailTemplateById(id: string) {
    const docRef = doc(db, "emailTemplates", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as EmailTemplate;
    }
    return null;
  },

  async createEmailTemplate(template: Omit<EmailTemplate, "id">) {
    const templateWithTimestamps = {
      ...template,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, "emailTemplates"),
      templateWithTimestamps,
    );

    return { id: docRef.id, ...template };
  },

  async updateEmailTemplate(id: string, template: Partial<EmailTemplate>) {
    const templateWithTimestamp = {
      ...template,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, "emailTemplates", id), templateWithTimestamp);
    return { id, ...template };
  },

  async deleteEmailTemplate(id: string) {
    await deleteDoc(doc(db, "emailTemplates", id));
  },

  async duplicateEmailTemplate(id: string, newName?: string) {
    const template = await this.getEmailTemplateById(id);
    if (!template) throw new Error("Email template not found");

    const { id: _, ...templateData } = template;

    const duplicatedTemplate = {
      ...templateData,
      name: newName || `${template.name} (Copy)`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    return this.createEmailTemplate(duplicatedTemplate);
  },

  async getEmailTemplatesByCategory(category: string) {
    const q = query(
      collection(db, "emailTemplates"),
      where("category", "==", category),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as EmailTemplate[];
  },

  async searchEmailTemplates(searchTerm: string) {
    // Firebase doesn't support text search natively, so we'll fetch all and filter
    const templates = await this.getAllEmailTemplates();
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.body.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  },

  // Campaign methods continued
};
