import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Filter, MoreVertical, Plus } from "lucide-react";
import EmailTemplateForm from "./EmailTemplateForm";
import {
  EmailTemplate,
  emailTemplatesService,
} from "@/lib/services/firebase/emailTemplates";
import { useToast } from "@/components/ui/use-toast";

const EmailTemplatesTable = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<EmailTemplate[]>(
    [],
  );
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(
    null,
  );

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await emailTemplatesService.getAll();
      setTemplates(data);
      setFilteredTemplates(data);
    } catch (error) {
      console.error("Error loading templates:", error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
    }
  };

  const handleFilter = (searchTerm: string) => {
    const filtered = templates.filter((template) =>
      Object.values(template).some((value) =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
    setFilteredTemplates(filtered);
  };

  const handleSubmit = async (
    data: Omit<EmailTemplate, "id" | "createdAt" | "updatedAt">,
  ) => {
    try {
      if (editingTemplate?.id) {
        await emailTemplatesService.update(editingTemplate.id, data);
        toast({
          title: "Template Updated",
          description: `Successfully updated template ${data.name}`,
        });
      } else {
        await emailTemplatesService.create(data);
        toast({
          title: "Template Created",
          description: `Successfully created template ${data.name}`,
        });
      }
      loadTemplates();
      setShowForm(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save template",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (template: EmailTemplate) => {
    if (!template.id) return;
    try {
      await emailTemplatesService.delete(template.id);
      toast({
        title: "Template Deleted",
        description: `Successfully deleted template ${template.name}`,
      });
      loadTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Template
        </Button>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search templates..."
              className="pl-8"
              onChange={(e) => handleFilter(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Variables</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTemplates.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${template.type === "custom" ? "bg-gray-500" : "bg-blue-500"} text-white`}
                  >
                    {template.type}
                  </Badge>
                </TableCell>
                <TableCell>{template.subject}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {template.variables.map((variable) => (
                      <Badge key={variable} variant="outline">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(template.updatedAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditingTemplate(template)}
                        >
                          Edit Template
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(template)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EmailTemplateForm
        isOpen={showForm || !!editingTemplate}
        onClose={() => {
          setShowForm(false);
          setEditingTemplate(null);
        }}
        template={editingTemplate || undefined}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default EmailTemplatesTable;
