import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Campaign, SegmentCriteria } from "@/lib/services/firebase/marketing";
import {
  AlertCircle,
  Calendar,
  DollarSign,
  Mail,
  Tag,
  Target,
  Users,
} from "lucide-react";

interface CampaignDetailsProps {
  campaign: Campaign;
}

const CampaignDetails: React.FC<CampaignDetailsProps> = ({ campaign }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getOperatorLabel = (operator: string): string => {
    const operatorMap: Record<string, string> = {
      equals: "equals",
      not_equals: "does not equal",
      contains: "contains",
      not_contains: "does not contain",
      greater_than: "is greater than",
      less_than: "is less than",
      in: "is in",
      not_in: "is not in",
      exists: "exists",
      not_exists: "does not exist",
    };
    return operatorMap[operator] || operator;
  };

  const renderSegmentCriteria = (criteria: SegmentCriteria[]) => {
    if (!criteria || criteria.length === 0) {
      return (
        <p className="text-muted-foreground">No segment criteria defined</p>
      );
    }

    return (
      <div className="space-y-2">
        {criteria.map((criterion, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <Badge variant="outline" className="font-mono">
              {criterion.field}
            </Badge>
            <span className="text-muted-foreground">
              {getOperatorLabel(criterion.operator)}
            </span>
            <Badge variant="secondary">
              {Array.isArray(criterion.value)
                ? criterion.value.join(", ")
                : String(criterion.value)}
            </Badge>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Target Audience
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaign.audience?.segmentData ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">
                    Segment: {campaign.audience.segmentData.name}
                  </h4>
                  <Badge className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {campaign.audience.segmentData.leadCount || "0"} Leads
                  </Badge>
                </div>

                {campaign.audience.segmentData.description && (
                  <p className="text-sm text-muted-foreground">
                    {campaign.audience.segmentData.description}
                  </p>
                )}

                <div className="pt-2">
                  <h5 className="text-sm font-medium mb-2">Criteria:</h5>
                  {renderSegmentCriteria(
                    campaign.audience.segmentData.criteria,
                  )}
                </div>
              </div>
            ) : campaign.audience?.segmentCriteria ? (
              <div className="space-y-2">
                <h4 className="font-medium">Custom Segment</h4>
                {renderSegmentCriteria(campaign.audience.segmentCriteria)}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                <span>No audience segment defined</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm font-medium">Subject:</div>
                <div className="col-span-2 text-sm">
                  {campaign.content?.subject || "Not set"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm font-medium">Template:</div>
                <div className="col-span-2 text-sm">
                  {campaign.content?.template &&
                  campaign.content.template !== "none"
                    ? campaign.content.template
                    : "None"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm font-medium">Start Date:</div>
                <div className="col-span-2 text-sm">
                  {formatDate(campaign.schedule?.startDate)}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm font-medium">End Date:</div>
                <div className="col-span-2 text-sm">
                  {formatDate(campaign.schedule?.endDate)}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm font-medium">Frequency:</div>
                <div className="col-span-2 text-sm">
                  {campaign.schedule?.frequency || "Once"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm font-medium">Send Time:</div>
                <div className="col-span-2 text-sm">
                  {campaign.schedule?.sendTime || "Not set"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm font-medium">Total:</div>
                <div className="col-span-2 text-sm">
                  {campaign.budget
                    ? `${campaign.budget.total} ${campaign.budget.currency}`
                    : "Not set"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm font-medium">Spent:</div>
                <div className="col-span-2 text-sm">
                  {campaign.budget
                    ? `${campaign.budget.spent} ${campaign.budget.currency}`
                    : "Not set"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            {campaign.tags && campaign.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {campaign.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tags</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CampaignDetails;
