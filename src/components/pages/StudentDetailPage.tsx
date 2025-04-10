import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DashboardHeader from "../layout/DashboardHeader";
import Sidebar from "../layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Student, studentsService } from "@/lib/services/firebase/students";
import { useToast } from "@/components/ui/use-toast";
import StudentCollaboration from "../students/StudentCollaboration";
import StudentForm from "../students/StudentForm";
import { useAuth } from "@/lib/contexts/AuthContext";
import LMSIntegrationPanel from "../students/LMSIntegrationPanel";

const StudentDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    const fetchStudent = async () => {
      if (!id) return;

      try {
        // In a real app, you would fetch the student by ID
        // For now, we'll get all students and find the one with matching ID
        const students = await studentsService.getAll();
        const foundStudent = students.find((s) => s.id === id);

        if (foundStudent) {
          setStudent(foundStudent);
        } else {
          toast({
            title: "Error",
            description: "Student not found",
            variant: "destructive",
          });
          navigate("/students");
        }
      } catch (error) {
        console.error("Error fetching student:", error);
        toast({
          title: "Error",
          description: "Failed to load student details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id, navigate, toast]);

  const handleSubmit = async (data: Omit<Student, "id">) => {
    if (!student?.id) return;

    try {
      await studentsService.update(student.id, data);
      setStudent({ ...student, ...data });
      setShowEditForm(false);
      toast({
        title: "Student Updated",
        description: "Student details have been updated successfully",
      });
    } catch (error) {
      console.error("Error updating student:", error);
      toast({
        title: "Error",
        description: "Failed to update student",
        variant: "destructive",
      });
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

  const handleLMSSync = () => {
    // Refresh student data after LMS sync
    if (student?.id) {
      studentsService.getAll().then((students) => {
        const updatedStudent = students.find((s) => s.id === student.id);
        if (updatedStudent) {
          setStudent(updatedStudent);
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p>Loading student details...</p>
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader userName={user?.displayName} userEmail={user?.email} />

      <div className="flex h-screen pt-16">
        <Sidebar
          className="fixed left-0 h-[calc(100vh-64px)]"
          activeItem="students"
        />

        <main className="flex-1 ml-[280px] p-6 space-y-6 overflow-auto">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate("/students")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">
                  Student Details
                </h1>
              </div>
              <Button
                onClick={() => setShowEditForm(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Student
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Name
                      </h3>
                      <p className="text-lg font-medium">{student.name}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Email
                      </h3>
                      <p>{student.email}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Status
                        </h3>
                        <Badge
                          variant="secondary"
                          className={`${getStatusColor(student.status)} text-white mt-1`}
                        >
                          {student.status}
                        </Badge>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Enrollment Date
                        </h3>
                        <p>
                          {new Date(
                            student.enrollmentDate,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Course
                      </h3>
                      <p>{student.courseTitle || student.course}</p>
                    </div>
                  </CardContent>
                </Card>

                {student.id && (
                  <LMSIntegrationPanel
                    student={student}
                    onSync={handleLMSSync}
                  />
                )}
              </div>

              <StudentCollaboration student={student} />
            </div>
          </div>
        </main>
      </div>

      {showEditForm && (
        <StudentForm
          isOpen={showEditForm}
          onClose={() => setShowEditForm(false)}
          student={student}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default StudentDetailPage;
