import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/contexts/AuthContext";
import { LogOut, Settings, User } from "lucide-react";

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
}

const UserProfileDialog = ({
  isOpen,
  onClose,
  userName = "John Doe",
  userEmail = "john@example.com",
  avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=john",
}: UserProfileDialogProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleEditProfile = () => {
    navigate("/settings");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-[425px]"
        aria-describedby="profile-description"
      >
        <DialogHeader>
          <DialogTitle>User Profile</DialogTitle>
          <DialogDescription id="profile-description">
            View and manage your profile settings
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <Avatar
            className="h-24 w-24 relative group cursor-pointer"
            onClick={() => document.getElementById("avatar-upload")?.click()}
          >
            <input
              type="file"
              id="avatar-upload"
              className="hidden"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file || !user?.uid) return;

                try {
                  const storageRef = ref(storage, `avatars/${user.uid}`);
                  await uploadBytes(storageRef, file);
                  const url = await getDownloadURL(storageRef);
                  await updateUserProfile({ photoURL: url });
                  onClose();
                } catch (error) {
                  console.error("Error uploading avatar:", error);
                }
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-full flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 text-sm">
                Change Photo
              </span>
            </div>
            <AvatarImage src={avatarUrl} alt={user?.displayName || userName} />
            <AvatarFallback>
              {(user?.displayName || userName).charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="text-xl font-semibold">
              {user?.displayName || userName}
            </h2>
            <p className="text-sm text-gray-500">{user?.email || userEmail}</p>
          </div>
          <div className="w-full space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleEditProfile}
            >
              <User className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleEditProfile}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserProfileDialog;
