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
import StudentForm from "./StudentForm";
import { Student, studentsService } from "@/lib/services/firebase/students";
import { useToast } from "@/components/ui/use-toast";
import { activityLogsService } from "@/lib/services/firebase/activityLogs";
import { useAuth } from "@/lib/contexts/AuthContext";
import { coursesService } from "@/lib/services/firebase/courses";

const StudentsTable = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [courses, setCourses] = useState<Record<string, string>>({});

  useEffect(() => {
    loadStudents();
    loadCourses();
  }, []);

  const loadStudents = async () => {
    try {
      const data = await studentsService.getAll();
      setStudents(data);
      setFilteredStudents(data);
    } catch (error) {
      console.error("Error loading students:", error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive",
      });
    }
  };

  const loadCourses = async () => {
    try {
      const coursesData = await coursesService.getAll();
      const courseMap = coursesData.reduce(
        (acc, course) => ({ ...acc, [course.id!]: course.title }),
        {},
      );
      setCourses(courseMap);
    } catch (error) {
      console.error("Error loading courses:", error);
    }
  };

  const getStatusColor = (status: Student["status"]) => {
    const colors = {
      Active: "bg-green-500",
      Inactive: "bg-yellow-500",
      Graduated: "bg-blue-500",
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

    const sorted = [...filteredStudents].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setFilteredStudents(sorted);
  };

  const handleFilter = (searchTerm: string) => {
    const filtered = students.filter((student) =>
      Object.values(student).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
    setFilteredStudents(filtered);
  };

  const handleSubmit = async (data: Omit<Student, "id">) => {
    try {
      if (editingStudent?.id) {
        await studentsService.update(editingStudent.id, data);
        await activityLogsService.create({
          action: "update",
          entityType: "student",
          entityId: editingStudent.id,
          entityName: data.name,
          userId: user?.uid || "",
          userName: user?.email || "",
        });
        toast({
          title: "Student Updated",
          description: `Successfully updated student ${data.name}`,
        });
      } else {
        const newStudent = await studentsService.create(data);
        await activityLogsService.create({
          action: "create",
          entityType: "student",
          entityId: newStudent.id || "",
          entityName: data.name,
          userId: user?.uid || "",
          userName: user?.email || "",
        });
        toast({
          title: "Student Created",
          description: `Successfully created student ${data.name}`,
        });
      }
      loadStudents();
      setShowForm(false);
      setEditingStudent(null);
    } catch (error) {
      console.error("Error saving student:", error);
      toast({
        title: "Error",
        description: "Failed to save student",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (student: Student) => {
    if (!student.id) return;
    try {
      await studentsService.delete(student.id);
      await activityLogsService.create({
        action: "delete",
        entityType: "student",
        entityId: student.id,
        entityName: student.name,
        userId: user?.uid || "",
        userName: user?.email || "",
      });
      toast({
        title: "Student Deleted",
        description: `Successfully deleted student ${student.name}`,
      });
      loadStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      });
    }
  };

  const getCourseName = (courseId: string, currentStudent: Student) => {
    if (courseId) {
      return courses[courseId] || currentStudent.courseTitle || courseId;
    }
    return "No course assigned";
  };

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New Student
        </Button>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search students..."
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
                onClick={() => handleSort("status")}
              >
                Status{" "}
                {sortConfig?.key === "status" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("course")}
              >
                Course{" "}
                {sortConfig?.key === "course" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("enrollmentDate")}
              >
                Enrollment Date{" "}
                {sortConfig?.key === "enrollmentDate" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell>{student.name}</TableCell>
                <TableCell>{student.email}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${getStatusColor(student.status)} text-white`}
                  >
                    {student.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {student.courseTitle ||
                    getCourseName(student.course, student)}
                </TableCell>
                <TableCell>
                  {new Date(student.enrollmentDate).toLocaleDateString()}
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
                          window.open(
                            `/students/detail/${student.id}`,
                            "_blank",
                          )
                        }
                      >
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setEditingStudent(student)}
                      >
                        Edit Student
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => handleDelete(student)}
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

      <StudentForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
      />

      {editingStudent && (
        <StudentForm
          isOpen={true}
          onClose={() => setEditingStudent(null)}
          student={editingStudent}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default StudentsTable;
