import React from "react";
import DashboardHeader from "../layout/DashboardHeader";
import Sidebar from "../layout/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, BarChart2, PieChart, LineChart } from "lucide-react";

interface ReportsPageProps {
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
}

const ReportsPage = ({
  isDarkMode = false,
  onThemeToggle = () => {},
  userName = "John Doe",
  userEmail = "john@example.com",
  avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
}: ReportsPageProps) => {
  const reports = [
    {
      title: "Lead Conversion Report",
      description: "Analysis of lead conversion rates and trends",
      icon: <LineChart className="h-8 w-8 text-blue-500" />,
    },
    {
      title: "Course Performance Report",
      description: "Overview of course completion and success rates",
      icon: <BarChart2 className="h-8 w-8 text-green-500" />,
    },
    {
      title: "Revenue Analysis",
      description: "Financial performance and revenue breakdown",
      icon: <PieChart className="h-8 w-8 text-purple-500" />,
    },
  ];

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
          activeItem="reports"
        />

        <main className="flex-1 ml-[280px] p-6 space-y-6 overflow-auto">
          <div className="max-w-[1200px] mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Reports</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {report.icon}
                      </div>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      {report.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {report.description}
                    </p>
                    <Button className="w-full mt-4">View Report</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportsPage;
