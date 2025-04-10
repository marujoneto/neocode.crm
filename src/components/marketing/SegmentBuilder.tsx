import React, { useState, useEffect } from "react";
import { PlusCircle, X, Filter, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Segment, SegmentCriteria } from "@/lib/services/firebase/marketing";

interface SegmentBuilderProps {
  onSave?: (segment: Segment) => void;
  onCancel?: () => void;
  initialSegment?: Segment;
  showHeader?: boolean;
}

const FIELD_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "status", label: "Status" },
  { value: "source", label: "Source" },
  { value: "type", label: "Type" },
  { value: "pipeline", label: "Pipeline Stage" },
  { value: "date", label: "Date Added" },
  { value: "lastInteractionDate", label: "Last Interaction Date" },
  { value: "nextContactDate", label: "Next Contact Date" },
  { value: "courseOfInterest", label: "Course of Interest" },
];

const OPERATOR_OPTIONS = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "not_contains", label: "Does Not Contain" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "in", label: "In List" },
  { value: "not_in", label: "Not In List" },
  { value: "exists", label: "Has Value" },
  { value: "not_exists", label: "Is Empty" },
];

const STATUS_VALUES = ["New", "Contacted", "Qualified", "Lost", "Converted"];

const PIPELINE_VALUES = [
  "Prospecting",
  "Initial Contact",
  "Meeting Scheduled",
  "Proposal",
  "Negotiation",
  "Closed Won",
  "Closed Lost",
];

const TYPE_VALUES = ["Inbound", "Outbound"];

const SegmentBuilder: React.FC<SegmentBuilderProps> = ({
  onSave,
  onCancel,
  initialSegment,
  showHeader = true,
}) => {
  const [segmentName, setSegmentName] = useState(initialSegment?.name || "");
  const [segmentDescription, setSegmentDescription] = useState(
    initialSegment?.description || "",
  );
  const [criteria, setCriteria] = useState<SegmentCriteria[]>(
    initialSegment?.criteria || [],
  );
  const [segmentType, setSegmentType] = useState<"dynamic" | "static">(
    initialSegment?.type || "dynamic",
  );

  const { toast } = useToast();

  const addCriteria = () => {
    setCriteria([
      ...criteria,
      { field: "name", operator: "equals", value: "" },
    ]);
  };

  const removeCriteria = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const updateCriteria = (
    index: number,
    field: keyof SegmentCriteria,
    value: any,
  ) => {
    const newCriteria = [...criteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    setCriteria(newCriteria);
  };

  const handleSave = () => {
    if (!segmentName.trim()) {
      toast({
        title: "Error",
        description: "Segment name is required",
        variant: "destructive",
      });
      return;
    }

    if (criteria.length === 0) {
      toast({
        title: "Error",
        description: "At least one criterion is required",
        variant: "destructive",
      });
      return;
    }

    // Validate that all criteria have values
    const invalidCriteria = criteria.find(
      (c) =>
        !c.field ||
        !c.operator ||
        (c.operator !== "exists" && c.operator !== "not_exists" && !c.value),
    );

    if (invalidCriteria) {
      toast({
        title: "Error",
        description: "All criteria must have field, operator, and value",
        variant: "destructive",
      });
      return;
    }

    const segment: Segment = {
      id: initialSegment?.id,
      name: segmentName,
      description: segmentDescription,
      criteria,
      type: segmentType,
      lastUpdated: new Date().toISOString(),
    };

    if (onSave) {
      onSave(segment);
    }
  };

  const renderValueInput = (criterion: SegmentCriteria, index: number) => {
    // For exists/not_exists operators, no value input is needed
    if (
      criterion.operator === "exists" ||
      criterion.operator === "not_exists"
    ) {
      return null;
    }

    // For status field, show a dropdown with status options
    if (criterion.field === "status") {
      return (
        <Select
          value={criterion.value || ""}
          onValueChange={(value) => updateCriteria(index, "value", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_VALUES.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // For pipeline field, show a dropdown with pipeline options
    if (criterion.field === "pipeline") {
      return (
        <Select
          value={criterion.value || ""}
          onValueChange={(value) => updateCriteria(index, "value", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select pipeline stage" />
          </SelectTrigger>
          <SelectContent>
            {PIPELINE_VALUES.map((pipeline) => (
              <SelectItem key={pipeline} value={pipeline}>
                {pipeline}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // For type field, show a dropdown with type options
    if (criterion.field === "type") {
      return (
        <Select
          value={criterion.value || ""}
          onValueChange={(value) => updateCriteria(index, "value", value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_VALUES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    // For date fields, show a date input
    if (
      criterion.field === "date" ||
      criterion.field === "lastInteractionDate" ||
      criterion.field === "nextContactDate"
    ) {
      return (
        <Input
          type="date"
          value={criterion.value || ""}
          onChange={(e) => updateCriteria(index, "value", e.target.value)}
          className="w-full"
        />
      );
    }

    // For in/not_in operators, show a textarea for comma-separated values
    if (criterion.operator === "in" || criterion.operator === "not_in") {
      return (
        <Textarea
          placeholder="Enter comma-separated values"
          value={criterion.value || ""}
          onChange={(e) => updateCriteria(index, "value", e.target.value)}
          className="w-full"
        />
      );
    }

    // Default: show a text input
    return (
      <Input
        placeholder="Enter value"
        value={criterion.value || ""}
        onChange={(e) => updateCriteria(index, "value", e.target.value)}
        className="w-full"
      />
    );
  };

  return (
    <Card className="w-full bg-white">
      {showHeader && (
        <CardHeader>
          <CardTitle>Segment Builder</CardTitle>
          <CardDescription>
            Define criteria to target specific leads
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Segment Name</label>
          <Input
            placeholder="Enter segment name"
            value={segmentName}
            onChange={(e) => setSegmentName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea
            placeholder="Enter segment description"
            value={segmentDescription}
            onChange={(e) => setSegmentDescription(e.target.value)}
            className="resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Segment Type</label>
          <Select
            value={segmentType}
            onValueChange={(value: "dynamic" | "static") =>
              setSegmentType(value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select segment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dynamic">
                Dynamic (updates automatically)
              </SelectItem>
              <SelectItem value="static">Static (fixed list)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Criteria</label>
            <Button
              variant="outline"
              size="sm"
              onClick={addCriteria}
              className="flex items-center gap-1"
            >
              <PlusCircle className="h-4 w-4" />
              Add
            </Button>
          </div>

          {criteria.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No criteria defined. Add criteria to define your segment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {criteria.map((criterion, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row gap-2 p-3 border rounded-md relative bg-slate-50"
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCriteria(index)}
                    className="absolute right-1 top-1 h-6 w-6"
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  <div className="flex-1">
                    <Select
                      value={criterion.field}
                      onValueChange={(value) =>
                        updateCriteria(index, "field", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select field" />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    <Select
                      value={criterion.operator}
                      onValueChange={(value: any) =>
                        updateCriteria(index, "operator", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select operator" />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATOR_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1">
                    {renderValueInput(criterion, index)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} className="flex items-center gap-1">
          <Save className="h-4 w-4" />
          Save Segment
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SegmentBuilder;
