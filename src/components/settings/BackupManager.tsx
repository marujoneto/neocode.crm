import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, RefreshCw } from "lucide-react";
import { backupService } from "@/lib/services/firebase/backup";
import { useToast } from "@/components/ui/use-toast";

interface Backup {
  id: string;
  timestamp: any;
  collections: string[];
}

const BackupManager = () => {
  const { toast } = useToast();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const data = await backupService.getBackups();
      setBackups(data);
    } catch (error) {
      console.error("Error loading backups:", error);
      toast({
        title: "Error",
        description: "Failed to load backups",
        variant: "destructive",
      });
    }
  };

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      await backupService.createBackup();
      toast({
        title: "Backup Created",
        description: "Successfully created new backup",
      });
      loadBackups();
    } catch (error) {
      console.error("Error creating backup:", error);
      toast({
        title: "Error",
        description: "Failed to create backup",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownloadBackup = async (backupId: string) => {
    try {
      await backupService.downloadBackup(backupId);
    } catch (error) {
      console.error("Error downloading backup:", error);
      toast({
        title: "Error",
        description: "Failed to download backup",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Backup Manager</span>
          <Button
            onClick={handleCreateBackup}
            disabled={isCreating}
            className="flex items-center gap-2"
          >
            {isCreating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Create Backup
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {backups.length === 0 ? (
            <p className="text-center text-muted-foreground">
              No backups found
            </p>
          ) : (
            backups.map((backup) => (
              <div
                key={backup.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">
                    {backup.timestamp.toDate().toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {backup.collections.length} collections
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadBackup(backup.id)}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default BackupManager;
