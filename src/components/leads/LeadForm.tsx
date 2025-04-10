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
import { useAuth } from "@/lib/contexts/AuthContext";

interface LeadFormProps {
  isOpen: boolean;
  onClose: () => void;
  lead?: {
    id?: string;
    name: string;
    email: string;
    status: string;
    source: string;
    date: string;
    type: "Inbound" | "Outbound";
    campaign?: string;
    companyId?: string;
    notes?: string;
    pipeline: string;
    courseOfInterest?: string;
    selectedCourses?: string[];
    contractName?: string;
  };
  onSubmit: (data: any) => void;
}

const LeadForm = ({ isOpen, onClose, lead, onSubmit }: LeadFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>(
    [],
  );
  const [formData, setFormData] = useState(
    lead || {
      name: "",
      email: "",
      status: "New",
      source: "Website",
      date: new Date().toISOString().split("T")[0],
      type: "Inbound",
      campaign: "",
      companyId: "",
      notes: "",
      pipeline: "Prospecting",
      courseOfInterest: "",
      selectedCourses: [],
      contractName: "",
      nextContactDate: "",
      lastInteractionBy: user?.displayName || "",
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
      }
    };
    loadData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      formData.pipeline === "Closed Won" &&
      !formData.selectedCourses?.length &&
      !formData.courseOfInterest
    ) {
      toast({
        title: "Error",
        description: "Please select at least one course for conversion",
        variant: "destructive",
      });
      return;
    }

    // If there's a course of interest but no selected courses, use it
    if (
      formData.pipeline === "Closed Won" &&
      !formData.selectedCourses?.length &&
      formData.courseOfInterest
    ) {
      formData.selectedCourses = [formData.courseOfInterest];
    }
    if (
      formData.type === "Outbound" &&
      formData.pipeline === "Closed Won" &&
      !formData.contractName
    ) {
      toast({
        title: "Error",
        description: "Please provide a contract name for company conversion",
        variant: "destructive",
      });
      return;
    }
    onSubmit(formData);
  };

  const showConversionFields = formData.pipeline === "Closed Won";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{lead ? "Edit Lead" : "Create New Lead"}</DialogTitle>
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
              <Label htmlFor="type">Lead Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "Inbound" | "Outbound") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inbound">Inbound</SelectItem>
                  <SelectItem value="Outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.type === "Inbound" ? (
              <div className="space-y-2">
                <Label htmlFor="campaign">Campaign</Label>
                <Select
                  value={formData.campaign}
                  onValueChange={(value) =>
                    setFormData({ ...formData, campaign: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Facebook">Facebook</SelectItem>
                    <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                    <SelectItem value="Google">Google</SelectItem>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="company">Company (Optional)</Label>
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
            )}
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
                  <SelectItem value="New">New</SelectItem>
                  <SelectItem value="Contacted">Contacted</SelectItem>
                  <SelectItem value="Qualified">Qualified</SelectItem>
                  <SelectItem value="Lost">Lost</SelectItem>
                  <SelectItem value="Converted">Converted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pipeline">Pipeline Stage</Label>
              <Select
                value={formData.pipeline}
                onValueChange={(value) =>
                  setFormData({ ...formData, pipeline: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pipeline stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prospecting">Prospecting</SelectItem>
                  <SelectItem value="Initial Contact">
                    Initial Contact
                  </SelectItem>
                  <SelectItem value="Meeting Scheduled">
                    Meeting Scheduled
                  </SelectItem>
                  <SelectItem value="Proposal">Proposal</SelectItem>
                  <SelectItem value="Negotiation">Negotiation</SelectItem>
                  <SelectItem value="Closed Won">Closed Won</SelectItem>
                  <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="courseOfInterest">Course of Interest</Label>
            <div className="flex gap-2">
              <Select
                value={formData.courseOfInterest}
                onValueChange={(value) =>
                  setFormData({ ...formData, courseOfInterest: value })
                }
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select course of interest" />
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
          </div>

          {showConversionFields && (
            <div className="space-y-4 border-t pt-4">
              <Label className="text-lg font-semibold">
                Conversion Details
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="courses">Select Courses</Label>
                  <Select
                    value={
                      formData.selectedCourses?.[0] ||
                      formData.courseOfInterest ||
                      ""
                    }
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        selectedCourses: [value],
                      })
                    }
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

                {formData.type === "Outbound" && formData.companyId && (
                  <div className="space-y-2">
                    <Label htmlFor="contractName">Contract Name</Label>
                    <Input
                      id="contractName"
                      value={formData.contractName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contractName: e.target.value,
                        })
                      }
                      placeholder="Enter contract name"
                      required
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nextContactDate">Next Contact Date</Label>
              <Input
                id="nextContactDate"
                type="date"
                value={formData.nextContactDate}
                onChange={(e) =>
                  setFormData({ ...formData, nextContactDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Assigned To</Label>
              <Select
                value={formData.lastInteractionBy || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, lastInteractionBy: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={user?.displayName || ""}>
                    {user?.displayName || "Current User"}
                  </SelectItem>
                  <SelectItem value="John Smith">John Smith</SelectItem>
                  <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                  <SelectItem value="Michael Brown">Michael Brown</SelectItem>
                  <SelectItem value="Emily Davis">Emily Davis</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
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
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{lead ? "Update" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LeadForm;
