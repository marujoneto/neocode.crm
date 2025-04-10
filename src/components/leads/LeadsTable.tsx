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
import LeadForm from "./LeadForm";
import CSVImport from "@/components/shared/CSVImport";
import { ExportButton } from "@/components/shared/ExportButton";
import { Lead, leadsService } from "@/lib/services/firebase/leads";
import { useToast } from "@/components/ui/use-toast";
import { activityLogsService } from "@/lib/services/firebase/activityLogs";
import { useAuth } from "@/lib/contexts/AuthContext";

const LeadsTable = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      const data = await leadsService.getAll();
      setLeads(data);
      setFilteredLeads(data);
    } catch (error) {
      console.error("Error loading leads:", error);
      toast({
        title: "Error",
        description: "Failed to load leads",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: Lead["status"]) => {
    const colors = {
      New: "bg-blue-500",
      Contacted: "bg-yellow-500",
      Qualified: "bg-green-500",
      Lost: "bg-red-500",
      Converted: "bg-purple-500",
    };
    return colors[status];
  };

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredLeads].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setFilteredLeads(sorted);
  };

  const handleFilter = (searchTerm: string) => {
    const filtered = leads.filter((lead) =>
      Object.values(lead).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
    setFilteredLeads(filtered);
  };

  const handleSubmit = async (data: Omit<Lead, "id">) => {
    try {
      if (editingLead?.id) {
        await leadsService.update(editingLead.id, data);
        await activityLogsService.create({
          action: "update",
          entityType: "lead",
          entityId: editingLead.id,
          entityName: data.name,
          userId: user?.uid || "",
          userName: user?.email || "",
        });
        toast({
          title: "Lead Updated",
          description: `Successfully updated lead ${data.name}`,
        });
      } else {
        const newLead = await leadsService.create(data);
        await activityLogsService.create({
          action: "create",
          entityType: "lead",
          entityId: newLead.id || "",
          entityName: data.name,
          userId: user?.uid || "",
          userName: user?.email || "",
        });
        toast({
          title: "Lead Created",
          description: `Successfully created lead ${data.name}`,
        });
      }
      loadLeads();
      setShowForm(false);
      setEditingLead(null);
    } catch (error) {
      console.error("Error saving lead:", error);
      toast({
        title: "Error",
        description: "Failed to save lead",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (lead: Lead) => {
    if (!lead.id) return;
    try {
      await leadsService.delete(lead.id);
      await activityLogsService.create({
        action: "delete",
        entityType: "lead",
        entityId: lead.id,
        entityName: lead.name,
        userId: user?.uid || "",
        userName: user?.email || "",
      });
      toast({
        title: "Lead Deleted",
        description: `Successfully deleted lead ${lead.name}`,
      });
      loadLeads();
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({
        title: "Error",
        description: "Failed to delete lead",
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
          Add New Lead
        </Button>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search leads..."
              className="pl-8"
              onChange={(e) => handleFilter(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <ExportButton
              data={leads}
              filename="leads-export"
              fields={[
                "name",
                "email",
                "status",
                "source",
                "date",
                "type",
                "pipeline",
                "courseOfInterest",
                "notes",
              ]}
            />
            <CSVImport
              entityType="leads"
              onImport={async (data) => {
                for (const item of data) {
                  await leadsService.create({
                    name: item.name,
                    email: item.email,
                    status: item.status || "New",
                    source: item.source || "CSV Import",
                    date: item.date || new Date().toISOString(),
                    type: item.type || "Inbound",
                    pipeline: item.pipeline || "Prospecting",
                    notes: item.notes,
                    campaign: item.campaign,
                    companyId: item.companyId,
                    courseOfInterest: item.courseOfInterest,
                  });
                }
                loadLeads();
              }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="w-[180px] cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("name")}
              >
                Name{" "}
                {sortConfig?.key === "name" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("email")}
              >
                Email{" "}
                {sortConfig?.key === "email" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("status")}
              >
                Status{" "}
                {sortConfig?.key === "status" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("source")}
              >
                Source{" "}
                {sortConfig?.key === "source" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("lastInteractionBy")}
              >
                Assigned To{" "}
                {sortConfig?.key === "lastInteractionBy" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("nextContactDate")}
              >
                Next Contact{" "}
                {sortConfig?.key === "nextContactDate" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLeads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>{lead.name}</TableCell>
                <TableCell>{lead.email}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${getStatusColor(lead.status)} text-white`}
                  >
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell>{lead.source}</TableCell>
                <TableCell>{lead.lastInteractionBy || "Unassigned"}</TableCell>
                <TableCell>
                  {lead.nextContactDate ? (
                    <span
                      className={`${new Date(lead.nextContactDate) <= new Date() ? "text-red-500 font-medium" : ""}`}
                    >
                      {new Date(lead.nextContactDate).toLocaleDateString()}
                    </span>
                  ) : (
                    "Not scheduled"
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          window.open(`/leads/detail/${lead.id}`, "_blank")
                        }
                      >
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingLead(lead)}>
                        Edit Lead
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(lead)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <LeadForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
      />

      {editingLead && (
        <LeadForm
          isOpen={true}
          onClose={() => setEditingLead(null)}
          lead={editingLead}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default LeadsTable;
