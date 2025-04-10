import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";
import { onUserDeleted, createAuthUser } from "./users";
import { parseTemplate } from "./emailUtils";

admin.initializeApp();

// Configure nodemailer with your email service (e.g., Gmail)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

interface DigestData {
  newLeads: number;
  qualifiedLeads: number;
  newStudents: number;
  completedCourses: number;
  upcomingCourses: number;
  recentActivities: Array<{
    action: string;
    entityType: string;
    entityName: string;
    timestamp: admin.firestore.Timestamp;
  }>;
}

const generateDigestEmail = (data: DigestData, userName: string) => {
  return `
    <h1>Daily Digest for ${userName}</h1>
    <p>Here's your daily summary of activities:</p>
    
    <h2>Key Metrics</h2>
    <ul>
      <li>New Leads: ${data.newLeads}</li>
      <li>Qualified Leads: ${data.qualifiedLeads}</li>
      <li>New Students: ${data.newStudents}</li>
      <li>Completed Courses: ${data.completedCourses}</li>
      <li>Upcoming Courses: ${data.upcomingCourses}</li>
    </ul>

    <h2>Recent Activities</h2>
    <ul>
      ${data.recentActivities
        .map(
          (activity) =>
            `<li>${activity.action} ${activity.entityType} - ${activity.entityName}</li>`,
        )
        .join("")}
    </ul>
  `;
};

// Send welcome email when a new user is created
export const sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {
  const mailOptions = {
    from: "Your CRM <noreply@yourcrm.com>",
    to: user.email,
    subject: "Welcome to CRM",
    html: `<h1>Welcome to our CRM!</h1>
          <p>Thank you for joining. We're excited to have you on board.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully");
  } catch (error) {
    console.error("Error sending welcome email:", error);
  }
});

// Send notification when a new lead is created
export const onNewLead = functions.firestore
  .document("leads/{leadId}")
  .onCreate(async (snap, context) => {
    const lead = snap.data();

    // Get all users with admin or manager role
    const usersSnapshot = await admin
      .firestore()
      .collection("users")
      .where("role", "in", ["Admin", "Manager"])
      .get();

    const notifications = usersSnapshot.docs.map((doc) => ({
      userId: doc.id,
      message: `New lead created: ${lead.name}`,
      type: "lead",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false,
    }));

    // Create notifications in batch
    const batch = admin.firestore().batch();
    notifications.forEach((notification) => {
      const notificationRef = admin
        .firestore()
        .collection("notifications")
        .doc();
      batch.set(notificationRef, notification);
    });

    await batch.commit();
  });

// Send email when lead status changes to Qualified
export const onLeadQualified = functions.firestore
  .document("leads/{leadId}")
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const previousData = change.before.data();

    if (newData.status === "Qualified" && previousData.status !== "Qualified") {
      const mailOptions = {
        from: "Your CRM <noreply@yourcrm.com>",
        to: newData.email,
        subject: "Welcome to Our Program",
        html: `<h1>Congratulations!</h1>
              <p>Your application has been qualified. Our team will contact you shortly.</p>`,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log("Qualification email sent successfully");
      } catch (error) {
        console.error("Error sending qualification email:", error);
      }
    }
  });

// Schedule and send campaigns based on their schedule
export const scheduleCampaigns = functions.pubsub
  .schedule("every 1 hours")
  .timeZone("America/New_York")
  .onRun(async (context) => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Format current date as ISO string (YYYY-MM-DD)
      const today = now.toISOString().split("T")[0];

      // Get all scheduled campaigns that should run today
      const campaignsSnapshot = await admin
        .firestore()
        .collection("campaigns")
        .where("status", "==", "Scheduled")
        .where("schedule.startDate", "<=", today)
        .get();

      if (campaignsSnapshot.empty) {
        console.log("No scheduled campaigns to run at this time");
        return null;
      }

      const campaignsToRun = [];

      // Filter campaigns that should run at this hour
      for (const doc of campaignsSnapshot.docs) {
        const campaign = doc.data();

        // Skip if end date is defined and today is after end date
        if (campaign.schedule?.endDate && today > campaign.schedule.endDate) {
          continue;
        }

        // Check if campaign should run at this time
        if (campaign.schedule?.sendTime) {
          const [scheduledHour, scheduledMinute] = campaign.schedule.sendTime
            .split(":")
            .map(Number);

          // Only process campaigns scheduled for the current hour
          // We check within a 5-minute window to account for function execution delays
          if (
            scheduledHour === currentHour &&
            Math.abs(scheduledMinute - currentMinute) <= 5
          ) {
            // Check frequency (daily, weekly, monthly)
            let shouldRun = false;
            const lastRun = campaign.lastSentAt
              ? new Date(campaign.lastSentAt)
              : null;

            if (!lastRun) {
              shouldRun = true;
            } else {
              const daysSinceLastRun = Math.floor(
                (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60 * 24),
              );

              switch (campaign.schedule.frequency) {
                case "Once":
                  shouldRun = !campaign.lastSentAt; // Run only if never sent before
                  break;
                case "Daily":
                  shouldRun = daysSinceLastRun >= 1;
                  break;
                case "Weekly":
                  shouldRun = daysSinceLastRun >= 7;
                  break;
                case "Monthly":
                  shouldRun = daysSinceLastRun >= 30;
                  break;
                default:
                  shouldRun = false;
              }
            }

            if (shouldRun) {
              campaignsToRun.push({
                id: doc.id,
                ...campaign,
              });
            }
          }
        }
      }

      // Process campaigns that should run now
      const results = [];
      for (const campaign of campaignsToRun) {
        try {
          // Update campaign status to Active
          await admin
            .firestore()
            .collection("campaigns")
            .doc(campaign.id)
            .update({
              status: "Active",
              lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
            });

          // For email campaigns, trigger sending
          if (campaign.type === "Email") {
            // Send the campaign emails
            const result = await sendCampaignEmails(
              {
                campaignId: campaign.id,
              },
              { auth: true },
            );

            results.push({
              campaignId: campaign.id,
              name: campaign.name,
              result,
            });
          }

          // After processing, update status back to Scheduled for recurring campaigns
          // or to Completed for one-time campaigns
          if (campaign.schedule.frequency === "Once") {
            await admin
              .firestore()
              .collection("campaigns")
              .doc(campaign.id)
              .update({
                status: "Completed",
              });
          } else {
            await admin
              .firestore()
              .collection("campaigns")
              .doc(campaign.id)
              .update({
                status: "Scheduled",
              });
          }
        } catch (error) {
          console.error(`Error processing campaign ${campaign.id}:`, error);

          // Update campaign with error status
          await admin
            .firestore()
            .collection("campaigns")
            .doc(campaign.id)
            .update({
              status: "Paused",
              lastError: error instanceof Error ? error.message : String(error),
            });

          results.push({
            campaignId: campaign.id,
            name: campaign.name,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      console.log(
        `Processed ${campaignsToRun.length} scheduled campaigns:`,
        results,
      );
      return results;
    } catch (error) {
      console.error("Error in scheduleCampaigns function:", error);
      return null;
    }
  });

// Send daily digest emails
// Export user management functions
export { onUserDeleted, createAuthUser };

export const sendDailyDigest = functions.pubsub
  .schedule("0 8 * * *") // Run at 8 AM every day
  .timeZone("America/New_York")
  .onRun(async (context) => {
    try {
      // Get all users who have enabled digest emails
      const usersSnapshot = await admin
        .firestore()
        .collection("users")
        .where("emailPreferences.digest", "==", true)
        .get();

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStart = admin.firestore.Timestamp.fromDate(yesterday);

      // Get digest data
      const [leads, students, courses, activities] = await Promise.all([
        admin
          .firestore()
          .collection("leads")
          .where("date", ">", yesterdayStart)
          .get(),
        admin
          .firestore()
          .collection("students")
          .where("enrollmentDate", ">", yesterdayStart)
          .get(),
        admin.firestore().collection("courses").get(),
        admin
          .firestore()
          .collection("activityLogs")
          .where("timestamp", ">", yesterdayStart)
          .orderBy("timestamp", "desc")
          .limit(10)
          .get(),
      ]);

      const qualifiedLeads = leads.docs.filter(
        (doc) => doc.data().status === "Qualified",
      ).length;

      const completedCourses = courses.docs.filter(
        (doc) => doc.data().status === "Completed",
      ).length;

      const upcomingCourses = courses.docs.filter(
        (doc) => doc.data().status === "Upcoming",
      ).length;

      const digestData: DigestData = {
        newLeads: leads.size,
        qualifiedLeads,
        newStudents: students.size,
        completedCourses,
        upcomingCourses,
        recentActivities: activities.docs.map((doc) => doc.data()),
      };

      // Send digest emails to each user
      const emailPromises = usersSnapshot.docs.map(async (userDoc) => {
        const userData = userDoc.data();
        const mailOptions = {
          from: "Your CRM <noreply@yourcrm.com>",
          to: userData.email,
          subject: "Your Daily CRM Digest",
          html: generateDigestEmail(digestData, userData.displayName),
        };

        return transporter.sendMail(mailOptions);
      });

      await Promise.all(emailPromises);
      console.log(`Sent ${emailPromises.length} digest emails`);
    } catch (error) {
      console.error("Error sending digest emails:", error);
    }
  });

// Send email for a specific campaign
export const sendCampaignEmails = functions.https.onCall(
  async (data, context) => {
    // Check if the caller is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated",
      );
    }

    const { campaignId } = data;
    if (!campaignId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Campaign ID is required",
      );
    }

    try {
      // Get the campaign data
      const campaignDoc = await admin
        .firestore()
        .collection("campaigns")
        .doc(campaignId)
        .get();

      if (!campaignDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Campaign not found");
      }

      const campaign = campaignDoc.data();
      if (campaign?.type !== "Email") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Campaign is not an email campaign",
        );
      }

      // Get the email template if specified
      let emailSubject = campaign.content?.subject || "";
      let emailBody = campaign.content?.body || "";
      let templateVariables: string[] = [];

      if (campaign.content?.template && campaign.content.template !== "none") {
        const templateDoc = await admin
          .firestore()
          .collection("emailTemplates")
          .doc(campaign.content.template)
          .get();

        if (templateDoc.exists) {
          const template = templateDoc.data();
          emailSubject = template?.subject || emailSubject;
          emailBody = template?.body || emailBody;
          templateVariables = template?.variables || [];
        }
      }

      // TODO: In a real implementation, you would:
      // 1. Get the list of recipients based on campaign target settings
      // 2. Send emails in batches to avoid rate limits
      // 3. Track delivery status and update campaign metrics

      // For now, we'll just return success
      return { success: true, messageId: `campaign-${campaignId}` };
    } catch (error) {
      console.error("Error sending campaign emails:", error);
      throw new functions.https.HttpsError(
        "internal",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
  },
);

// Send a test email for a campaign
export const testCampaignEmail = functions.https.onCall(
  async (data, context) => {
    // Check if the caller is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated",
      );
    }

    const { campaignId, testEmail } = data;
    if (!campaignId || !testEmail) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Campaign ID and test email are required",
      );
    }

    try {
      // Get the campaign data
      const campaignDoc = await admin
        .firestore()
        .collection("campaigns")
        .doc(campaignId)
        .get();

      if (!campaignDoc.exists) {
        throw new functions.https.HttpsError("not-found", "Campaign not found");
      }

      const campaign = campaignDoc.data();
      if (campaign?.type !== "Email") {
        throw new functions.https.HttpsError(
          "failed-precondition",
          "Campaign is not an email campaign",
        );
      }

      // Get the email template if specified
      let emailSubject = campaign.content?.subject || "";
      let emailBody = campaign.content?.body || "";
      let templateVariables: string[] = [];

      if (campaign.content?.template && campaign.content.template !== "none") {
        const templateDoc = await admin
          .firestore()
          .collection("emailTemplates")
          .doc(campaign.content.template)
          .get();

        if (templateDoc.exists) {
          const template = templateDoc.data();
          emailSubject = template?.subject || emailSubject;
          emailBody = template?.body || emailBody;
          templateVariables = template?.variables || [];
        }
      }

      // Send the test email
      const mailOptions = {
        from: "Your CRM <noreply@yourcrm.com>",
        to: testEmail,
        subject: `[TEST] ${emailSubject}`,
        html: emailBody,
      };

      await transporter.sendMail(mailOptions);
      return { success: true, messageId: `test-${campaignId}` };
    } catch (error) {
      console.error("Error sending test email:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
);

// Preview an email template with sample data
export const previewTemplate = functions.https.onCall(async (data, context) => {
  // Check if the caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated",
    );
  }

  const { templateId, variables } = data;
  if (!templateId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Template ID is required",
    );
  }

  try {
    // Get the template
    const templateDoc = await admin
      .firestore()
      .collection("emailTemplates")
      .doc(templateId)
      .get();

    if (!templateDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Template not found");
    }

    const template = templateDoc.data();
    const parsedBody = parseTemplate(template?.body || "", variables || {});

    return { html: parsedBody };
  } catch (error) {
    console.error("Error previewing template:", error);
    throw new functions.https.HttpsError(
      "internal",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
});

// Send a single email
export const sendEmail = functions.https.onCall(async (data, context) => {
  // Check if the caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated",
    );
  }

  const { to, subject, body, templateId, variables } = data;
  if (!to || (!body && !templateId)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Recipient, and either body or templateId are required",
    );
  }

  try {
    let emailSubject = subject || "";
    let emailBody = body || "";

    // If templateId is provided, use the template
    if (templateId) {
      const templateDoc = await admin
        .firestore()
        .collection("emailTemplates")
        .doc(templateId)
        .get();

      if (templateDoc.exists) {
        const template = templateDoc.data();
        emailSubject = subject || template?.subject || "";
        emailBody = parseTemplate(template?.body || "", variables || {});
      }
    }

    // Send the email
    const mailOptions = {
      from: "Your CRM <noreply@yourcrm.com>",
      to: Array.isArray(to) ? to.join(",") : to,
      subject: emailSubject,
      html: emailBody,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Send announcement notifications
export const sendAnnouncement = functions.https.onCall(
  async (data, context) => {
    // Check if the caller is authenticated and has admin role
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated",
      );
    }

    const userDoc = await admin
      .firestore()
      .collection("users")
      .doc(context.auth.uid)
      .get();

    if (!userDoc.exists || userDoc.data()?.role !== "Admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "User must be an admin",
      );
    }

    const { title, message, recipients } = data;

    // Create announcement
    const announcementRef = await admin
      .firestore()
      .collection("announcements")
      .add({
        title,
        message,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: context.auth.uid,
      });

    // Create notifications for all users or specific recipients
    const usersQuery = recipients
      ? admin.firestore().collection("users").where("role", "in", recipients)
      : admin.firestore().collection("users");

    const usersSnapshot = await usersQuery.get();

    const batch = admin.firestore().batch();
    usersSnapshot.docs.forEach((doc) => {
      const notificationRef = admin
        .firestore()
        .collection("notifications")
        .doc();
      batch.set(notificationRef, {
        userId: doc.id,
        type: "announcement",
        title,
        message,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
        announcementId: announcementRef.id,
      });
    });

    await batch.commit();

    return { success: true, announcementId: announcementRef.id };
  },
);
