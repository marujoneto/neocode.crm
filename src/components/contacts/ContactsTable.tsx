import React, { useState, useEffect } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { Contact, contactsService } from "@/lib/services/firebase/contacts";
import { useToast } from "@/components/ui/use-toast";
import { activityLogsService } from "@/lib/services/firebase/activityLogs";
import { useAuth } from "@/lib/contexts/AuthContext";
import ContactsTableHeader from "./ContactsTableHeader";
import ContactsTableRow from "./ContactsTableRow";
import ContactsTableToolbar from "./ContactsTableToolbar";
import ContactForm from "./ContactForm";

const ContactsTable = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const data = await contactsService.getAll();
      setContacts(data);
      setFilteredContacts(data);
    } catch (error) {
      console.error("Error loading contacts:", error);
      toast({
        title: "Error",
        description: "Failed to load contacts",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeColor = (role: Contact["role"]) => {
    const colors = {
      "Decision Maker": "bg-purple-500",
      Stakeholder: "bg-blue-500",
      "Technical Contact": "bg-green-500",
      "HR Contact": "bg-yellow-500",
    };
    return colors[role];
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

    const sorted = [...filteredContacts].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
      return 0;
    });
    setFilteredContacts(sorted);
  };

  const handleFilter = (searchTerm: string) => {
    const filtered = contacts.filter((contact) =>
      Object.values(contact).some((value) =>
        value.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
    setFilteredContacts(filtered);
  };

  const handleSubmit = async (data: Omit<Contact, "id">) => {
    try {
      if (editingContact?.id) {
        await contactsService.update(editingContact.id, data);
        await activityLogsService.create({
          action: "update",
          entityType: "contact",
          entityId: editingContact.id,
          entityName: data.name,
          userId: user?.uid || "",
          userName: user?.email || "",
        });
        toast({
          title: "Contact Updated",
          description: `Successfully updated contact ${data.name}`,
        });
      } else {
        const newContact = await contactsService.create(data);
        await activityLogsService.create({
          action: "create",
          entityType: "contact",
          entityId: newContact.id || "",
          entityName: data.name,
          userId: user?.uid || "",
          userName: user?.email || "",
        });
        toast({
          title: "Contact Created",
          description: `Successfully created contact ${data.name}`,
        });
      }
      loadContacts();
      setShowForm(false);
      setEditingContact(null);
    } catch (error) {
      console.error("Error saving contact:", error);
      toast({
        title: "Error",
        description: "Failed to save contact",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (contact: Contact) => {
    if (!contact.id) return;
    try {
      await contactsService.delete(contact.id);
      await activityLogsService.create({
        action: "delete",
        entityType: "contact",
        entityId: contact.id,
        entityName: contact.name,
        userId: user?.uid || "",
        userName: user?.email || "",
      });
      toast({
        title: "Contact Deleted",
        description: `Successfully deleted contact ${contact.name}`,
      });
      loadContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast({
        title: "Error",
        description: "Failed to delete contact",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full bg-white p-6 rounded-lg shadow">
      <ContactsTableToolbar
        onAdd={() => setShowForm(true)}
        onSearch={handleFilter}
      />

      <div className="rounded-md border">
        <Table>
          <ContactsTableHeader sortConfig={sortConfig} onSort={handleSort} />
          <TableBody>
            {filteredContacts.map((contact) => (
              <ContactsTableRow
                key={contact.id}
                contact={contact}
                onEdit={setEditingContact}
                onDelete={handleDelete}
                getRoleBadgeColor={getRoleBadgeColor}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <ContactForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
      />

      {editingContact && (
        <ContactForm
          isOpen={true}
          onClose={() => setEditingContact(null)}
          contact={editingContact}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default ContactsTable;
