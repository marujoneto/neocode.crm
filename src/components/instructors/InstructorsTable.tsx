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
import InstructorForm from "./InstructorForm";
import {
  Instructor,
  instructorsService,
} from "@/lib/services/firebase/instructors";
import { useToast } from "@/components/ui/use-toast";
import { activityLogsService } from "@/lib/services/firebase/activityLogs";
import { useAuth } from "@/lib/contexts/AuthContext";

const InstructorsTable = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [filteredInstructors, setFilteredInstructors] = useState<Instructor[]>(
    [],
  );
  const [showForm, setShowForm] = useState(false);
  const [editingInstructor, setEditingInstructor] = useState<Instructor | null>(
    null,
  );
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  useEffect(() => {
    loadInstructors();
  }, []);

  const loadInstructors = async () => {
    try {
      const data = await instructorsService.getAll();
      setInstructors(data);
      setFilteredInstructors(data);
    } catch (error) {
      console.error("Error loading instructors:", error);
      toast({
        title: "Error",
        description: "Failed to load instructors",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: Instructor["status"]) => {
    const colors = {
      Active: "bg-green-500",
      "On Leave": "bg-yellow-500",
      Inactive: "bg-red-500",
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

    const sorted = [...filteredInstructors].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setFilteredInstructors(sorted);
  };

  const handleFilter = (searchTerm: string) => {
    const filtered = instructors.filter((instructor) =>
      Object.values(instructor).some((value) =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
    setFilteredInstructors(filtered);
  };

  const handleSubmit = async (data: Omit<Instructor, "id">) => {
    try {
      if (editingInstructor?.id) {
        await instructorsService.update(editingInstructor.id, data);
        await activityLogsService.create({
          action: "update",
          entityType: "instructor",
          entityId: editingInstructor.id,
          entityName: data.name,
          userId: user?.uid || "",
          userName: user?.email || "",
        });
        toast({
          title: "Instructor Updated",
          description: `Successfully updated instructor ${data.name}`,
        });
      } else {
        const newInstructor = await instructorsService.create(data);
        await activityLogsService.create({
          action: "create",
          entityType: "instructor",
          entityId: newInstructor.id || "",
          entityName: data.name,
          userId: user?.uid || "",
          userName: user?.email || "",
        });
        toast({
          title: "Instructor Created",
          description: `Successfully created instructor ${data.name}`,
        });
      }
      loadInstructors();
      setShowForm(false);
      setEditingInstructor(null);
    } catch (error) {
      console.error("Error saving instructor:", error);
      toast({
        title: "Error",
        description: "Failed to save instructor",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (instructor: Instructor) => {
    if (!instructor.id) return;
    try {
      await instructorsService.delete(instructor.id);
      await activityLogsService.create({
        action: "delete",
        entityType: "instructor",
        entityId: instructor.id,
        entityName: instructor.name,
        userId: user?.uid || "",
        userName: user?.email || "",
      });
      toast({
        title: "Instructor Deleted",
        description: `Successfully deleted instructor ${instructor.name}`,
      });
      loadInstructors();
    } catch (error) {
      console.error("Error deleting instructor:", error);
      toast({
        title: "Error",
        description: "Failed to delete instructor",
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
          Add New Instructor
        </Button>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search instructors..."
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
              <TableHead
                className="w-[200px] cursor-pointer hover:bg-gray-50"
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
                onClick={() => handleSort("specialization")}
              >
                Specialization{" "}
                {sortConfig?.key === "specialization" &&
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
                onClick={() => handleSort("joinDate")}
              >
                Join Date{" "}
                {sortConfig?.key === "joinDate" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInstructors.map((instructor) => (
              <TableRow key={instructor.id}>
                <TableCell>{instructor.name}</TableCell>
                <TableCell>{instructor.email}</TableCell>
                <TableCell>{instructor.specialization}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${getStatusColor(instructor.status)} text-white`}
                  >
                    {instructor.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(instructor.joinDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setEditingInstructor(instructor)}
                      >
                        Edit Instructor
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(instructor)}
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

      <InstructorForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
      />

      {editingInstructor && (
        <InstructorForm
          isOpen={true}
          onClose={() => setEditingInstructor(null)}
          instructor={editingInstructor}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default InstructorsTable;
