import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CampaignsTable from "@/components/marketing/CampaignsTable";
import CampaignForm from "@/components/marketing/CampaignForm";
import FunnelBuilder from "@/components/marketing/FunnelBuilder";
import ReportsDashboard from "@/components/marketing/ReportsDashboard";
import EmailTemplatesManager from "@/components/marketing/EmailTemplatesManager";
import ABTestingPanel from "@/components/marketing/ABTestingPanel";
import { Campaign } from "@/lib/services/firebase/marketing";
import { useToast } from "@/components/ui/use-toast";
import DashboardHeader from "@/components/layout/DashboardHeader";
import Sidebar from "@/components/layout/Sidebar";

interface MarketingPageProps {
  isDarkMode: boolean;
  onThemeToggle: () => void;
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
}

const MarketingPage: React.FC<MarketingPageProps> = ({
  isDarkMode,
  onThemeToggle,
  userName,
  userEmail,
  avatarUrl,
}) => {
  const [activeTab, setActiveTab] = useState("campaigns");
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [isEditingCampaign, setIsEditingCampaign] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null,
  );
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    null,
  );

  const { toast } = useToast();

  const handleCreateCampaign = () => {
    setIsCreatingCampaign(true);
    setActiveTab("form");
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setIsEditingCampaign(true);
    setActiveTab("form");
  };

  const handleViewCampaign = (campaign: Campaign) => {
    setSelectedCampaignId(campaign.id!);
    setActiveTab("reports");
  };

  const handleCampaignFormSuccess = (campaign: Campaign) => {
    setIsCreatingCampaign(false);
    setIsEditingCampaign(false);
    setSelectedCampaign(null);
    setActiveTab("campaigns");

    toast({
      title: "Success",
      description: `Campaign ${isEditingCampaign ? "updated" : "created"} successfully`,
    });
  };

  const handleCampaignFormCancel = () => {
    setIsCreatingCampaign(false);
    setIsEditingCampaign(false);
    setSelectedCampaign(null);
    setActiveTab("campaigns");
  };

  const handleFunnelBuilderSuccess = (campaign: Campaign) => {
    toast({
      title: "Success",
      description: "Funnel updated successfully",
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="fixed left-0 top-0 w-full z-10">
        <DashboardHeader
          isDarkMode={isDarkMode}
          onThemeToggle={onThemeToggle}
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
        />
      </div>
      <Sidebar className="fixed left-0 top-16 h-[calc(100vh-4rem)]" />
      <div className="flex flex-col flex-1 ml-[280px]">
        <main className="flex-1 overflow-y-auto pt-24 px-6 pb-6 bg-[#F2F4F6] dark:bg-gray-900">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Marketing Campaigns
            </h1>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
                {(isCreatingCampaign || isEditingCampaign) && (
                  <TabsTrigger value="form">
                    {isEditingCampaign ? "Edit Campaign" : "Create Campaign"}
                  </TabsTrigger>
                )}
                {selectedCampaignId && (
                  <TabsTrigger value="funnel">Funnel Builder</TabsTrigger>
                )}
                {selectedCampaignId && (
                  <TabsTrigger value="abtest">A/B Testing</TabsTrigger>
                )}
                <TabsTrigger value="templates">Email Templates</TabsTrigger>
                <TabsTrigger value="reports">Reports & Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="campaigns" className="space-y-6">
                <CampaignsTable
                  onCreateCampaign={handleCreateCampaign}
                  onEditCampaign={handleEditCampaign}
                  onViewCampaign={handleViewCampaign}
                />
              </TabsContent>

              <TabsContent value="form" className="space-y-6">
                {(isCreatingCampaign || isEditingCampaign) && (
                  <CampaignForm
                    campaign={selectedCampaign}
                    onSuccess={handleCampaignFormSuccess}
                    onCancel={handleCampaignFormCancel}
                  />
                )}
              </TabsContent>

              <TabsContent value="funnel" className="space-y-6">
                {selectedCampaignId && (
                  <FunnelBuilder
                    campaignId={selectedCampaignId}
                    onSave={handleFunnelBuilderSuccess}
                  />
                )}
              </TabsContent>

              <TabsContent value="abtest" className="space-y-6">
                {selectedCampaignId && (
                  <ABTestingPanel
                    campaignId={selectedCampaignId}
                    onSave={() => {
                      toast({
                        title: "Success",
                        description: "A/B test settings updated successfully",
                      });
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent value="templates" className="space-y-6">
                <EmailTemplatesManager />
              </TabsContent>

              <TabsContent value="reports" className="space-y-6">
                <ReportsDashboard
                  campaignId={selectedCampaignId || undefined}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MarketingPage;
