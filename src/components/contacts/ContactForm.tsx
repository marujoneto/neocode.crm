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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { companiesService } from "@/lib/services/firebase/companies";
import { coursesService } from "@/lib/services/firebase/courses";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";

interface ContactFormProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: {
    id?: string;
    name: string;
    email: string;
    phone: string;
    position: string;
    companyId: string;
    department: string;
    role: string;
    notes: string;
    involvedCourses: string[];
    involvedProjects: string[];
    createdBy?: {
      id: string;
      name: string;
    };
  };
  onSubmit: (data: any) => void;
}

const ContactForm = ({
  isOpen,
  onClose,
  contact,
  onSubmit,
}: ContactFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>(
    [],
  );
  const [selectedCourse, setSelectedCourse] = useState("");
  const [formData, setFormData] = useState(
    contact || {
      name: "",
      email: "",
      phone: "",
      position: "",
      companyId: "",
      department: "",
      role: "Stakeholder",
      notes: "",
      involvedCourses: [],
      involvedProjects: [],
      createdBy: {
        id: user?.id || "",
        name: user?.displayName || "System",
      },
    },
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const [companiesData, coursesData] = await Promise.all([
          companiesService.getAll(),
          coursesService.getAll(),
        ]);
        setCompanies(companiesData);
        setCourses(coursesData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive",
        });
      }
    };
    loadData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ensure createdBy is set for new contacts
    if (!contact && user) {
      formData.createdBy = {
        id: user.id || "",
        name: user.displayName || "System",
      };
    }
    onSubmit(formData);
  };

  const handleAddCourse = () => {
    if (!selectedCourse) return;

    // Find the course title
    const course = courses.find((c) => c.id === selectedCourse);
    if (!course) return;

    // Check if already added
    if (!formData.involvedCourses.includes(course.title)) {
      setFormData({
        ...formData,
        involvedCourses: [...formData.involvedCourses, course.title],
      });
    }

    setSelectedCourse("");
  };

  const handleRemoveCourse = (course: string) => {
    setFormData({
      ...formData,
      involvedCourses: formData.involvedCourses.filter((c) => c !== course),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {contact ? "Edit Contact" : "Create New Contact"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Select
                value={formData.companyId}
                onValueChange={(value) =>
                  setFormData({ ...formData, companyId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) =>
                  setFormData({ ...formData, position: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) =>
                  setFormData({ ...formData, department: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stakeholder">Stakeholder</SelectItem>
                  <SelectItem value="Decision Maker">Decision Maker</SelectItem>
                  <SelectItem value="Technical Contact">
                    Technical Contact
                  </SelectItem>
                  <SelectItem value="HR Contact">HR Contact</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Involved Courses</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedCourse}
                  onValueChange={setSelectedCourse}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select courses" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={handleAddCourse}
                  variant="outline"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {formData.involvedCourses.map((course) => (
                  <Badge
                    key={course}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {course}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveCourse(course)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              className="min-h-[100px]"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{contact ? "Update" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactForm;
