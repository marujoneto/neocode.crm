import React, { useState } from "react";
import DashboardHeader from "../layout/DashboardHeader";
import Sidebar from "../layout/Sidebar";
import LeadsTable from "../leads/LeadsTable";
import KanbanBoard from "../leads/KanbanBoard";
import { Button } from "@/components/ui/button";
import { TableProperties, KanbanSquare } from "lucide-react";

interface LeadsPageProps {
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
}

const LeadsPage = ({
  isDarkMode = false,
  onThemeToggle = () => {},
  userName,
  userEmail,
  avatarUrl,
}: LeadsPageProps) => {
  const [view, setView] = useState<"table" | "kanban">("kanban");

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader
        isDarkMode={isDarkMode}
        onThemeToggle={onThemeToggle}
        userName={userName}
        userEmail={userEmail}
        avatarUrl={avatarUrl}
      />

      <div className="flex h-screen pt-16">
        <Sidebar
          className="fixed left-0 h-[calc(100vh-64px)]"
          activeItem="leads"
        />

        <main className="flex-1 ml-[280px] p-6 space-y-6 overflow-auto">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Leads Management
              </h1>
              <div className="flex gap-2">
                <Button
                  variant={view === "table" ? "default" : "outline"}
                  onClick={() => setView("table")}
                >
                  <TableProperties className="h-4 w-4 mr-2" />
                  Table View
                </Button>
                <Button
                  variant={view === "kanban" ? "default" : "outline"}
                  onClick={() => setView("kanban")}
                >
                  <KanbanSquare className="h-4 w-4 mr-2" />
                  Kanban View
                </Button>
              </div>
            </div>

            {view === "table" ? <LeadsTable /> : <KanbanBoard />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LeadsPage;
