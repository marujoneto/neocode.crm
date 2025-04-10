import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ContactsTableHeaderProps {
  sortConfig: { key: string; direction: "asc" | "desc" } | null;
  onSort: (key: string) => void;
}

const ContactsTableHeader = ({
  sortConfig,
  onSort,
}: ContactsTableHeaderProps) => {
  const getSortIndicator = (key: string) => {
    return sortConfig?.key === key
      ? sortConfig.direction === "asc"
        ? "↑"
        : "↓"
      : "";
  };

  return (
    <TableHeader>
      <TableRow>
        <TableHead
          className="w-[200px] cursor-pointer hover:bg-gray-50"
          onClick={() => onSort("name")}
        >
          Name {getSortIndicator("name")}
        </TableHead>
        <TableHead
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => onSort("position")}
        >
          Position {getSortIndicator("position")}
        </TableHead>
        <TableHead
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => onSort("department")}
        >
          Department {getSortIndicator("department")}
        </TableHead>
        <TableHead
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => onSort("role")}
        >
          Role {getSortIndicator("role")}
        </TableHead>
        <TableHead>Involved Courses</TableHead>
        <TableHead className="w-[100px] text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
};

export default ContactsTableHeader;
