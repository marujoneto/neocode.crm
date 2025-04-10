import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontalIcon,
  PlusIcon,
  SearchIcon,
  FilterIcon,
  ArrowUpDownIcon,
  MailIcon,
  MessageSquareIcon,
  GlobeIcon,
  CreditCardIcon,
  CalendarIcon,
  UsersIcon,
  CopyIcon,
  TrashIcon,
  PauseIcon,
  PlayIcon,
  EditIcon,
  BarChart4Icon,
} from "lucide-react";
import {
  marketingService,
  Campaign,
  CampaignType,
  CampaignStatus,
} from "@/lib/services/firebase/marketing";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

interface CampaignsTableProps {
  onCreateCampaign?: () => void;
  onEditCampaign?: (campaign: Campaign) => void;
  onViewCampaign?: (campaign: Campaign) => void;
}

const getCampaignTypeIcon = (type: CampaignType) => {
  switch (type) {
    case "Email":
      return <MailIcon className="h-4 w-4" />;
    case "SMS":
      return <MessageSquareIcon className="h-4 w-4" />;
    case "Social":
      return <GlobeIcon className="h-4 w-4" />;
    case "PaidAds":
      return <CreditCardIcon className="h-4 w-4" />;
    case "Event":
    case "Webinar":
      return <CalendarIcon className="h-4 w-4" />;
    case "Direct":
      return <UsersIcon className="h-4 w-4" />;
    case "Multi-channel":
      return <BarChart4Icon className="h-4 w-4" />;
    default:
      return <MailIcon className="h-4 w-4" />;
  }
};

const getStatusBadgeColor = (status: CampaignStatus) => {
  switch (status) {
    case "Draft":
      return "bg-gray-200 text-gray-800";
    case "Scheduled":
      return "bg-blue-100 text-blue-800";
    case "Active":
      return "bg-green-100 text-green-800";
    case "Paused":
      return "bg-yellow-100 text-yellow-800";
    case "Completed":
      return "bg-purple-100 text-purple-800";
    case "Cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-200 text-gray-800";
  }
};

const CampaignsTable: React.FC<CampaignsTableProps> = ({
  onCreateCampaign,
  onEditCampaign,
  onViewCampaign,
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<CampaignType | "">("");
  const [filterStatus, setFilterStatus] = useState<CampaignStatus | "">("");
  const [sortField, setSortField] = useState<keyof Campaign>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const data = await marketingService.getAll();
      setCampaigns(data);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Campaign) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDuplicate = async (campaign: Campaign) => {
    try {
      await marketingService.duplicateCampaign(campaign.id!);
      toast({
        title: "Success",
        description: "Campaign duplicated successfully",
      });
      fetchCampaigns();
    } catch (error) {
      console.error("Error duplicating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate campaign",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await marketingService.delete(id);
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
      fetchCampaigns();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (id: string, status: CampaignStatus) => {
    try {
      await marketingService.updateCampaignStatus(id, status);
      toast({
        title: "Success",
        description: `Campaign ${status.toLowerCase()} successfully`,
      });
      fetchCampaigns();
    } catch (error) {
      console.error("Error updating campaign status:", error);
      toast({
        title: "Error",
        description: "Failed to update campaign status",
        variant: "destructive",
      });
    }
  };

  const filteredCampaigns = campaigns
    .filter((campaign) => {
      const matchesSearch = campaign.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesType = !filterType || campaign.type === filterType;
      const matchesStatus = !filterStatus || campaign.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      if (!a[sortField] || !b[sortField]) return 0;

      let valueA = a[sortField];
      let valueB = b[sortField];

      // Handle dates
      if (typeof valueA === "string" && valueA.includes("-")) {
        valueA = new Date(valueA).getTime();
        valueB = new Date(valueB as string).getTime();
      }

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <div className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Marketing Campaigns</h2>
        <Button onClick={onCreateCampaign}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative w-full sm:w-64">
          <SearchIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search campaigns..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <FilterIcon className="h-4 w-4" />
                Type
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterType("")}>
                All Types
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterType("Email")}>
                Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("SMS")}>
                SMS
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("Social")}>
                Social
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("PaidAds")}>
                Paid Ads
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("Event")}>
                Event
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("Webinar")}>
                Webinar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("Direct")}>
                Direct
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType("Multi-channel")}>
                Multi-channel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex gap-2">
                <FilterIcon className="h-4 w-4" />
                Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterStatus("")}>
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterStatus("Draft")}>
                Draft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("Scheduled")}>
                Scheduled
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("Active")}>
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("Paused")}>
                Paused
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("Completed")}>
                Completed
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterStatus("Cancelled")}>
                Cancelled
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={() => fetchCampaigns()}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort("name")}
                >
                  Campaign Name
                  <ArrowUpDownIcon className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort("type")}
                >
                  Type
                  <ArrowUpDownIcon className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  Status
                  <ArrowUpDownIcon className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleSort("schedule.startDate")}
                >
                  Start Date
                  <ArrowUpDownIcon className="ml-2 h-4 w-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  Loading campaigns...
                </TableCell>
              </TableRow>
            ) : filteredCampaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  No campaigns found. Create your first campaign!
                </TableCell>
              </TableRow>
            ) : (
              filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getCampaignTypeIcon(campaign.type)}
                      <span>{campaign.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{campaign.type}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {campaign.schedule?.startDate
                      ? format(
                          new Date(campaign.schedule.startDate),
                          "MMM d, yyyy",
                        )
                      : "Not scheduled"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => onViewCampaign?.(campaign)}
                        >
                          <BarChart4Icon className="mr-2 h-4 w-4" />
                          View Analytics
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onEditCampaign?.(campaign)}
                        >
                          <EditIcon className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicate(campaign)}
                        >
                          <CopyIcon className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {campaign.status === "Active" ? (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(campaign.id!, "Paused")
                            }
                          >
                            <PauseIcon className="mr-2 h-4 w-4" />
                            Pause
                          </DropdownMenuItem>
                        ) : campaign.status === "Paused" ||
                          campaign.status === "Draft" ? (
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(campaign.id!, "Active")
                            }
                          >
                            <PlayIcon className="mr-2 h-4 w-4" />
                            Activate
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          onClick={() => handleDelete(campaign.id!)}
                          className="text-red-600"
                        >
                          <TrashIcon className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CampaignsTable;
