import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { lmsService } from "@/lib/services/api/lms";
import { coursesService } from "@/lib/services/firebase/courses";

interface StudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  student?: {
    id?: string;
    name: string;
    email: string;
    status: string;
    course: string;
    courseTitle?: string;
    enrollmentDate: string;
  };
  onSubmit: (data: any) => void;
}

const StudentForm = ({
  isOpen,
  onClose,
  student,
  onSubmit,
}: StudentFormProps) => {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>(
    [],
  );
  const [formData, setFormData] = useState(
    student || {
      name: "",
      email: "",
      status: "Active",
      course: "",
      courseTitle: "",
      enrollmentDate: new Date().toISOString().split("T")[0],
    },
  );

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const coursesData = await coursesService.getAll();
        setCourses(
          coursesData.map((course) => ({
            id: course.id || "",
            title: course.title,
          })),
        );
      } catch (error) {
        console.error("Error loading courses:", error);
        toast({
          title: "Error",
          description: "Failed to load courses",
          variant: "destructive",
        });
      }
    };
    loadCourses();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      onSubmit(formData);
      toast({
        title: student ? "Student Updated" : "Student Created",
        description: `Successfully ${student ? "updated" : "created"} student ${formData.name}`,
      });
      onClose();
    } catch (error) {
      console.error("Error saving student:", error);
      toast({
        title: "Error",
        description: "Failed to save student",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {student ? "Edit Student" : "Create New Student"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Graduated">Graduated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="course">Course</Label>
            <Select
              value={formData.course}
              onValueChange={(value) => {
                const selectedCourse = courses.find((c) => c.id === value);
                setFormData({
                  ...formData,
                  course: value,
                  courseTitle: selectedCourse?.title || "",
                });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="enrollmentDate">Enrollment Date</Label>
            <Input
              id="enrollmentDate"
              type="date"
              value={formData.enrollmentDate}
              onChange={(e) =>
                setFormData({ ...formData, enrollmentDate: e.target.value })
              }
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{student ? "Update" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StudentForm;
