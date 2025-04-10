import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  marketingService,
  Campaign,
  CampaignMetrics,
} from "@/lib/services/firebase/marketing";
import MetricCard from "@/components/dashboard/MetricCard";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import {
  BarChart3Icon,
  TrendingUpIcon,
  EyeIcon,
  MousePointerClickIcon,
  MailIcon,
  MessageSquareIcon,
  CheckCircleIcon,
  DollarSignIcon,
  PercentIcon,
  DownloadIcon,
  RefreshCwIcon,
  CalendarIcon,
} from "lucide-react";

interface ReportsDashboardProps {
  campaignId?: string;
}

const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ campaignId }) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("7days");
  const [activeTab, setActiveTab] = useState("overview");

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (campaignId) {
        // Fetch single campaign
        const campaignData = await marketingService.getById(campaignId);
        setCampaign(campaignData);
      } else {
        // Fetch all campaigns for overview
        const campaigns = await marketingService.getAll();
        setAllCampaigns(campaigns);
      }
    } catch (error) {
      console.error("Error fetching campaign data:", error);
      toast({
        title: "Error",
        description: "Failed to load campaign data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate aggregate metrics for all campaigns
  const calculateAggregateMetrics = (): CampaignMetrics => {
    const metrics: CampaignMetrics = {
      impressions: 0,
      clicks: 0,
      opens: 0,
      responses: 0,
      conversions: 0,
      cost: 0,
      revenue: 0,
      roi: 0,
      ctr: 0,
      conversionRate: 0,
    };

    const activeCampaigns = allCampaigns.filter((c) => c.metrics);

    if (activeCampaigns.length === 0) return metrics;

    // Sum up all metrics
    activeCampaigns.forEach((campaign) => {
      if (!campaign.metrics) return;

      metrics.impressions =
        (metrics.impressions || 0) + (campaign.metrics.impressions || 0);
      metrics.clicks = (metrics.clicks || 0) + (campaign.metrics.clicks || 0);
      metrics.opens = (metrics.opens || 0) + (campaign.metrics.opens || 0);
      metrics.responses =
        (metrics.responses || 0) + (campaign.metrics.responses || 0);
      metrics.conversions =
        (metrics.conversions || 0) + (campaign.metrics.conversions || 0);
      metrics.cost = (metrics.cost || 0) + (campaign.metrics.cost || 0);
      metrics.revenue =
        (metrics.revenue || 0) + (campaign.metrics.revenue || 0);
    });

    // Calculate derived metrics
    if (metrics.impressions && metrics.impressions > 0) {
      metrics.ctr = ((metrics.clicks || 0) / metrics.impressions) * 100;
      metrics.conversionRate =
        ((metrics.conversions || 0) / metrics.impressions) * 100;
    }

    if (metrics.cost && metrics.cost > 0) {
      metrics.roi =
        (((metrics.revenue || 0) - metrics.cost) / metrics.cost) * 100;
    }

    return metrics;
  };

  const aggregateMetrics = calculateAggregateMetrics();

  // Get top performing campaigns
  const getTopCampaigns = () => {
    return allCampaigns
      .filter((c) => c.metrics && c.metrics.conversions)
      .sort(
        (a, b) => (b.metrics?.conversions || 0) - (a.metrics?.conversions || 0),
      )
      .slice(0, 5);
  };

  const topCampaigns = getTopCampaigns();

  // Helper function to format numbers
  const formatNumber = (num: number | undefined, decimals = 0) => {
    if (num === undefined) return "0";
    return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
  };

  // Helper function to format currency
  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return "$0";
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleRefresh = () => {
    fetchData();
    toast({
      title: "Refreshed",
      description: "Report data has been refreshed",
    });
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your report is being prepared for download",
    });
    // In a real implementation, this would generate and download a CSV/PDF
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCwIcon className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p>Loading campaign data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">
            {campaign
              ? `${campaign.name} - Analytics`
              : "Marketing Analytics Dashboard"}
          </h2>
          <p className="text-gray-500">
            {campaign
              ? `Campaign performance metrics and insights`
              : "Overview of all marketing campaigns performance"}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <CalendarIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
              <SelectItem value="alltime">All time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="roi">ROI</TabsTrigger>
          {campaign?.abTest?.enabled && (
            <TabsTrigger value="abtest">A/B Testing</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Impressions"
              value={formatNumber(
                campaign?.metrics?.impressions || aggregateMetrics.impressions,
              )}
              icon={<EyeIcon className="h-5 w-5" />}
              trend={12}
              description="Total campaign views"
              color="blue"
            />
            <MetricCard
              title="Clicks"
              value={formatNumber(
                campaign?.metrics?.clicks || aggregateMetrics.clicks,
              )}
              icon={<MousePointerClickIcon className="h-5 w-5" />}
              trend={8}
              description="Total clicks received"
              color="green"
            />
            <MetricCard
              title="Conversions"
              value={formatNumber(
                campaign?.metrics?.conversions || aggregateMetrics.conversions,
              )}
              icon={<CheckCircleIcon className="h-5 w-5" />}
              trend={15}
              description="Total conversions"
              color="purple"
            />
            <MetricCard
              title="Revenue"
              value={formatCurrency(
                campaign?.metrics?.revenue || aggregateMetrics.revenue,
              )}
              icon={<DollarSignIcon className="h-5 w-5" />}
              trend={23}
              description="Total revenue generated"
              color="amber"
            />
          </div>

          {!campaign && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Top Performing Campaigns
                </CardTitle>
                <CardDescription>
                  Campaigns with highest conversion rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topCampaigns.length > 0 ? (
                  <div className="space-y-4">
                    {topCampaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {campaign.type === "Email" ? (
                            <MailIcon className="h-5 w-5 text-blue-500" />
                          ) : campaign.type === "SMS" ? (
                            <MessageSquareIcon className="h-5 w-5 text-green-500" />
                          ) : (
                            <BarChart3Icon className="h-5 w-5 text-purple-500" />
                          )}
                          <div>
                            <p className="font-medium">{campaign.name}</p>
                            <p className="text-sm text-gray-500">
                              {campaign.schedule?.startDate
                                ? `Started ${format(new Date(campaign.schedule.startDate), "MMM d, yyyy")}`
                                : "Not scheduled"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatNumber(campaign.metrics?.conversions)}{" "}
                            conversions
                          </p>
                          <div className="flex items-center gap-1">
                            <Progress
                              value={
                                campaign.metrics?.impressions
                                  ? ((campaign.metrics?.conversions || 0) /
                                      campaign.metrics?.impressions) *
                                    100
                                  : 0
                              }
                              className="h-2 w-24"
                            />
                            <span className="text-sm text-gray-500">
                              {formatNumber(
                                campaign.metrics?.impressions
                                  ? ((campaign.metrics?.conversions || 0) /
                                      campaign.metrics?.impressions) *
                                      100
                                  : 0,
                                1,
                              )}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-4 text-gray-500">
                    No campaign data available
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {campaign && campaign.funnel && campaign.funnel.steps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Funnel Performance</CardTitle>
                <CardDescription>
                  Conversion rates through funnel stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaign.funnel.steps.map((step, index) => {
                    const stepMetrics = step.metrics || {};
                    const conversionRate = stepMetrics.sent
                      ? ((stepMetrics.converted || 0) / stepMetrics.sent) * 100
                      : 0;

                    return (
                      <div key={step.id} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <p className="font-medium">{step.name}</p>
                          <p className="text-sm">
                            {formatNumber(stepMetrics.converted || 0)} /{" "}
                            {formatNumber(stepMetrics.sent || 0)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={conversionRate}
                            className="h-2 flex-1"
                          />
                          <span className="text-sm font-medium">
                            {formatNumber(conversionRate, 1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Open Rate"
              value={`${formatNumber(
                campaign?.metrics?.impressions && campaign.metrics.opens
                  ? (campaign.metrics.opens / campaign.metrics.impressions) *
                      100
                  : aggregateMetrics.opens && aggregateMetrics.impressions
                    ? (aggregateMetrics.opens / aggregateMetrics.impressions) *
                      100
                    : 0,
                1,
              )}%`}
              icon={<MailIcon className="h-5 w-5" />}
              trend={5}
              description="Email open rate"
              color="blue"
            />
            <MetricCard
              title="Click-Through Rate"
              value={`${formatNumber(campaign?.metrics?.ctr || aggregateMetrics.ctr || 0, 1)}%`}
              icon={<MousePointerClickIcon className="h-5 w-5" />}
              trend={-2}
              description="Percentage of impressions that resulted in clicks"
              color="green"
            />
            <MetricCard
              title="Bounce Rate"
              value={`${formatNumber(campaign?.metrics?.bounceRate || 0, 1)}%`}
              icon={<TrendingUpIcon className="h-5 w-5" />}
              trend={-8}
              trendDirection="down"
              description="Percentage of users who left immediately"
              color="red"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Engagement Metrics</CardTitle>
              <CardDescription>Detailed engagement statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Impressions
                    </p>
                    <p className="text-2xl font-bold">
                      {formatNumber(
                        campaign?.metrics?.impressions ||
                          aggregateMetrics.impressions,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Clicks
                    </p>
                    <p className="text-2xl font-bold">
                      {formatNumber(
                        campaign?.metrics?.clicks || aggregateMetrics.clicks,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Opens
                    </p>
                    <p className="text-2xl font-bold">
                      {formatNumber(
                        campaign?.metrics?.opens || aggregateMetrics.opens,
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Responses
                    </p>
                    <p className="text-2xl font-bold">
                      {formatNumber(
                        campaign?.metrics?.responses ||
                          aggregateMetrics.responses,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Conversion Rate"
              value={`${formatNumber(campaign?.metrics?.conversionRate || aggregateMetrics.conversionRate || 0, 1)}%`}
              icon={<CheckCircleIcon className="h-5 w-5" />}
              trend={7}
              description="Percentage of visitors who converted"
              color="purple"
            />
            <MetricCard
              title="Total Conversions"
              value={formatNumber(
                campaign?.metrics?.conversions || aggregateMetrics.conversions,
              )}
              icon={<CheckCircleIcon className="h-5 w-5" />}
              trend={12}
              description="Number of successful conversions"
              color="green"
            />
            <MetricCard
              title="Cost Per Conversion"
              value={formatCurrency(
                campaign?.metrics?.cost && campaign.metrics.conversions
                  ? campaign.metrics.cost / campaign.metrics.conversions
                  : aggregateMetrics.cost && aggregateMetrics.conversions
                    ? aggregateMetrics.cost / aggregateMetrics.conversions
                    : 0,
              )}
              icon={<DollarSignIcon className="h-5 w-5" />}
              trend={-5}
              trendDirection="down"
              description="Average cost per conversion"
              color="amber"
            />
          </div>
        </TabsContent>

        <TabsContent value="roi" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard
              title="Total Cost"
              value={formatCurrency(
                campaign?.metrics?.cost || aggregateMetrics.cost,
              )}
              icon={<DollarSignIcon className="h-5 w-5" />}
              description="Total campaign spend"
              color="red"
            />
            <MetricCard
              title="Total Revenue"
              value={formatCurrency(
                campaign?.metrics?.revenue || aggregateMetrics.revenue,
              )}
              icon={<DollarSignIcon className="h-5 w-5" />}
              trend={15}
              description="Total revenue generated"
              color="green"
            />
            <MetricCard
              title="ROI"
              value={`${formatNumber(campaign?.metrics?.roi || aggregateMetrics.roi || 0, 1)}%`}
              icon={<PercentIcon className="h-5 w-5" />}
              trend={8}
              description="Return on investment"
              color="blue"
            />
          </div>
        </TabsContent>

        {campaign?.abTest?.enabled && (
          <TabsContent value="abtest" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">A/B Test Results</CardTitle>
                <CardDescription>
                  Performance comparison between variants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {campaign.abTest.variants.map((variant) => {
                    const conversionRate = variant.metrics?.impressions
                      ? ((variant.metrics.conversions || 0) /
                          variant.metrics.impressions) *
                        100
                      : 0;

                    return (
                      <div key={variant.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">{variant.name}</p>
                            <p className="text-sm text-gray-500">
                              {formatNumber(variant.allocation)}% of traffic
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {formatNumber(conversionRate, 1)}% conversion
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatNumber(variant.metrics?.conversions || 0)}{" "}
                              /{" "}
                              {formatNumber(variant.metrics?.impressions || 0)}
                            </p>
                          </div>
                        </div>
                        <Progress
                          value={conversionRate}
                          className={`h-2 ${variant.id === campaign.abTest.winningVariant ? "bg-green-500" : ""}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ReportsDashboard;
