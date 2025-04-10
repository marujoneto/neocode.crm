import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lead, leadsService } from "@/lib/services/firebase/leads";
import { companiesService } from "@/lib/services/firebase/companies";
import { Building2, Users } from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";
import LeadForm from "./LeadForm";
import { useToast } from "@/components/ui/use-toast";
import { activityLogsService } from "@/lib/services/firebase/activityLogs";
import { useAuth } from "@/lib/contexts/AuthContext";

const pipelineStages = [
  "Prospecting",
  "Initial Contact",
  "Meeting Scheduled",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
] as const;

const KanbanBoard = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [leadsData, companiesData] = await Promise.all([
          leadsService.getAll(),
          companiesService.getAll(),
        ]);
        setLeads(leadsData);
        const companyMap = companiesData.reduce(
          (acc, company) => ({ ...acc, [company.id!]: company.name }),
          {},
        );
        setCompanies(companyMap);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        });
      }
    };
    loadData();
  }, [toast]);

  const getLeadsByStage = (stage: Lead["pipeline"]) => {
    return leads.filter(
      (lead) => lead.pipeline === stage && lead.status !== "Converted",
    );
  };

  const getTypeColor = (type: Lead["type"]) => {
    return type === "Inbound" ? "bg-green-100" : "bg-blue-100";
  };

  const getSourceIcon = (type: Lead["type"]) => {
    return type === "Inbound" ? (
      <Users className="h-4 w-4 text-green-600" />
    ) : (
      <Building2 className="h-4 w-4 text-blue-600" />
    );
  };

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;

      if (!destination || source.droppableId === destination.droppableId) {
        return;
      }

      const lead = leads.find((l) => l.id === draggableId);
      if (!lead) return;

      const newPipeline = destination.droppableId as Lead["pipeline"];

      try {
        // Check if moving to Closed Won
        if (
          newPipeline === "Closed Won" &&
          (lead.selectedCourses?.length || lead.courseOfInterest)
        ) {
          // If there's a course of interest but no selected courses, use it
          if (!lead.selectedCourses?.length && lead.courseOfInterest) {
            lead.selectedCourses = [lead.courseOfInterest];
          }
          if (lead.type === "Outbound" && lead.companyId) {
            await leadsService.convertToContract(
              draggableId,
              lead.contractName || "",
              lead.selectedCourses,
            );
          } else {
            await leadsService.convertToStudent(
              draggableId,
              lead.selectedCourses,
            );
          }
          toast({
            title: "Lead Converted",
            description: `Successfully converted lead ${lead.name} to ${lead.type === "Outbound" ? "contract" : "student"}`,
          });
          const updatedLeads = await leadsService.getAll();
          setLeads(updatedLeads);
          return;
        }

        // Optimistically update the UI
        setLeads((prevLeads) =>
          prevLeads.map((l) =>
            l.id === draggableId ? { ...l, pipeline: newPipeline } : l,
          ),
        );

        // Update in the backend
        await leadsService.update(draggableId, { pipeline: newPipeline });
        await activityLogsService.create({
          action: "update",
          entityType: "lead",
          entityId: draggableId,
          entityName: lead.name,
          userId: user?.uid || "",
          userName: user?.email || "",
          details: {
            field: "pipeline",
            from: source.droppableId,
            to: newPipeline,
          },
        });

        toast({
          title: "Lead Updated",
          description: `Moved ${lead.name} to ${newPipeline}`,
        });
      } catch (error) {
        // Revert the UI on error
        setLeads((prevLeads) =>
          prevLeads.map((l) =>
            l.id === draggableId
              ? { ...l, pipeline: source.droppableId as Lead["pipeline"] }
              : l,
          ),
        );

        console.error("Error updating lead:", error);
        toast({
          title: "Error",
          description: "Failed to update lead",
          variant: "destructive",
        });
      }
    },
    [leads, user, toast],
  );

  const handleSubmit = async (data: Omit<Lead, "id">) => {
    if (!editingLead?.id) return;

    try {
      // Check if converting to Closed Won
      if (
        data.pipeline === "Closed Won" &&
        (data.selectedCourses?.length || data.courseOfInterest)
      ) {
        // If there's a course of interest but no selected courses, use it
        if (!data.selectedCourses?.length && data.courseOfInterest) {
          data.selectedCourses = [data.courseOfInterest];
        }
        if (data.type === "Outbound" && data.companyId) {
          await leadsService.convertToContract(
            editingLead.id,
            data.contractName || "",
            data.selectedCourses,
          );
        } else {
          await leadsService.convertToStudent(
            editingLead.id,
            data.selectedCourses,
          );
        }
        toast({
          title: "Lead Converted",
          description: `Successfully converted lead ${data.name} to ${data.type === "Outbound" ? "contract" : "student"}`,
        });
        const updatedLeads = await leadsService.getAll();
        setLeads(updatedLeads);
        setEditingLead(null);
        return;
      }

      await leadsService.update(editingLead.id, data);
      setLeads((prevLeads) =>
        prevLeads.map((l) => (l.id === editingLead.id ? { ...l, ...data } : l)),
      );
      setEditingLead(null);

      toast({
        title: "Lead Updated",
        description: `Successfully updated lead ${data.name}`,
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

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto p-4 min-h-[600px] pb-6 scrollbar-thin scrollbar-thumb-[#3AAA9E] scrollbar-track-transparent">
        {pipelineStages.map((stage) => (
          <Droppable key={stage} droppableId={stage}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-none w-[300px] rounded-lg p-4 ${snapshot.isDraggingOver ? "bg-gray-100" : "bg-gray-50"}`}
              >
                <div className="flex items-center justify-between mb-4 select-none">
                  <h3 className="font-semibold text-gray-700">{stage}</h3>
                  <Badge variant="secondary">
                    {getLeadsByStage(stage).length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {getLeadsByStage(stage).map((lead, index) => (
                    <Draggable
                      key={lead.id}
                      draggableId={lead.id!}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            opacity: snapshot.isDragging ? 0.8 : 1,
                          }}
                        >
                          <Card
                            className={`${getTypeColor(lead.type)} border-l-4 ${lead.type === "Inbound" ? "border-l-green-500" : "border-l-blue-500"} cursor-pointer hover:shadow-md transition-shadow duration-200`}
                            onClick={() => setEditingLead(lead)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-medium">{lead.name}</h4>
                                  <p className="text-sm text-gray-500">
                                    {lead.email}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Assigned To:{" "}
                                    {lead.lastInteractionBy || "Unassigned"}
                                  </p>
                                </div>
                                {getSourceIcon(lead.type)}
                              </div>
                              <div className="mt-2 text-sm flex flex-wrap gap-1">
                                {lead.type === "Inbound" ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-green-50"
                                  >
                                    {lead.campaign}
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-blue-50"
                                  >
                                    {companies[lead.companyId!] || "No Company"}
                                  </Badge>
                                )}
                                {lead.courseOfInterest && (
                                  <Badge
                                    variant="outline"
                                    className="bg-purple-50 text-purple-700"
                                  >
                                    Course Interest
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>

      {editingLead && (
        <LeadForm
          isOpen={true}
          onClose={() => setEditingLead(null)}
          lead={editingLead}
          onSubmit={handleSubmit}
        />
      )}
    </DragDropContext>
  );
};

export default KanbanBoard;
