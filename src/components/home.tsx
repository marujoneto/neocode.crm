import React, { useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import DashboardHeader from "./layout/DashboardHeader";
import Sidebar from "./layout/Sidebar";
import MetricsGrid from "./dashboard/MetricsGrid";
import LeadsTable from "./leads/LeadsTable";
import AIChatWidget from "./chat/AIChatWidget";
import ActivityLogList from "./dashboard/ActivityLogList";
import MessageCenter from "./communications/MessageCenter";
import AnnouncementBanner from "./communications/AnnouncementBanner";
import VerifyEmailBanner from "./auth/VerifyEmailBanner";

interface HomeProps {
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
}

const Home = ({ isDarkMode = false, onThemeToggle = () => {} }: HomeProps) => {
  const { user, authUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100">
      <DashboardHeader
        isDarkMode={isDarkMode}
        onThemeToggle={onThemeToggle}
        userName={user?.displayName || authUser?.displayName}
        userEmail={user?.email || authUser?.email}
      />

      <div className="flex h-screen pt-16">
        <Sidebar className="fixed left-0 h-[calc(100vh-64px)]" />

        <main className="flex-1 ml-[280px] p-6 space-y-6 overflow-auto">
          <div className="max-w-[1200px] mx-auto">
            <VerifyEmailBanner />
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Dashboard Overview
            </h1>

            <MetricsGrid />

            <AnnouncementBanner />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow">
                  <div className="p-4 border-b">
                    <h2 className="text-xl font-semibold">Recent Leads</h2>
                  </div>
                  <div className="p-4">
                    <LeadsTable />
                  </div>
                </div>
              </div>
              <div className="lg:col-span-1 space-y-6">
                <MessageCenter />
                <ActivityLogList />
              </div>
            </div>
          </div>
        </main>
      </div>

      <AIChatWidget />
    </div>
  );
};

export default Home;
