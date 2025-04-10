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
import {
  Search,
  Filter,
  MoreVertical,
  Plus,
  FileText,
  Users,
} from "lucide-react";
import CourseForm from "./CourseForm";
import { coursesService } from "@/lib/services/firebase/courses";
import { useToast } from "@/components/ui/use-toast";

interface Course {
  id: string;
  title: string;
  description: string;
  instructors: string[];
  status: "Active" | "Upcoming" | "Completed";
  startDate: string;
  endDate: string;
  capacity: number;
  enrolledCount: number;
  price: number;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
}

const CoursesTable = () => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const data = await coursesService.getAll();
      setCourses(data);
      setFilteredCourses(data);
    } catch (error) {
      console.error("Error loading courses:", error);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: Course["status"]) => {
    const colors = {
      Active: "bg-green-500",
      Inactive: "bg-red-500",
      Upcoming: "bg-blue-500",
      Completed: "bg-gray-500",
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

    const sorted = [...filteredCourses].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setFilteredCourses(sorted);
  };

  const handleFilter = (searchTerm: string) => {
    const filtered = courses.filter((course) =>
      Object.values(course).some((value) =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
    setFilteredCourses(filtered);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingCourse) {
        // Ensure title is preserved if it's empty during status change
        const updatedData = { ...data };
        if (!updatedData.title && editingCourse.title) {
          updatedData.title = editingCourse.title;
        }
        await coursesService.update(editingCourse.id, updatedData);
        toast({
          title: "Course Updated",
          description: `Successfully updated course ${updatedData.title}`,
        });
      } else {
        await coursesService.create(data);
        toast({
          title: "Course Created",
          description: `Successfully created course ${data.title}`,
        });
      }
      loadCourses();
    } catch (error) {
      console.error("Error saving course:", error);
      toast({
        title: "Error",
        description: "Failed to save course",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (confirm("Are you sure you want to delete this course?")) {
      try {
        await coursesService.delete(courseId);
        toast({
          title: "Course Deleted",
          description: "The course has been successfully deleted.",
        });
        loadCourses();
      } catch (error) {
        console.error("Error deleting course:", error);
        toast({
          title: "Error",
          description: "Failed to delete course",
          variant: "destructive",
        });
      }
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
          Add New Course
        </Button>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search courses..."
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
                className="w-[250px] cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("title")}
              >
                Title{" "}
                {sortConfig?.key === "title" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("category")}
              >
                Category{" "}
                {sortConfig?.key === "category" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSort("level")}
              >
                Level{" "}
                {sortConfig?.key === "level" &&
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
                onClick={() => handleSort("startDate")}
              >
                Start Date{" "}
                {sortConfig?.key === "startDate" &&
                  (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCourses.map((course) => (
              <TableRow key={course.id}>
                <TableCell className="font-medium">{course.title}</TableCell>
                <TableCell>{course.category}</TableCell>
                <TableCell>{course.level}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={`${getStatusColor(course.status)} text-white`}
                  >
                    {course.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(course.startDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex justify-end space-x-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer">
                          <FileText className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer"
                          onClick={() => setEditingCourse(course)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Manage Course
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer text-red-600"
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          Delete Course
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

      <CourseForm
        isOpen={showForm || !!editingCourse}
        onClose={() => {
          setShowForm(false);
          setEditingCourse(null);
        }}
        course={editingCourse || undefined}
        onSubmit={handleSubmit}
      />
    </div>
  );
};

export default CoursesTable;
