import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportService } from "@/lib/services/export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ExportButtonProps {
  data: any[];
  filename: string;
  fields?: string[];
}

export function ExportButton({ data, filename, fields }: ExportButtonProps) {
  const handleExport = (format: "csv" | "json") => {
    if (format === "csv") {
      exportService.toCSV({ filename, data, fields });
    } else {
      exportService.toJSON({ filename, data });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleExport("csv")}>
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("json")}>
          Export as JSON
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
