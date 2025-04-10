import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { marketingService } from "@/lib/services/firebase/marketing";

interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EmailTemplateEditorProps {
  template?: EmailTemplate;
  onSave?: (template: EmailTemplate) => void;
  onCancel?: () => void;
}

const EmailTemplateEditor: React.FC<EmailTemplateEditorProps> = ({
  template,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(template?.name || "");
  const [subject, setSubject] = useState(template?.subject || "");
  const [body, setBody] = useState(template?.body || "");
  const [category, setCategory] = useState(template?.category || "general");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !subject || !body) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const templateData: EmailTemplate = {
        name,
        subject,
        body,
        category,
      };

      let result;
      if (template?.id) {
        // Update existing template
        result = await marketingService.updateEmailTemplate(
          template.id,
          templateData,
        );
        toast({
          title: "Success",
          description: "Email template updated successfully",
        });
      } else {
        // Create new template
        result = await marketingService.createEmailTemplate(templateData);
        toast({
          title: "Success",
          description: "Email template created successfully",
        });
      }

      if (onSave) {
        onSave(result as EmailTemplate);
      }
    } catch (error) {
      console.error("Error saving email template:", error);
      toast({
        title: "Error",
        description: "Failed to save email template",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {template ? "Edit Email Template" : "Create Email Template"}
        </CardTitle>
        <CardDescription>
          {template
            ? "Update your email template details"
            : "Create a new reusable email template for your campaigns"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Template Name*
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Welcome Email"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="welcome">Welcome</SelectItem>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="promotion">Promotion</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="followup">Follow-up</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              Subject Line*
            </label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Welcome to our platform!"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="body" className="text-sm font-medium">
              Email Body*
            </label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter your email content here..."
              className="min-h-[200px]"
              required
            />
            <p className="text-xs text-gray-500">
              You can use placeholders like {"{name}"}, {"{company}"}, etc.
              which will be replaced with actual values when the email is sent.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium mb-2">Preview</h3>
            <div className="bg-white border rounded-md p-4">
              <div className="text-sm font-medium mb-2">{subject}</div>
              <div className="text-sm whitespace-pre-wrap">{body}</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : template
                ? "Update Template"
                : "Create Template"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default EmailTemplateEditor;
