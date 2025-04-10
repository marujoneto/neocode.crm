import React from "react";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  Users2Icon,
  GraduationCapIcon,
  BarChart3Icon,
  SettingsIcon,
  LogOutIcon,
  UserIcon,
  Building2Icon,
  ContactIcon,
  UsersIcon,
  MegaphoneIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/contexts/AuthContext";

interface SidebarProps {
  className?: string;
  activeItem?: string;
  onNavigate?: (item: string) => void;
}

const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <HomeIcon className="h-5 w-5" />,
    path: "/",
  },
  {
    id: "leads",
    label: "Leads",
    icon: <Users2Icon className="h-5 w-5" />,
    path: "/leads",
  },
  {
    id: "students",
    label: "Students",
    icon: <GraduationCapIcon className="h-5 w-5" />,
    path: "/students",
  },
  {
    id: "instructors",
    label: "Instructors",
    icon: <UserIcon className="h-5 w-5" />,
    path: "/instructors",
  },
  {
    id: "courses",
    label: "Courses",
    icon: <GraduationCapIcon className="h-5 w-5" />,
    path: "/courses",
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: <MegaphoneIcon className="h-5 w-5" />,
    path: "/marketing",
  },
  {
    id: "companies",
    label: "Companies",
    icon: <Building2Icon className="h-5 w-5" />,
    path: "/companies",
  },
  {
    id: "contacts",
    label: "Contacts",
    icon: <ContactIcon className="h-5 w-5" />,
    path: "/contacts",
  },
  {
    id: "users",
    label: "Users",
    icon: <UsersIcon className="h-5 w-5" />,
    path: "/users",
  },
  {
    id: "reports",
    label: "Reports",
    icon: <BarChart3Icon className="h-5 w-5" />,
    path: "/reports",
  },
];

const Sidebar = ({ className = "" }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const getCurrentPath = () => {
    const path = location.pathname;
    if (path === "/") return "dashboard";
    return path.slice(1);
  };

  const handleNavigation = (item: (typeof menuItems)[0]) => {
    navigate(item.path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const currentPath = getCurrentPath();

  return (
    <div
      className={cn(
        "w-[280px] h-full bg-white border-r border-gray-200 flex flex-col",
        className,
      )}
    >
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">CRM Dashboard</h1>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <Button
                variant={currentPath === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 px-4",
                  currentPath === item.id ? "bg-gray-100" : "",
                )}
                onClick={() => handleNavigation(item)}
              >
                {item.icon}
                <span>{item.label}</span>
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <ul className="space-y-2">
          <li>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-4"
              onClick={() => navigate("/settings")}
            >
              <SettingsIcon className="h-5 w-5" />
              <span>Settings</span>
            </Button>
          </li>
          <li>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-4 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOutIcon className="h-5 w-5" />
              <span>Logout</span>
            </Button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
