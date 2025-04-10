import React, { useState } from "react";
import EmailTemplatesTable from "./EmailTemplatesTable";
import EmailTemplateEditor from "./EmailTemplateEditor";

interface EmailTemplate {
  id?: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  createdAt?: string;
  updatedAt?: string;
}

const EmailTemplatesManager: React.FC = () => {
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);

  const handleCreateTemplate = () => {
    setIsCreatingTemplate(true);
    setSelectedTemplate(null);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsEditingTemplate(true);
  };

  const handleSaveTemplate = () => {
    setIsCreatingTemplate(false);
    setIsEditingTemplate(false);
    setSelectedTemplate(null);
  };

  const handleCancel = () => {
    setIsCreatingTemplate(false);
    setIsEditingTemplate(false);
    setSelectedTemplate(null);
  };

  return (
    <div className="space-y-6">
      {isCreatingTemplate || isEditingTemplate ? (
        <EmailTemplateEditor
          template={selectedTemplate || undefined}
          onSave={handleSaveTemplate}
          onCancel={handleCancel}
        />
      ) : (
        <EmailTemplatesTable
          onCreateTemplate={handleCreateTemplate}
          onEditTemplate={handleEditTemplate}
        />
      )}
    </div>
  );
};

export default EmailTemplatesManager;
