import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  CopyIcon,
  TrashIcon,
  EditIcon,
  EyeIcon,
} from "lucide-react";
import { marketingService } from "@/lib/services/firebase/marketing";
import { format } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EmailTemplatesTableProps {
  onCreateTemplate?: () => void;
  onEditTemplate?: (template: EmailTemplate) => void;
}

const EmailTemplatesTable: React.FC<EmailTemplatesTableProps> = ({
  onCreateTemplate,
  onEditTemplate,
}) => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(
    null,
  );

  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await marketingService.getAllEmailTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching email templates:", error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (template: EmailTemplate) => {
    try {
      await marketingService.duplicateEmailTemplate(template.id!);
      toast({
        title: "Success",
        description: "Email template duplicated successfully",
      });
      fetchTemplates();
    } catch (error) {
      console.error("Error duplicating email template:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate email template",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await marketingService.deleteEmailTemplate(id);
      toast({
        title: "Success",
        description: "Email template deleted successfully",
      });
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting email template:", error);
      toast({
        title: "Error",
        description: "Failed to delete email template",
        variant: "destructive",
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "welcome":
        return "bg-green-100 text-green-800";
      case "newsletter":
        return "bg-blue-100 text-blue-800";
      case "promotion":
        return "bg-purple-100 text-purple-800";
      case "event":
        return "bg-amber-100 text-amber-800";
      case "followup":
        return "bg-indigo-100 text-indigo-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !filterCategory || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Email Templates</h2>
        <Button onClick={onCreateTemplate}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search templates..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant={filterCategory === "" ? "default" : "outline"}
            className="text-xs h-8"
            onClick={() => setFilterCategory("")}
          >
            All
          </Button>
          <Button
            variant={filterCategory === "welcome" ? "default" : "outline"}
            className="text-xs h-8"
            onClick={() => setFilterCategory("welcome")}
          >
            Welcome
          </Button>
          <Button
            variant={filterCategory === "newsletter" ? "default" : "outline"}
            className="text-xs h-8"
            onClick={() => setFilterCategory("newsletter")}
          >
            Newsletter
          </Button>
          <Button
            variant={filterCategory === "promotion" ? "default" : "outline"}
            className="text-xs h-8"
            onClick={() => setFilterCategory("promotion")}
          >
            Promotion
          </Button>
          <Button variant="outline" onClick={() => fetchTemplates()}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Template Name</TableHead>
              <TableHead className="w-[100px]">Category</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead className="w-[150px]">Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  Loading templates...
                </TableCell>
              </TableRow>
            ) : filteredTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  No templates found. Create your first template!
                </TableCell>
              </TableRow>
            ) : (
              filteredTemplates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category.charAt(0).toUpperCase() +
                        template.category.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="truncate max-w-[300px]">
                    {template.subject}
                  </TableCell>
                  <TableCell>
                    {template.updatedAt
                      ? format(new Date(template.updatedAt), "MMM d, yyyy")
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => setPreviewTemplate(template)}
                        >
                          <EyeIcon className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEditTemplate?.(template)}
                        >
                          <EditIcon className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicate(template)}
                        >
                          <CopyIcon className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDelete(template.id!)}
                          className="text-red-600"
                        >
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!previewTemplate}
        onOpenChange={() => setPreviewTemplate(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              Category:{" "}
              {previewTemplate?.category.charAt(0).toUpperCase() +
                previewTemplate?.category.slice(1)}
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-md p-4 space-y-2">
            <div className="font-medium">{previewTemplate?.subject}</div>
            <div className="whitespace-pre-wrap text-sm">
              {previewTemplate?.body}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EmailTemplatesTable;
