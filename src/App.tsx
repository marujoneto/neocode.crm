import { Suspense, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LoginPage from "@/components/auth/LoginPage";
import EmailVerification from "@/components/auth/EmailVerification";
import Home from "./components/home";
import StudentsPage from "./components/pages/StudentsPage";
import StudentDetailPage from "./components/pages/StudentDetailPage";
import LeadsPage from "./components/pages/LeadsPage";
import LeadDetailPage from "./components/pages/LeadDetailPage";
import InstructorsPage from "./components/pages/InstructorsPage";
import CoursesPage from "./components/pages/CoursesPage";
import ReportsPage from "./components/pages/ReportsPage";
import CompaniesPage from "./components/pages/CompaniesPage";
import ContactsPage from "./components/pages/ContactsPage";
import UsersPage from "./components/pages/UsersPage";
import SettingsPage from "./components/pages/SettingsPage";
import MarketingPage from "./components/pages/MarketingPage";
import AIChatWidget from "./components/chat/AIChatWidget";
import LeadNotificationChecker from "./components/leads/LeadNotificationChecker";

function App() {
  const { user, authUser } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const userName = user?.displayName || authUser?.displayName;
  const userEmail = user?.email || authUser?.email;
  const avatarUrl =
    authUser?.photoURL ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName || "default"}`;

  const handleThemeToggle = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          Loading...
        </div>
      }
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<EmailVerification />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home isDarkMode={isDarkMode} onThemeToggle={handleThemeToggle} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <StudentsPage
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                userName={userName}
                userEmail={userEmail}
                avatarUrl={avatarUrl}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/detail/:id"
          element={
            <ProtectedRoute>
              <StudentDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/instructors"
          element={
            <ProtectedRoute>
              <InstructorsPage
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                userName={userName}
                userEmail={userEmail}
                avatarUrl={avatarUrl}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leads"
          element={
            <ProtectedRoute>
              <LeadsPage
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                userName={userName}
                userEmail={userEmail}
                avatarUrl={avatarUrl}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leads/detail/:id"
          element={
            <ProtectedRoute>
              <LeadDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/companies"
          element={
            <ProtectedRoute>
              <CompaniesPage
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                userName={userName}
                userEmail={userEmail}
                avatarUrl={avatarUrl}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <ProtectedRoute>
              <ContactsPage
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                userName={userName}
                userEmail={userEmail}
                avatarUrl={avatarUrl}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UsersPage
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                userName={userName}
                userEmail={userEmail}
                avatarUrl={avatarUrl}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                userName={userName}
                userEmail={userEmail}
                avatarUrl={avatarUrl}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketing"
          element={
            <ProtectedRoute>
              <MarketingPage
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                userName={userName}
                userEmail={userEmail}
                avatarUrl={avatarUrl}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/courses"
          element={
            <ProtectedRoute>
              <CoursesPage
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                userName={userName}
                userEmail={userEmail}
                avatarUrl={avatarUrl}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                userName={userName}
                userEmail={userEmail}
                avatarUrl={avatarUrl}
              />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster />
      <AIChatWidget />
      <LeadNotificationChecker />
    </Suspense>
  );
}

export default App;
