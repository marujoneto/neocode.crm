import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmailTemplate } from "@/lib/services/firebase/emailTemplates";

interface EmailTemplateFormProps {
  isOpen: boolean;
  onClose: () => void;
  template?: EmailTemplate;
  onSubmit: (
    data: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">,
  ) => void;
}

const EmailTemplateForm = ({
  isOpen,
  onClose,
  template,
  onSubmit,
}: EmailTemplateFormProps) => {
  const [formData, setFormData] = useState(
    template || {
      name: "",
      subject: "",
      body: "",
      type: "custom" as const,
      variables: [],
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleVariablesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const variables = e.target.value.split(",").map((v) => v.trim());
    setFormData({ ...formData, variables });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {template ? "Edit Template" : "Create New Template"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: EmailTemplate["type"]) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="variables">Variables (comma-separated)</Label>
            <Input
              id="variables"
              value={formData.variables.join(", ")}
              onChange={handleVariablesChange}
              placeholder="name, email, course_name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Email Body</Label>
            <Textarea
              id="body"
              value={formData.body}
              onChange={(e) =>
                setFormData({ ...formData, body: e.target.value })
              }
              className="min-h-[200px] font-mono"
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{template ? "Update" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmailTemplateForm;
