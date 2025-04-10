import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DashboardHeader from "../layout/DashboardHeader";
import Sidebar from "../layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Lead, leadsService } from "@/lib/services/firebase/leads";
import { useToast } from "@/components/ui/use-toast";
import LeadCollaboration from "../leads/LeadCollaboration";
import LeadForm from "../leads/LeadForm";
import { useAuth } from "@/lib/contexts/AuthContext";

const LeadDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);

  useEffect(() => {
    const fetchLead = async () => {
      if (!id) return;

      try {
        const leadData = await leadsService.getById(id);
        if (leadData) {
          setLead(leadData);
        } else {
          toast({
            title: "Error",
            description: "Lead not found",
            variant: "destructive",
          });
          navigate("/leads");
        }
      } catch (error) {
        console.error("Error fetching lead:", error);
        toast({
          title: "Error",
          description: "Failed to load lead details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id, navigate, toast]);

  const handleSubmit = async (data: Omit<Lead, "id">) => {
    if (!lead?.id) return;

    try {
      await leadsService.update(lead.id, data);
      setLead({ ...lead, ...data });
      setShowEditForm(false);
      toast({
        title: "Lead Updated",
        description: "Lead details have been updated successfully",
      });
    } catch (error) {
      console.error("Error updating lead:", error);
      toast({
        title: "Error",
        description: "Failed to update lead",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p>Loading lead details...</p>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader userName={user?.displayName} userEmail={user?.email} />

      <div className="flex h-screen pt-16">
        <Sidebar
          className="fixed left-0 h-[calc(100vh-64px)]"
          activeItem="leads"
        />

        <main className="flex-1 ml-[280px] p-6 space-y-6 overflow-auto">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigate("/leads")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-2xl font-bold text-gray-900">
                  Lead Details
                </h1>
              </div>
              <Button
                onClick={() => setShowEditForm(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Lead
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Name
                    </h3>
                    <p className="text-lg font-medium">{lead.name}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">
                      Email
                    </h3>
                    <p>{lead.email}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Status
                      </h3>
                      <Badge
                        variant="secondary"
                        className={`${getStatusColor(lead.status)} text-white mt-1`}
                      >
                        {lead.status}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Pipeline Stage
                      </h3>
                      <p>{lead.pipeline}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Source
                      </h3>
                      <p>{lead.source}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Type
                      </h3>
                      <p>{lead.type}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Date
                      </h3>
                      <p>{new Date(lead.date).toLocaleDateString()}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Next Contact
                      </h3>
                      <p
                        className={`${lead.nextContactDate && new Date(lead.nextContactDate) <= new Date() ? "text-red-500 font-medium" : ""}`}
                      >
                        {lead.nextContactDate
                          ? new Date(lead.nextContactDate).toLocaleDateString()
                          : "Not scheduled"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {lead.courseOfInterest && (
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Course of Interest
                        </h3>
                        <p>{lead.courseOfInterest}</p>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Assigned To
                      </h3>
                      <p>{lead.lastInteractionBy || "Unassigned"}</p>
                    </div>
                  </div>

                  {lead.notes && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">
                        Notes
                      </h3>
                      <p className="whitespace-pre-wrap">{lead.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <LeadCollaboration lead={lead} />
            </div>
          </div>
        </main>
      </div>

      {showEditForm && (
        <LeadForm
          isOpen={showEditForm}
          onClose={() => setShowEditForm(false)}
          lead={lead}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default LeadDetailPage;
