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
import CompanyForm from "./CompanyForm";
import CSVImport from "@/components/shared/CSVImport";
import { ExportButton } from "@/components/shared/ExportButton";
import { Company, companiesService } from "@/lib/services/firebase/companies";
import { leadsService } from "@/lib/services/firebase/leads";
import { useToast } from "@/components/ui/use-toast";
import { activityLogsService } from "@/lib/services/firebase/activityLogs";
import { useAuth } from "@/lib/contexts/AuthContext";

const CompaniesTable = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const data = await companiesService.getAll();
      setCompanies(data);
      setFilteredCompanies(data);
    } catch (error) {
      console.error("Error loading companies:", error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: Company["status"]) => {
    const colors = {
      Active: "bg-green-500",
      Inactive: "bg-red-500",
      Prospect: "bg-blue-500",
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

    const sorted = [...filteredCompanies].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setFilteredCompanies(sorted);
  };

  const handleFilter = (searchTerm: string) => {
    const filtered = companies.filter((company) =>
      Object.values(company).some((value) =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
    setFilteredCompanies(filtered);
  };

  const handleSubmit = async (data: Omit<Company, "id">) => {
    try {
      if (editingCompany?.id) {
        await companiesService.update(editingCompany.id, data);
        await activityLogsService.create({
          action: "update",
          entityType: "company",
          entityId: editingCompany.id,
          entityName: data.name,
          userId: user?.uid || "",
          userName: user?.email || "",
        });
        toast({
          title: "Company Updated",
          description: `Successfully updated company ${data.name}`,
        });

        // If status changed to Prospect, create a lead
        if (
          data.status === "Prospect" &&
          editingCompany.status !== "Prospect"
        ) {
          await createLeadFromCompany(data, editingCompany.id);
        }
      } else {
        const newCompany = await companiesService.create(data);
        await activityLogsService.create({
          action: "create",
          entityType: "company",
          entityId: newCompany.id || "",
          entityName: data.name,
          userId: user?.uid || "",
          userName: user?.email || "",
        });
        toast({
          title: "Company Created",
          description: `Successfully created company ${data.name}`,
        });

        // If new company is a Prospect, create a lead
        if (data.status === "Prospect") {
          await createLeadFromCompany(data, newCompany.id);
        }
      }
      loadCompanies();
      setShowForm(false);
      setEditingCompany(null);
    } catch (error) {
      console.error("Error saving company:", error);
      toast({
        title: "Error",
        description: "Failed to save company",
        variant: "destructive",
      });
    }
  };

  // Helper function to create a lead from a company
  const createLeadFromCompany = async (
    companyData: Omit<Company, "id">,
    companyId: string,
  ) => {
    try {
      await leadsService.create({
        name: companyData.name,
        email: "", // This would need to be populated from a contact if available
        status: "New",
        source: "Company Prospect",
        date: new Date().toISOString(),
        type: "Outbound",
        companyId: companyId,
        notes: `Lead automatically created from company ${companyData.name} with Prospect status.`,
        pipeline: "Prospecting",
      });

      toast({
        title: "Lead Created",
        description: `A new lead has been created for ${companyData.name} in the Prospecting column.`,
      });
    } catch (error) {
      console.error("Error creating lead from company:", error);
      toast({
        title: "Warning",
        description: "Company saved but failed to create associated lead.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (company: Company) => {
    if (!company.id) return;
    try {
      await companiesService.delete(company.id);
      await activityLogsService.create({
        action: "delete",
        entityType: "company",
        entityId: company.id,
        entityName: company.name,
        userId: user?.uid || "",
        userName: user?.email || "",
      });
      toast({
        title: "Company Deleted",
        description: `Successfully deleted company ${company.name}`,
      });
      loadCompanies();
    } catch (error) {
      console.error("Error deleting company:", error);
      toast({
        title: "Error",
        description: "Failed to delete company",
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
          Add New Company
        </Button>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search companies..."
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
              data={companies}
              filename="companies-export"
              fields={["name", "industry", "size", "website", "status"]}
            />
            <CSVImport
              entityType="companies"
              onImport={async (data) => {
                for (const item of data) {
                  await companiesService.create({
                    name: item.name,
                    industry: item.industry,
                    size: item.size,
                    website: item.website || "",
                    status: item.status || "Active",
                    contractedCourses: [],
                    customProjects: [],
                  });
                }
                loadCompanies();
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
                className="w-[200px] cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("name")}
              >
                Company Name{" "}
                {sortConfig?.key === "name" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("industry")}
              >
                Industry{" "}
                {sortConfig?.key === "industry" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("size")}
              >
                Size{" "}
                {sortConfig?.key === "size" &&
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
              <TableHead>Contracted Courses</TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompanies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">{company.name}</TableCell>
                <TableCell>{company.industry}</TableCell>
                <TableCell>{company.size}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${getStatusColor(company.status)} text-white`}
                  >
                    {company.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {company.contractedCourses?.join(", ") || "None"}
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
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setEditingCompany(company)}
                        >
                          Edit Company
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(company)}
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

      <CompanyForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
      />

      {editingCompany && (
        <CompanyForm
          isOpen={true}
          onClose={() => setEditingCompany(null)}
          company={editingCompany}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default CompaniesTable;
