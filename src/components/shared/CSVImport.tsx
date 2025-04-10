import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface CSVImportProps {
  onImport: (data: any[]) => Promise<void>;
  entityType: "leads" | "companies" | "contacts";
}

const CSVImport = ({ onImport, entityType }: CSVImportProps) => {
  const { toast } = useToast();
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          await onImport(results.data);
          toast({
            title: "Import Successful",
            description: `Successfully imported ${results.data.length} ${entityType}`,
          });
        } catch (error) {
          console.error("Import error:", error);
          toast({
            title: "Import Failed",
            description: "There was an error importing the data",
            variant: "destructive",
          });
        } finally {
          setIsImporting(false);
          // Reset the input
          event.target.value = "";
        }
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        toast({
          title: "Parse Error",
          description: "Failed to parse CSV file",
          variant: "destructive",
        });
        setIsImporting(false);
      },
    });
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
        id={`csv-import-${entityType}`}
        disabled={isImporting}
      />
      <Button
        variant="outline"
        className="flex items-center gap-2"
        onClick={() =>
          document.getElementById(`csv-import-${entityType}`)?.click()
        }
        disabled={isImporting}
      >
        <Upload className="h-4 w-4" />
        {isImporting ? "Importing..." : "Import CSV"}
      </Button>
    </div>
  );
};

export default CSVImport;
