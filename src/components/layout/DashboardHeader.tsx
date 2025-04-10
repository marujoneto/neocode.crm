import React, { useState } from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import NotificationsPopover from "./NotificationsPopover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import UserProfileDialog from "../profile/UserProfileDialog";

interface DashboardHeaderProps {
  userEmail?: string;
  userName?: string;
  avatarUrl?: string;
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
  notifications?: Array<{ id: string; message: string }>;
}

const DashboardHeader = ({
  userEmail = "user@example.com",
  userName = "John Doe",
  avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=default",
  isDarkMode = false,
  onThemeToggle = () => {},
  notifications = [
    { id: "1", message: "New lead assigned" },
    { id: "2", message: "Meeting reminder" },
    { id: "3", message: "Task completed" },
  ],
}: DashboardHeaderProps) => {
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  return (
    <header className="h-16 w-full bg-white border-b border-gray-200 px-4 flex items-center justify-between fixed top-0 z-50">
      <div className="flex-1">
        <h1 className="text-xl font-bold text-gray-800">Neo Code CRM</h1>
      </div>

      <div className="flex items-center space-x-4">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onThemeToggle}
                className="h-9 w-9"
              >
                {isDarkMode ? (
                  <SunIcon className="h-5 w-5" />
                ) : (
                  <MoonIcon className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle theme</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <NotificationsPopover />

        <Button
          variant="ghost"
          className="h-9 gap-2 pl-0"
          onClick={() => setShowProfileDialog(true)}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={userName} />
            <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{userName}</span>
        </Button>

        <UserProfileDialog
          isOpen={showProfileDialog}
          onClose={() => setShowProfileDialog(false)}
          userName={userName}
          userEmail={userEmail}
          avatarUrl={avatarUrl}
        />
      </div>
    </header>
  );
};

export default DashboardHeader;
