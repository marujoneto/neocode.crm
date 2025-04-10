import React from "react";
import DashboardHeader from "../layout/DashboardHeader";
import Sidebar from "../layout/Sidebar";
import CoursesTable from "../courses/CoursesTable";

interface CoursesPageProps {
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
}

const CoursesPage = ({
  isDarkMode = false,
  onThemeToggle = () => {},
  userName,
  userEmail,
  avatarUrl,
}: CoursesPageProps) => {
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
          activeItem="courses"
        />

        <main className="flex-1 ml-[280px] p-6 space-y-6 overflow-auto">
          <div className="max-w-[1200px] mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              Courses Management
            </h1>

            <CoursesTable />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CoursesPage;
