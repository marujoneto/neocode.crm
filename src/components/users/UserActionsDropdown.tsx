import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { User } from "@/lib/services/firebase/users";

interface UserActionsDropdownProps {
  user: User;
  setEditingUser: (user: User) => void;
  handleSubmit: (data: Omit<User, "id">) => void;
  handleDeleteUser: (userId: string) => void;
}

const UserActionsDropdown = ({
  user,
  setEditingUser,
  handleSubmit,
  handleDeleteUser,
}: UserActionsDropdownProps) => {
  const getNextStatus = (currentStatus: User["status"]): User["status"] => {
    switch (currentStatus) {
      case "Active":
        return "Inactive";
      case "Inactive":
        return "Active";
      case "Pending":
        return "Active";
      default:
        return "Active";
    }
  };

  const getStatusAction = (currentStatus: User["status"]): string => {
    switch (currentStatus) {
      case "Active":
        return "Deactivate";
      case "Inactive":
        return "Activate";
      case "Pending":
        return "Approve";
      default:
        return "Activate";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setEditingUser(user)}>
          Edit User
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            console.log(
              `Changing status for user ${user.id} from ${user.status} to ${getNextStatus(user.status)}`,
            );
            const updatedUser = {
              ...user,
              status: getNextStatus(user.status),
            };
            // Only send the status field to avoid overwriting other fields
            handleSubmit({
              ...user,
              status: getNextStatus(user.status),
            });
          }}
        >
          {getStatusAction(user.status)}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600"
          onClick={() => {
            if (window.confirm("Are you sure you want to delete this user?")) {
              handleDeleteUser(user.id!);
            }
          }}
        >
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserActionsDropdown;
