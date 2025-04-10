import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import {
  PlusIcon,
  XIcon,
  ArrowRightIcon,
  GripVertical,
  SettingsIcon,
  MailIcon,
  MessageSquareIcon,
  BellIcon,
  ClockIcon,
  GitBranchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  marketingService,
  Campaign,
  FunnelStep,
} from "@/lib/services/firebase/marketing";
import { useToast } from "@/components/ui/use-toast";

interface FunnelBuilderProps {
  campaignId: string;
  initialFunnel?: Campaign["funnel"];
  onSave?: (funnel: Campaign["funnel"]) => void;
}

const getStepIcon = (type: FunnelStep["type"]) => {
  switch (type) {
    case "Email":
      return <MailIcon className="h-5 w-5" />;
    case "SMS":
      return <MessageSquareIcon className="h-5 w-5" />;
    case "Notification":
      return <BellIcon className="h-5 w-5" />;
    case "Wait":
      return <ClockIcon className="h-5 w-5" />;
    case "Condition":
      return <GitBranchIcon className="h-5 w-5" />;
    case "Task":
      return <SettingsIcon className="h-5 w-5" />;
    default:
      return <MailIcon className="h-5 w-5" />;
  }
};

const FunnelBuilder: React.FC<FunnelBuilderProps> = ({
  campaignId,
  initialFunnel,
  onSave,
}) => {
  const [funnel, setFunnel] = useState<Campaign["funnel"]>(
    initialFunnel || { name: "Default Funnel", steps: [] },
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<FunnelStep | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (initialFunnel) {
      setFunnel(initialFunnel);
    }
  }, [initialFunnel]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(funnel.steps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property for each step
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setFunnel({ ...funnel, steps: updatedItems });
  };

  const openAddStepDialog = () => {
    setCurrentStep(null);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const openEditStepDialog = (step: FunnelStep) => {
    setCurrentStep(step);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSaveStep = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const stepData: Partial<FunnelStep> = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      type: formData.get("type") as FunnelStep["type"],
      content: formData.get("content") as string,
      delay: parseInt(formData.get("delay") as string) || 0,
    };

    try {
      if (isEditing && currentStep) {
        // Update existing step
        await marketingService.updateFunnelStep(
          campaignId,
          currentStep.id,
          stepData,
        );

        // Update local state
        const updatedSteps = funnel.steps.map((step) =>
          step.id === currentStep.id ? { ...step, ...stepData } : step,
        );
        setFunnel({ ...funnel, steps: updatedSteps });

        toast({
          title: "Success",
          description: "Funnel step updated successfully",
        });
      } else {
        // Add new step
        const newStep = await marketingService.addFunnelStep(campaignId, {
          ...stepData,
          order: funnel.steps.length,
        } as Omit<FunnelStep, "id">);

        // Update local state
        setFunnel({
          ...funnel,
          steps: [...funnel.steps, newStep],
        });

        toast({
          title: "Success",
          description: "Funnel step added successfully",
        });
      }

      // Call onSave callback if provided
      if (onSave) {
        onSave(funnel);
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error saving funnel step:", error);
      toast({
        title: "Error",
        description: "Failed to save funnel step",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    try {
      await marketingService.deleteFunnelStep(campaignId, stepId);

      // Update local state
      const updatedSteps = funnel.steps.filter((step) => step.id !== stepId);
      setFunnel({ ...funnel, steps: updatedSteps });

      toast({
        title: "Success",
        description: "Funnel step deleted successfully",
      });

      // Call onSave callback if provided
      if (onSave) {
        onSave({ ...funnel, steps: updatedSteps });
      }
    } catch (error) {
      console.error("Error deleting funnel step:", error);
      toast({
        title: "Error",
        description: "Failed to delete funnel step",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Sales Funnel Builder</h2>
          <p className="text-gray-500">
            Create and manage your campaign funnel
          </p>
        </div>
        <Button onClick={openAddStepDialog}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Step
        </Button>
      </div>

      {funnel.steps.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-4">No funnel steps yet</p>
          <Button variant="outline" onClick={openAddStepDialog}>
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Your First Step
          </Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="funnel-steps" direction="vertical">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {funnel.steps
                  .sort((a, b) => a.order - b.order)
                  .map((step, index) => (
                    <Draggable
                      key={step.id}
                      draggableId={step.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="relative"
                        >
                          <Card
                            className="border-l-4"
                            style={{ borderLeftColor: getStepColor(step.type) }}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-grab p-1 rounded hover:bg-gray-100"
                                  >
                                    <GripVertical className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="p-1.5 rounded-full"
                                      style={{
                                        backgroundColor: getStepColor(
                                          step.type,
                                          true,
                                        ),
                                      }}
                                    >
                                      {getStepIcon(step.type)}
                                    </div>
                                    <CardTitle className="text-lg">
                                      {step.name}
                                    </CardTitle>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditStepDialog(step)}
                                  >
                                    <SettingsIcon className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteStep(step.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <XIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              <CardDescription>
                                {step.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="text-sm">
                                {step.type === "Wait" ? (
                                  <p>
                                    Wait for {step.delay} hours before next step
                                  </p>
                                ) : step.type === "Condition" ? (
                                  <p>
                                    Condition:{" "}
                                    {step.condition || "No condition set"}
                                  </p>
                                ) : (
                                  <p className="line-clamp-2">
                                    {step.content || "No content"}
                                  </p>
                                )}
                              </div>
                            </CardContent>
                            {index < funnel.steps.length - 1 && (
                              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                                <div className="bg-white p-1 rounded-full border border-gray-200">
                                  <ArrowRightIcon className="h-4 w-4 text-gray-400 rotate-90" />
                                </div>
                              </div>
                            )}
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Funnel Step" : "Add Funnel Step"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update the details of this funnel step"
                : "Create a new step in your marketing funnel"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveStep}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">
                  Name
                </label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={currentStep?.name || ""}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="type" className="text-right">
                  Type
                </label>
                <Select name="type" defaultValue={currentStep?.type || "Email"}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select step type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Email">Email</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="Notification">Notification</SelectItem>
                    <SelectItem value="Task">Task</SelectItem>
                    <SelectItem value="Wait">Wait</SelectItem>
                    <SelectItem value="Condition">Condition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="description" className="text-right">
                  Description
                </label>
                <Input
                  id="description"
                  name="description"
                  defaultValue={currentStep?.description || ""}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="delay" className="text-right">
                  Delay (hours)
                </label>
                <Input
                  id="delay"
                  name="delay"
                  type="number"
                  min="0"
                  defaultValue={currentStep?.delay || "0"}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <label htmlFor="content" className="text-right pt-2">
                  Content
                </label>
                <Textarea
                  id="content"
                  name="content"
                  defaultValue={currentStep?.content || ""}
                  className="col-span-3 min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Saving..."
                  : isEditing
                    ? "Update Step"
                    : "Add Step"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Helper function to get color based on step type
const getStepColor = (type: FunnelStep["type"], isBackground = false) => {
  const opacity = isBackground ? "20" : "";
  switch (type) {
    case "Email":
      return `#3b82f6${opacity}`; // blue
    case "SMS":
      return `#10b981${opacity}`; // green
    case "Notification":
      return `#f59e0b${opacity}`; // amber
    case "Task":
      return `#8b5cf6${opacity}`; // violet
    case "Wait":
      return `#6b7280${opacity}`; // gray
    case "Condition":
      return `#ef4444${opacity}`; // red
    default:
      return `#3b82f6${opacity}`; // blue
  }
};

export default FunnelBuilder;
