import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface CourseFormProps {
  isOpen: boolean;
  onClose: () => void;
  course?: {
    id?: string;
    title: string;
    description: string;
    instructorIds: string[];
    status: string;
    startDate: string;
    endDate: string;
    capacity: number;
    price: number;
    category: string;
    educationalCategory: string;
    level: string;
    trainingTrack: string | null;
  };
  onSubmit: (data: any) => void;
}

const CourseForm = ({ isOpen, onClose, course, onSubmit }: CourseFormProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState(
    course || {
      title: "",
      description: "",
      instructorIds: [],
      status: "Active",
      startDate: "",
      endDate: "",
      capacity: 20,
      price: 0,
      category: "Web Development",
      educationalCategory: "Technology",
      level: "Beginner",
      trainingTrack: null,
    },
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    toast({
      title: course ? "Course Updated" : "Course Created",
      description: `Successfully ${course ? "updated" : "created"} course ${formData.title}`,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px] overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {course ? `Edit Course: ${course.title}` : "Create New Course"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh] px-6 [&>div]:!scrollbar-thin [&>div]:!scrollbar-track-transparent [&>div]:!scrollbar-thumb-primary">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder={course?.title || ""}
                    required={!course}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="educationalCategory">
                    Educational Category
                  </Label>
                  <Select
                    value={formData.educationalCategory}
                    onValueChange={(value) =>
                      setFormData({ ...formData, educationalCategory: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Technology">Technology</SelectItem>
                      <SelectItem value="Business">Business</SelectItem>
                      <SelectItem value="Healthcare">Healthcare</SelectItem>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Arts">Arts & Design</SelectItem>
                      <SelectItem value="Science">Science</SelectItem>
                      <SelectItem value="Languages">Languages</SelectItem>
                      <SelectItem value="Mathematics">Mathematics</SelectItem>
                      <SelectItem value="SocialSciences">
                        Social Sciences
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Technical Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select technical category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Web Development">
                        Web Development
                      </SelectItem>
                      <SelectItem value="Mobile Development">
                        Mobile Development
                      </SelectItem>
                      <SelectItem value="Data Science">Data Science</SelectItem>
                      <SelectItem value="UI/UX Design">UI/UX Design</SelectItem>
                      <SelectItem value="Cloud Computing">
                        Cloud Computing
                      </SelectItem>
                      <SelectItem value="DevOps">DevOps</SelectItem>
                      <SelectItem value="Cybersecurity">
                        Cybersecurity
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trainingTrack">Training Track</Label>
                  <Select
                    value={formData.trainingTrack || "none"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        trainingTrack: value === "none" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select training track" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fullstack">
                        Full Stack Development
                      </SelectItem>
                      <SelectItem value="data">
                        Data Science & Analytics
                      </SelectItem>
                      <SelectItem value="cloud">Cloud Architecture</SelectItem>
                      <SelectItem value="design">UI/UX Design</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Instructors</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select instructors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instructor1">John Smith</SelectItem>
                    <SelectItem value="instructor2">Sarah Johnson</SelectItem>
                    <SelectItem value="instructor3">Mike Wilson</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    required={!course}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="Upcoming">Upcoming</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <Select
                    value={formData.level}
                    onValueChange={(value) =>
                      setFormData({ ...formData, level: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: parseInt(e.target.value),
                      })
                    }
                    required
                    min={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseFloat(e.target.value),
                      })
                    }
                    required
                    min={0}
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 mb-6">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">{course ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CourseForm;
