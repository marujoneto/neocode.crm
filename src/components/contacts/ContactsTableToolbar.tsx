import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Plus } from "lucide-react";
import CSVImport from "@/components/shared/CSVImport";
import { ExportButton } from "@/components/shared/ExportButton";
import { contactsService } from "@/lib/services/firebase/contacts";

interface ContactsTableToolbarProps {
  onAdd: () => void;
  onSearch: (searchTerm: string) => void;
  contacts?: any[];
}

const ContactsTableToolbar = ({
  onAdd,
  onSearch,
  contacts = [],
}: ContactsTableToolbarProps) => {
  return (
    <div className="flex justify-between items-center mb-6">
      <Button
        onClick={onAdd}
        className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Add New Contact
      </Button>
      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search contacts..."
            className="pl-8"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
          <ExportButton
            data={contacts}
            filename="contacts-export"
            fields={[
              "name",
              "email",
              "phone",
              "position",
              "department",
              "role",
              "notes",
            ]}
          />
          <CSVImport
            entityType="contacts"
            onImport={async (data) => {
              for (const item of data) {
                await contactsService.create({
                  name: item.name,
                  email: item.email,
                  phone: item.phone || "",
                  position: item.position,
                  companyId: item.companyId || "",
                  department: item.department || "",
                  role: item.role || "Stakeholder",
                  notes: item.notes || "",
                  involvedCourses: [],
                  involvedProjects: [],
                });
              }
              window.location.reload();
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ContactsTableToolbar;
