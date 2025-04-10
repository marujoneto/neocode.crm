import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus } from "lucide-react";
import { User, usersService } from "@/lib/services/firebase/users";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/contexts/AuthContext";
import UserTableHeader from "./UserTableHeader";
import UserTableRow from "./UserTableRow";
import UserForm from "./UserForm";
import UserFilter from "./UserFilter";
import CreateUserForm from "./CreateUserForm";

const UsersTable = () => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log("Loading users from database...");
      const data = await usersService.getAll();
      console.log(`Loaded ${data.length} users from database`);

      if (data.length > 0) {
        console.log("Sample user data:", {
          id: data[0].id,
          email: data[0].email,
          displayName: data[0].displayName,
          status: data[0].status,
        });
      }

      // Check for and log duplicate emails
      const emailCounts: Record<string, number> = {};
      data.forEach((user) => {
        const email = user.email.toLowerCase();
        emailCounts[email] = (emailCounts[email] || 0) + 1;
      });

      const duplicateEmails = Object.entries(emailCounts)
        .filter(([_, count]) => count > 1)
        .map(([email]) => email);

      if (duplicateEmails.length > 0) {
        console.warn(`Found duplicate emails: ${duplicateEmails.join(", ")}`);
        duplicateEmails.forEach((email) => {
          const dupes = data.filter((u) => u.email.toLowerCase() === email);
          console.warn(
            `Duplicates for ${email}:`,
            dupes.map((d) => ({
              id: d.id,
              status: d.status,
              updatedAt: d.updatedAt,
            })),
          );
        });
      }

      // Remove duplicate users by email (keep the most recently updated one)
      const uniqueUsers = data.reduce((acc: User[], user) => {
        if (!user.email) {
          console.warn(`User with ID ${user.id} has no email, skipping`);
          return acc;
        }

        // Find existing user with same email
        const existingUserIndex = acc.findIndex(
          (u) => u.email && u.email.toLowerCase() === user.email.toLowerCase(),
        );

        if (existingUserIndex === -1) {
          // No duplicate, add to list
          acc.push(user);
        } else {
          // Duplicate found, keep the most recently updated one
          const existingUser = acc[existingUserIndex];
          const existingDate = new Date(existingUser.updatedAt || 0);
          const newDate = new Date(user.updatedAt || 0);

          console.log(`Found duplicate email ${user.email}:`, {
            existing: {
              id: existingUser.id,
              date: existingDate.toISOString(),
              status: existingUser.status,
            },
            new: {
              id: user.id,
              date: newDate.toISOString(),
              status: user.status,
            },
          });

          if (newDate > existingDate) {
            // Replace with newer version
            console.log(`Keeping newer user record with ID ${user.id}`);
            acc[existingUserIndex] = user;
          } else {
            console.log(
              `Keeping existing user record with ID ${existingUser.id}`,
            );
          }
        }
        return acc;
      }, []);

      console.log(`Filtered to ${uniqueUsers.length} unique users`);
      setUsers(uniqueUsers);
      setFilteredUsers(uniqueUsers);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description:
          "Failed to load users: " +
          (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    }
  };

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sorted = [...filteredUsers].sort((a, b) => {
      // Handle null or undefined values
      const valueA = a[key] || "";
      const valueB = b[key] || "";

      if (valueA < valueB) return direction === "asc" ? -1 : 1;
      if (valueA > valueB) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setFilteredUsers(sorted);
  };

  const handleSubmit = async (data: Omit<User, "id">) => {
    try {
      console.log("Submitting user data:", {
        id: editingUser?.id,
        email: data.email,
        displayName: data.displayName,
        status: data.status,
        isUpdate: !!editingUser,
      });

      // Validate required fields
      if (!data.email || !data.displayName) {
        toast({
          title: "Validation Error",
          description: "Email and name are required fields",
          variant: "destructive",
        });
        return;
      }

      // Check for duplicate email before creating or updating
      const existingUserByEmail = await usersService.getByEmail(data.email);
      console.log("Existing user with same email:", existingUserByEmail);

      if (
        existingUserByEmail &&
        (!editingUser || existingUserByEmail.id !== editingUser.id)
      ) {
        toast({
          title: "Duplicate User",
          description: `A user with email ${data.email} already exists (ID: ${existingUserByEmail.id})`,
          variant: "destructive",
        });
        return;
      }

      if (editingUser?.id) {
        console.log(`Updating existing user with ID ${editingUser.id}`);

        // For updates, ensure we're updating the correct record
        const userToUpdate = await usersService.getByUid(editingUser.id);
        console.log("User to update from database:", userToUpdate);

        if (!userToUpdate) {
          console.warn(
            `User with ID ${editingUser.id} not found in database but exists in UI`,
          );
          toast({
            title: "Error",
            description:
              "User no longer exists in the database. The list will be refreshed.",
            variant: "destructive",
          });
          await loadUsers(); // Refresh the list to show current state
          setShowForm(false);
          setEditingUser(null);
          return;
        }

        // If only changing status, just update that field
        if (Object.keys(data).length === 1 && "status" in data) {
          console.log(`Only updating status to ${data.status}`);
          await usersService.update(editingUser.id, { status: data.status });
          toast({
            title: "Status Updated",
            description: `Successfully ${data.status === "Active" ? "activated" : "deactivated"} user ${userToUpdate.displayName}`,
          });
        } else {
          // Full update
          await usersService.update(editingUser.id, data);
          toast({
            title: "User Updated",
            description: `Successfully updated user ${data.displayName}`,
          });
        }
      } else {
        // For new users, ensure UID is unique
        const uid = data.uid || `user_${Date.now()}`; // Generate a unique ID if not provided
        console.log(`Creating new user with generated UID: ${uid}`);

        await usersService.create({
          ...data,
          uid,
        });

        toast({
          title: "User Created",
          description: `Successfully created user ${data.displayName}`,
        });
      }

      await loadUsers(); // Use await to ensure data is refreshed
      setShowForm(false);
      setEditingUser(null);
    } catch (error) {
      console.error("Error saving user:", error);
      toast({
        title: "Error",
        description:
          "Failed to save user: " +
          (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });

      // Always refresh the list after an error to ensure UI is in sync
      await loadUsers();
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      console.log(`Attempting to delete user with ID: ${userId}`);

      if (!userId) {
        toast({
          title: "Error",
          description: "Invalid user ID",
          variant: "destructive",
        });
        return;
      }

      // Check if user exists before attempting to delete
      const userToDelete = await usersService.getByUid(userId);
      console.log("User to delete:", userToDelete);

      if (!userToDelete) {
        // Try to find by email if the user is in the list but getByUid fails
        const userInList = users.find((u) => u.id === userId);
        console.log("User in list:", userInList);

        if (userInList) {
          toast({
            title: "Error",
            description:
              "User exists in the list but not in the database. Refreshing data.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: "User no longer exists or has already been deleted",
            variant: "destructive",
          });
        }

        await loadUsers(); // Refresh the list
        return;
      }

      // Check if this is the current logged-in user
      if (userId === currentUser?.uid) {
        toast({
          title: "Error",
          description: "You cannot delete your own account while logged in",
          variant: "destructive",
        });
        return;
      }

      // Proceed with deletion
      await usersService.delete(userId);
      console.log(`Delete operation completed for user ${userId}`);

      toast({
        title: "User Deleted",
        description: "The user has been successfully deleted.",
      });

      await loadUsers(); // Use await to ensure data is refreshed
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description:
          "Failed to delete user: " +
          (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });

      // Always refresh the list after an error to ensure UI is in sync
      await loadUsers();
    }
  };

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow">
      <UserFilter
        users={users}
        setFilteredUsers={setFilteredUsers}
        setShowForm={setShowForm}
        setShowCreateUserForm={setShowCreateUserForm}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <UserTableHeader onSort={handleSort} sortConfig={sortConfig} />
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  setEditingUser={setEditingUser}
                  handleSubmit={handleSubmit}
                  handleDeleteUser={handleDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <UserForm
        isOpen={showForm || !!editingUser}
        onClose={() => {
          setShowForm(false);
          setEditingUser(null);
        }}
        user={editingUser || undefined}
        onSubmit={handleSubmit}
      />

      <CreateUserForm
        isOpen={showCreateUserForm}
        onClose={() => setShowCreateUserForm(false)}
        onSuccess={loadUsers}
      />
    </div>
  );
};

export default UsersTable;
