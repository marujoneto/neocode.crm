import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, MessageSquare, Calendar } from "lucide-react";
import { Contact } from "@/lib/services/firebase/contacts";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ContactCollaboration from "./ContactCollaboration";

interface ContactsTableRowProps {
  contact: Contact;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
  getRoleBadgeColor: (role: Contact["role"]) => string;
}

const ContactsTableRow = ({
  contact,
  onEdit,
  onDelete,
  getRoleBadgeColor,
}: ContactsTableRowProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const [createdBy, setCreatedBy] = useState<string>(
    contact.createdBy?.name || "System",
  );

  return (
    <>
      <TableRow>
        <TableCell>
          <div>
            <div className="font-medium">{contact.name}</div>
            <div className="text-sm text-gray-500">{contact.email}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Created by: {createdBy}
            </div>
          </div>
        </TableCell>
        <TableCell>{contact.position}</TableCell>
        <TableCell>{contact.department}</TableCell>
        <TableCell>
          <Badge
            variant="secondary"
            className={`${getRoleBadgeColor(contact.role)} text-white`}
          >
            {contact.role}
          </Badge>
        </TableCell>
        <TableCell>{contact.involvedCourses?.join(", ") || "None"}</TableCell>
        <TableCell>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDetails(true)}
              className="h-8 w-8 p-0"
              title="View collaboration"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowDetails(true)}>
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(contact)}>
                  Edit Contact
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => onDelete(contact)}
                >
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </TableCell>
      </TableRow>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{contact.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Email
                  </h3>
                  <p>{contact.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Phone
                  </h3>
                  <p>{contact.phone || "Not provided"}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Position
                </h3>
                <p>{contact.position}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Department
                </h3>
                <p>{contact.department || "Not specified"}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Role
                </h3>
                <Badge
                  variant="secondary"
                  className={`${getRoleBadgeColor(contact.role)} text-white mt-1`}
                >
                  {contact.role}
                </Badge>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Involved Courses
                </h3>
                {contact.involvedCourses?.length ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {contact.involvedCourses.map((course) => (
                      <Badge key={course} variant="outline">
                        {course}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p>None</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Notes
                </h3>
                <p className="whitespace-pre-wrap">
                  {contact.notes || "No notes"}
                </p>
              </div>
            </div>

            <ContactCollaboration contact={contact} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ContactsTableRow;
