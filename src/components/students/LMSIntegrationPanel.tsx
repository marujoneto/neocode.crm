import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { lmsService } from "@/lib/services/api/lms";
import { Student } from "@/lib/services/firebase/students";

interface LMSIntegrationPanelProps {
  student: Student;
  onSync: () => void;
}

const LMSIntegrationPanel = ({ student, onSync }: LMSIntegrationPanelProps) => {
  const { toast } = useToast();
  const [syncing, setSyncing] = React.useState(false);
  const [progress, setProgress] = React.useState<
    {
      courseId: string;
      progress: number;
      lastActivity: string;
    }[]
  >();

  const handleSync = async () => {
    setSyncing(true);
    try {
      await lmsService.syncStudent(student);
      const progressData = await lmsService.getStudentProgress(student.id!);
      setProgress(progressData);
      onSync();
      toast({
        title: "Sync Complete",
        description: "Student data has been synchronized with the LMS",
      });
    } catch (error) {
      console.error("Error syncing with LMS:", error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync student data with LMS",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>LMS Integration</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`}
            />
            {syncing ? "Syncing..." : "Sync with LMS"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {progress ? (
          <div className="space-y-4">
            {progress.map((item) => (
              <div
                key={item.courseId}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">Course ID: {item.courseId}</p>
                  <p className="text-sm text-muted-foreground">
                    Last Activity:{" "}
                    {new Date(item.lastActivity).toLocaleString()}
                  </p>
                </div>
                <Badge
                  variant={item.progress >= 70 ? "default" : "secondary"}
                  className="ml-2"
                >
                  {item.progress}% Complete
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center text-muted-foreground">
            <AlertCircle className="h-4 w-4 mr-2" />
            No LMS data available. Click sync to fetch latest data.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LMSIntegrationPanel;
