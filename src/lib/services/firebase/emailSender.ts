import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { EmailTemplate } from "./emailTemplates";
import { Campaign } from "./marketing";

export interface EmailSendingParams {
  to: string | string[];
  subject: string;
  body: string;
  templateId?: string;
  campaignId?: string;
  variables?: Record<string, string>;
}

export interface EmailSendingResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const emailSenderService = {
  async sendEmail(params: EmailSendingParams): Promise<EmailSendingResult> {
    try {
      const sendEmailFn = httpsCallable(functions, "sendEmail");
      const result = await sendEmailFn(params);
      return result.data as EmailSendingResult;
    } catch (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  async sendCampaignEmails(campaignId: string): Promise<EmailSendingResult> {
    try {
      const sendCampaignFn = httpsCallable(functions, "sendCampaignEmails");
      const result = await sendCampaignFn({ campaignId });
      return result.data as EmailSendingResult;
    } catch (error) {
      console.error("Error sending campaign emails:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },

  async previewTemplate(
    templateId: string,
    variables?: Record<string, string>,
  ): Promise<string> {
    try {
      const previewTemplateFn = httpsCallable(functions, "previewTemplate");
      const result = await previewTemplateFn({ templateId, variables });
      return (result.data as { html: string }).html;
    } catch (error) {
      console.error("Error previewing template:", error);
      throw error;
    }
  },

  async testCampaignEmail(
    campaignId: string,
    testEmail: string,
  ): Promise<EmailSendingResult> {
    try {
      const testCampaignFn = httpsCallable(functions, "testCampaignEmail");
      const result = await testCampaignFn({ campaignId, testEmail });
      return result.data as EmailSendingResult;
    } catch (error) {
      console.error("Error sending test campaign email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
};
