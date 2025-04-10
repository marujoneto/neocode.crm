import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Plus, UserPlus } from "lucide-react";

interface UserFilterProps {
  users: any[];
  setFilteredUsers: (users: any[]) => void;
  setShowForm: (show: boolean) => void;
  setShowCreateUserForm: (show: boolean) => void;
}

const UserFilter = ({
  users,
  setFilteredUsers,
  setShowForm,
  setShowCreateUserForm,
}: UserFilterProps) => {
  const handleFilter = (searchTerm: string) => {
    const filtered = users.filter((user) =>
      Object.values(user).some((value) =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
    setFilteredUsers(filtered);
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex gap-2">
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add New User
        </Button>
        <Button
          onClick={() => setShowCreateUserForm(true)}
          className="bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Register New User
        </Button>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search users..."
            className="pl-8"
            onChange={(e) => handleFilter(e.target.value)}
          />
        </div>
        <Button variant="outline" className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>
    </div>
  );
};

export default UserFilter;
