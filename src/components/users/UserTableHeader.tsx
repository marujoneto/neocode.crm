import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UserTableHeaderProps {
  onSort: (key: string) => void;
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
}

const UserTableHeader = ({ onSort, sortConfig }: UserTableHeaderProps) => {
  return (
    <TableRow>
      <TableHead
        className="w-[200px] cursor-pointer hover:bg-gray-50"
        onClick={() => onSort("displayName")}
      >
        Name{" "}
        {sortConfig?.key === "displayName" &&
          (sortConfig.direction === "asc" ? "↑" : "↓")}
      </TableHead>
      <TableHead
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => onSort("email")}
      >
        Email{" "}
        {sortConfig?.key === "email" &&
          (sortConfig.direction === "asc" ? "↑" : "↓")}
      </TableHead>
      <TableHead
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => onSort("role")}
      >
        Role{" "}
        {sortConfig?.key === "role" &&
          (sortConfig.direction === "asc" ? "↑" : "↓")}
      </TableHead>
      <TableHead
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => onSort("status")}
      >
        Status{" "}
        {sortConfig?.key === "status" &&
          (sortConfig.direction === "asc" ? "↑" : "↓")}
      </TableHead>
      <TableHead
        className="cursor-pointer hover:bg-gray-50"
        onClick={() => onSort("lastLogin")}
      >
        Last Login{" "}
        {sortConfig?.key === "lastLogin" &&
          (sortConfig.direction === "asc" ? "↑" : "↓")}
      </TableHead>
      <TableHead className="w-[100px] text-right">Actions</TableHead>
    </TableRow>
  );
};

export default UserTableHeader;
