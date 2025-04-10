import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, TrashIcon, CopyIcon, BarChart4Icon } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { marketingService, Campaign } from "@/lib/services/firebase/marketing";

interface ABTestingPanelProps {
  campaignId: string;
  initialData?: Campaign["abTest"];
  onSave?: (abTestData: Campaign["abTest"]) => void;
}

interface Variant {
  id: string;
  name: string;
  content: {
    subject?: string;
    body?: string;
  };
  allocation: number;
  metrics?: {
    impressions?: number;
    clicks?: number;
    conversions?: number;
    ctr?: number;
    conversionRate?: number;
  };
}

const ABTestingPanel: React.FC<ABTestingPanelProps> = ({
  campaignId,
  initialData,
  onSave,
}) => {
  const [isEnabled, setIsEnabled] = useState(initialData?.enabled || false);
  const [variants, setVariants] = useState<Variant[]>(
    initialData?.variants || [
      {
        id: "variant-a",
        name: "Variant A (Control)",
        content: { subject: "", body: "" },
        allocation: 50,
        metrics: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          ctr: 0,
          conversionRate: 0,
        },
      },
      {
        id: "variant-b",
        name: "Variant B",
        content: { subject: "", body: "" },
        allocation: 50,
        metrics: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          ctr: 0,
          conversionRate: 0,
        },
      },
    ],
  );
  const [winningVariant, setWinningVariant] = useState<string | undefined>(
    initialData?.winningVariant,
  );
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setIsEnabled(initialData.enabled);
      setVariants(initialData.variants || []);
      setWinningVariant(initialData.winningVariant);
    }
  }, [initialData]);

  const handleAddVariant = () => {
    if (variants.length >= 5) {
      toast({
        title: "Maximum variants reached",
        description: "You can have a maximum of 5 variants in an A/B test.",
        variant: "destructive",
      });
      return;
    }

    const newVariant: Variant = {
      id: `variant-${Math.random().toString(36).substring(2, 9)}`,
      name: `Variant ${String.fromCharCode(65 + variants.length)}`,
      content: { subject: "", body: "" },
      allocation: Math.floor(100 / (variants.length + 1)),
      metrics: {
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        conversionRate: 0,
      },
    };

    // Redistribute allocations
    const newVariants = variants.map((v) => ({
      ...v,
      allocation: Math.floor(100 / (variants.length + 1)),
    }));
    newVariants.push(newVariant);

    // Adjust to ensure total is 100%
    const total = newVariants.reduce((sum, v) => sum + v.allocation, 0);
    if (total < 100 && newVariants.length > 0) {
      newVariants[0].allocation += 100 - total;
    }

    setVariants(newVariants);
  };

  const handleRemoveVariant = (id: string) => {
    if (variants.length <= 2) {
      toast({
        title: "Minimum variants required",
        description: "You need at least 2 variants for an A/B test.",
        variant: "destructive",
      });
      return;
    }

    const newVariants = variants.filter((v) => v.id !== id);

    // Redistribute allocations
    const newTotal = newVariants.reduce((sum, v) => sum + v.allocation, 0);
    const factor = 100 / newTotal;

    const redistributed = newVariants.map((v) => ({
      ...v,
      allocation: Math.floor(v.allocation * factor),
    }));

    // Adjust to ensure total is 100%
    const total = redistributed.reduce((sum, v) => sum + v.allocation, 0);
    if (total < 100 && redistributed.length > 0) {
      redistributed[0].allocation += 100 - total;
    }

    setVariants(redistributed);

    // If the winning variant is being removed, reset it
    if (winningVariant === id) {
      setWinningVariant(undefined);
    }
  };

  const handleVariantChange = (id: string, field: string, value: any) => {
    setVariants(
      variants.map((v) => {
        if (v.id === id) {
          if (field.includes(".")) {
            const [parent, child] = field.split(".");
            return {
              ...v,
              [parent]: {
                ...v[parent as keyof Variant],
                [child]: value,
              },
            };
          }
          return { ...v, [field]: value };
        }
        return v;
      }),
    );
  };

  const handleAllocationChange = (id: string, newAllocation: number) => {
    // Find the variant being changed
    const variantIndex = variants.findIndex((v) => v.id === id);
    if (variantIndex === -1) return;

    // Calculate the difference from the previous allocation
    const oldAllocation = variants[variantIndex].allocation;
    const difference = newAllocation - oldAllocation;

    // Don't allow allocations less than 5%
    if (newAllocation < 5) return;

    // Create a copy of variants
    const newVariants = [...variants];
    newVariants[variantIndex].allocation = newAllocation;

    // Distribute the difference among other variants proportionally
    const otherVariants = newVariants.filter((_, i) => i !== variantIndex);
    const totalOtherAllocation = otherVariants.reduce(
      (sum, v) => sum + v.allocation,
      0,
    );

    if (totalOtherAllocation <= 0) return;

    // Calculate how much to adjust each other variant
    const adjustmentFactor = 1 - difference / totalOtherAllocation;

    // Apply adjustments to other variants
    for (let i = 0; i < newVariants.length; i++) {
      if (i !== variantIndex) {
        newVariants[i].allocation = Math.max(
          5,
          Math.floor(newVariants[i].allocation * adjustmentFactor),
        );
      }
    }

    // Ensure total is 100%
    const total = newVariants.reduce((sum, v) => sum + v.allocation, 0);
    if (total !== 100) {
      // Find the variant with the largest allocation (excluding the one being changed)
      const largestVariantIndex = newVariants
        .map((v, i) =>
          i !== variantIndex
            ? { index: i, allocation: v.allocation }
            : { index: -1, allocation: 0 },
        )
        .filter((v) => v.index !== -1)
        .sort((a, b) => b.allocation - a.allocation)[0]?.index;

      if (largestVariantIndex !== undefined) {
        newVariants[largestVariantIndex].allocation += 100 - total;
      }
    }

    setVariants(newVariants);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const abTestData = {
        enabled: isEnabled,
        variants,
        winningVariant,
      };

      await marketingService.updateABTest(campaignId, abTestData);

      toast({
        title: "Success",
        description: "A/B test settings saved successfully",
      });

      if (onSave) {
        onSave(abTestData);
      }
    } catch (error) {
      console.error("Error saving A/B test settings:", error);
      toast({
        title: "Error",
        description: "Failed to save A/B test settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclareWinner = (variantId: string) => {
    setWinningVariant(variantId);
    toast({
      title: "Winner selected",
      description: `${variants.find((v) => v.id === variantId)?.name} has been declared the winner.`,
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>A/B Testing</CardTitle>
            <CardDescription>
              Create and manage variants to optimize your campaign performance
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
              id="ab-testing-enabled"
            />
            <Label htmlFor="ab-testing-enabled">
              {isEnabled ? "Enabled" : "Disabled"}
            </Label>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isEnabled ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-gray-500 mb-4">
              A/B testing is currently disabled for this campaign
            </p>
            <Button variant="outline" onClick={() => setIsEnabled(true)}>
              Enable A/B Testing
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Variants</h3>
              <Button onClick={handleAddVariant} size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
            </div>

            <div className="space-y-6">
              {variants.map((variant) => (
                <Card key={variant.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <Input
                            value={variant.name}
                            onChange={(e) =>
                              handleVariantChange(
                                variant.id,
                                "name",
                                e.target.value,
                              )
                            }
                            className="font-medium text-lg h-8 w-[200px]"
                          />
                          {winningVariant === variant.id && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Winner
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {variant.metrics?.impressions ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeclareWinner(variant.id)}
                            className="text-green-600"
                          >
                            <BarChart4Icon className="h-4 w-4 mr-2" />
                            Declare Winner
                          </Button>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveVariant(variant.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-3">
                        <Label htmlFor={`${variant.id}-subject`}>
                          Subject Line
                        </Label>
                        <Input
                          id={`${variant.id}-subject`}
                          value={variant.content.subject || ""}
                          onChange={(e) =>
                            handleVariantChange(
                              variant.id,
                              "content.subject",
                              e.target.value,
                            )
                          }
                          placeholder="Enter subject line for this variant"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`${variant.id}-allocation`}>
                          Allocation
                        </Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            id={`${variant.id}-allocation`}
                            value={[variant.allocation]}
                            min={5}
                            max={95}
                            step={5}
                            onValueChange={(value) =>
                              handleAllocationChange(variant.id, value[0])
                            }
                          />
                          <span className="w-12 text-right">
                            {variant.allocation}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`${variant.id}-body`}>Email Body</Label>
                      <Textarea
                        id={`${variant.id}-body`}
                        value={variant.content.body || ""}
                        onChange={(e) =>
                          handleVariantChange(
                            variant.id,
                            "content.body",
                            e.target.value,
                          )
                        }
                        placeholder="Enter email content for this variant"
                        className="min-h-[100px]"
                      />
                    </div>

                    {variant.metrics?.impressions ? (
                      <div className="pt-2">
                        <h4 className="text-sm font-medium mb-2">
                          Performance Metrics
                        </h4>
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Impressions</p>
                            <p className="font-medium">
                              {variant.metrics.impressions.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Clicks</p>
                            <p className="font-medium">
                              {variant.metrics.clicks?.toLocaleString() || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">CTR</p>
                            <p className="font-medium">
                              {variant.metrics.ctr?.toFixed(2) || 0}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Conversions</p>
                            <p className="font-medium">
                              {variant.metrics.conversions?.toLocaleString() ||
                                0}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">
                            Conversion Rate
                          </p>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={variant.metrics.conversionRate || 0}
                              className="h-2 flex-1"
                            />
                            <span className="text-xs font-medium">
                              {variant.metrics.conversionRate?.toFixed(2) || 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>

            {variants.length > 0 && (
              <div className="pt-4">
                <h3 className="text-lg font-medium mb-2">Traffic Allocation</h3>
                <div className="h-8 w-full flex rounded-md overflow-hidden">
                  {variants.map((variant, index) => (
                    <div
                      key={variant.id}
                      className="h-full flex items-center justify-center text-xs text-white font-medium"
                      style={{
                        width: `${variant.allocation}%`,
                        backgroundColor: getVariantColor(index),
                      }}
                    >
                      {variant.allocation}%
                    </div>
                  ))}
                </div>
                <div className="flex mt-2">
                  {variants.map((variant, index) => (
                    <div key={variant.id} className="flex items-center mr-4">
                      <div
                        className="w-3 h-3 rounded-full mr-1"
                        style={{ backgroundColor: getVariantColor(index) }}
                      ></div>
                      <span className="text-xs">{variant.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => {
            setIsEnabled(initialData?.enabled || false);
            setVariants(initialData?.variants || []);
            setWinningVariant(initialData?.winningVariant);
          }}
          disabled={isLoading}
        >
          Reset
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Saving..." : "Save A/B Test Settings"}
        </Button>
      </CardFooter>
    </Card>
  );
};

// Helper function to get color based on variant index
const getVariantColor = (index: number) => {
  const colors = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // violet
    "#ef4444", // red
  ];
  return colors[index % colors.length];
};

export default ABTestingPanel;
