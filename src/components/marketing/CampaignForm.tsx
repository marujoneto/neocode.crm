import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  CheckIcon,
  XIcon,
  Mail,
  AlertCircle,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  marketingService,
  Campaign,
  CampaignType,
  CampaignStatus,
  Segment,
  SegmentCriteria,
} from "@/lib/services/firebase/marketing";
import { emailSenderService } from "@/lib/services/firebase/emailSender";
import {
  emailTemplatesService,
  EmailTemplate,
} from "@/lib/services/firebase/emailTemplates";
import { useToast } from "@/components/ui/use-toast";
import SegmentBuilder from "./SegmentBuilder";

interface CampaignFormProps {
  campaign?: Campaign;
  onSuccess?: (campaign: Campaign) => void;
  onCancel?: () => void;
}

const campaignSchema = z.object({
  name: z
    .string()
    .min(3, { message: "Campaign name must be at least 3 characters" }),
  description: z.string().optional(),
  type: z.enum([
    "Email",
    "SMS",
    "Social",
    "PaidAds",
    "Event",
    "Webinar",
    "Direct",
    "Multi-channel",
  ]),
  status: z.enum([
    "Draft",
    "Scheduled",
    "Active",
    "Paused",
    "Completed",
    "Cancelled",
  ]),
  target: z
    .object({
      estimatedReach: z.number().optional(),
      segment: z.string().optional(),
    })
    .optional(),
  content: z
    .object({
      subject: z.string().optional(),
      body: z.string().optional(),
      template: z.string().optional(),
    })
    .optional(),
  schedule: z
    .object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      frequency: z.enum(["Once", "Daily", "Weekly", "Monthly"]).optional(),
      sendTime: z.string().optional(),
    })
    .optional(),
  budget: z
    .object({
      total: z.number().optional(),
      currency: z.string().optional(),
    })
    .optional(),
  tags: z.array(z.string()).optional(),
  audience: z
    .object({
      segment: z.string().optional(),
      segmentData: z.any().optional(),
    })
    .optional(),
});

type CampaignFormValues = z.infer<typeof campaignSchema>;

const CampaignForm: React.FC<CampaignFormProps> = ({
  campaign,
  onSuccess,
  onCancel,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState("details");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [currentSegment, setCurrentSegment] = useState<Segment | null>(null);

  const { toast } = useToast();

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: campaign?.name || "",
      description: campaign?.description || "",
      type: campaign?.type || "Email",
      status: campaign?.status || "Draft",
      target: {
        estimatedReach: campaign?.target?.estimatedReach || 0,
        segment: campaign?.target?.segment || "",
      },
      content: {
        subject: campaign?.content?.subject || "",
        body: campaign?.content?.body || "",
        template: campaign?.content?.template || "none",
      },
      schedule: {
        startDate: campaign?.schedule?.startDate || "",
        endDate: campaign?.schedule?.endDate || "",
        frequency: campaign?.schedule?.frequency || "Once",
        sendTime: campaign?.schedule?.sendTime || "",
      },
      budget: {
        total: campaign?.budget?.total || 0,
        currency: campaign?.budget?.currency || "USD",
      },
      tags: campaign?.tags || [],
      audience: {
        segment: campaign?.audience?.segment || "",
        segmentData: campaign?.audience?.segmentData || null,
      },
    },
  });

  useEffect(() => {
    if (campaign?.tags) {
      setTags(campaign.tags);
    }

    // Set current segment if it exists in the campaign
    if (campaign?.audience?.segmentData) {
      setCurrentSegment(campaign.audience.segmentData as Segment);
    }

    // Load email templates
    const loadEmailTemplates = async () => {
      try {
        const templates = await emailTemplatesService.getAll();
        setEmailTemplates(templates);
      } catch (error) {
        console.error("Error loading email templates:", error);
        toast({
          title: "Error",
          description: "Failed to load email templates",
          variant: "destructive",
        });
      }
    };

    loadEmailTemplates();
  }, [campaign, toast]);

  const onSubmit = async (data: CampaignFormValues) => {
    setIsSubmitting(true);
    try {
      // Add tags to the form data
      data.tags = tags;

      // Add segment data to the form data
      if (currentSegment) {
        data.audience = {
          segment: currentSegment.id || "",
          segmentData: currentSegment,
        };
      }

      // Set budget spent to 0 for new campaigns
      if (!campaign) {
        data.budget = {
          ...data.budget,
          spent: 0,
        };
      }

      let result;
      if (campaign?.id) {
        // Update existing campaign
        result = await marketingService.update(campaign.id, data);
        toast({
          title: "Success",
          description: "Campaign updated successfully",
        });
      } else {
        // Create new campaign
        result = await marketingService.create(data as Omit<Campaign, "id">);
        toast({
          title: "Success",
          description: "Campaign created successfully",
        });
      }

      if (onSuccess) {
        onSuccess(result as Campaign);
      }
    } catch (error) {
      console.error("Error saving campaign:", error);
      toast({
        title: "Error",
        description: "Failed to save campaign",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold mb-6">
        {campaign ? "Edit Campaign" : "Create Campaign"}
      </h2>

      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="budget">Budget & Tags</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <TabsContent value="details" className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter campaign name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter campaign description"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Type*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select campaign type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Email">Email</SelectItem>
                          <SelectItem value="SMS">SMS</SelectItem>
                          <SelectItem value="Social">Social Media</SelectItem>
                          <SelectItem value="PaidAds">Paid Ads</SelectItem>
                          <SelectItem value="Event">Event</SelectItem>
                          <SelectItem value="Webinar">Webinar</SelectItem>
                          <SelectItem value="Direct">Direct Mail</SelectItem>
                          <SelectItem value="Multi-channel">
                            Multi-channel
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Scheduled">Scheduled</SelectItem>
                          <SelectItem value="Active">Active</SelectItem>
                          <SelectItem value="Paused">Paused</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="target.estimatedReach"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Reach</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="0"
                        {...field}
                        value={field.value || 0}
                        onChange={(e) => {
                          // Remove all non-digit characters and parse as integer
                          const numericValue = e.target.value.replace(
                            /[^0-9]/g,
                            "",
                          );
                          field.onChange(
                            numericValue ? parseInt(numericValue) : 0,
                          );
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Estimated number of recipients for this campaign (numbers
                      only)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </TabsContent>

            <TabsContent value="audience" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Target Audience</h3>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {currentSegment ? "Segment Selected" : "No Segment"}
                  </Badge>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Define Your Target Audience</AlertTitle>
                  <AlertDescription>
                    Create a segment to target specific leads based on criteria
                    like status, source, or behavior.
                  </AlertDescription>
                </Alert>

                <div className="border rounded-md p-4">
                  <SegmentBuilder
                    initialSegment={currentSegment || undefined}
                    onSave={(segment) => {
                      setCurrentSegment(segment);
                      toast({
                        title: "Segment Saved",
                        description:
                          "Audience segment has been saved to this campaign",
                      });
                    }}
                    showHeader={false}
                  />
                </div>

                {currentSegment && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentSegment(null)}
                    >
                      <XIcon className="h-4 w-4 mr-2" />
                      Clear Segment
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <FormField
                control={form.control}
                name="content.subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Line</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter subject line" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content.body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Body</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter campaign content"
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content.template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Template</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {emailTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select an email template to use for this campaign
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("type") === "Email" && (
                <div className="mt-4">
                  <Dialog
                    open={showTestDialog}
                    onOpenChange={setShowTestDialog}
                  >
                    <DialogTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled={!campaign?.id}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Send Test Email
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Test Email</DialogTitle>
                        <DialogDescription>
                          Send a test email to verify your campaign content
                          before activating.
                        </DialogDescription>
                      </DialogHeader>

                      {testResult && (
                        <Alert
                          variant={
                            testResult.success ? "default" : "destructive"
                          }
                          className="my-4"
                        >
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>
                            {testResult.success ? "Success" : "Error"}
                          </AlertTitle>
                          <AlertDescription>
                            {testResult.message}
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <FormLabel className="text-right">Email</FormLabel>
                          <Input
                            id="test-email"
                            placeholder="recipient@example.com"
                            className="col-span-3"
                            value={testEmailAddress}
                            onChange={(e) =>
                              setTestEmailAddress(e.target.value)
                            }
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          onClick={async () => {
                            if (!campaign?.id) return;
                            setIsSendingTest(true);
                            setTestResult(null);
                            try {
                              const result =
                                await emailSenderService.testCampaignEmail(
                                  campaign.id,
                                  testEmailAddress,
                                );
                              setTestResult({
                                success: result.success,
                                message: result.success
                                  ? "Test email sent successfully!"
                                  : `Failed to send test email: ${result.error}`,
                              });
                            } catch (error) {
                              setTestResult({
                                success: false,
                                message: `Error: ${error instanceof Error ? error.message : String(error)}`,
                              });
                            } finally {
                              setIsSendingTest(false);
                            }
                          }}
                          disabled={isSendingTest || !testEmailAddress}
                        >
                          {isSendingTest ? "Sending..." : "Send Test"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </TabsContent>

            <TabsContent value="scheduling" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="schedule.startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) =>
                              field.onChange(date ? date.toISOString() : "")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="schedule.endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? (
                                format(new Date(field.value), "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) =>
                              field.onChange(date ? date.toISOString() : "")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="schedule.frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Once">Once</SelectItem>
                          <SelectItem value="Daily">Daily</SelectItem>
                          <SelectItem value="Weekly">Weekly</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="schedule.sendTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Send Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>

            <TabsContent value="budget" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="budget.total"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Total</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget.currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                          <SelectItem value="CAD">CAD</SelectItem>
                          <SelectItem value="AUD">AUD</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-2">
                <FormLabel>Tags</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <div
                      key={tag}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md flex items-center gap-1"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-blue-800 hover:text-blue-900"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Add a tag"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Add
                  </Button>
                </div>
              </div>
            </TabsContent>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              {form.watch("status") === "Scheduled" && campaign?.id && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    try {
                      const scheduleData = form.getValues("schedule");
                      await marketingService.scheduleCampaign(
                        campaign.id,
                        scheduleData,
                      );
                      toast({
                        title: "Success",
                        description: "Campaign scheduled successfully",
                      });
                    } catch (error) {
                      console.error("Error scheduling campaign:", error);
                      toast({
                        title: "Error",
                        description:
                          error instanceof Error
                            ? error.message
                            : "Failed to schedule campaign",
                        variant: "destructive",
                      });
                    }
                  }}
                  disabled={isSubmitting}
                >
                  Schedule Campaign
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : campaign
                    ? "Update Campaign"
                    : "Create Campaign"}
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  );
};

export default CampaignForm;
