import React from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import UserActionsDropdown from "./UserActionsDropdown";
import { User } from "@/lib/services/firebase/users";

interface UserTableRowProps {
  user: User;
  setEditingUser: (user: User) => void;
  handleSubmit: (data: Omit<User, "id">) => void;
  handleDeleteUser: (userId: string) => void;
}

const UserTableRow = ({
  user,
  setEditingUser,
  handleSubmit,
  handleDeleteUser,
}: UserTableRowProps) => {
  const getRoleBadgeColor = (role: User["role"]) => {
    const colors = {
      Admin: "bg-purple-500",
      Manager: "bg-indigo-500",
      Instructor: "bg-green-500",
      Staff: "bg-yellow-500",
    };
    return colors[role];
  };

  const getStatusColor = (status: User["status"]) => {
    const colors = {
      Active: "bg-green-500",
      Pending: "bg-yellow-500",
      Inactive: "bg-red-500",
    };
    return colors[status];
  };

  return (
    <TableRow key={user.id}>
      <TableCell className="font-medium">
        <div>{user.displayName || "No Name"}</div>
      </TableCell>
      <TableCell>
        <div>{user.email || "No Email"}</div>
      </TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className={`${getRoleBadgeColor(user.role)} text-white`}
        >
          {user.role || "No Role"}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant="secondary"
          className={`${getStatusColor(user.status)} text-white`}
        >
          {user.status || "No Status"}
        </Badge>
      </TableCell>
      <TableCell>
        {user.lastLogin
          ? new Date(user.lastLogin).toLocaleDateString()
          : "Never"}
      </TableCell>
      <TableCell>
        <UserActionsDropdown
          user={user}
          setEditingUser={setEditingUser}
          handleSubmit={handleSubmit}
          handleDeleteUser={handleDeleteUser}
        />
      </TableCell>
    </TableRow>
  );
};

export default UserTableRow;
