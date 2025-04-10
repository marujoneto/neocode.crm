import React, { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ActivityLog,
  activityLogsService,
} from "@/lib/services/firebase/activityLogs";
import { formatDistanceToNow } from "date-fns";

const ActivityLogList = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const data = await activityLogsService.getAll(10);
        setLogs(data);
      } catch (error) {
        console.error("Error loading activity logs:", error);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  const getActionColor = (action: string | undefined) => {
    if (!action) return "text-gray-600";

    switch (action.toLowerCase()) {
      case "create":
        return "text-green-600";
      case "update":
        return "text-blue-600";
      case "delete":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <p>Loading activities...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No recent activities</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start space-x-4 text-sm"
                >
                  <div className="flex-1">
                    <p className="font-medium">
                      <span className={getActionColor(log.action)}>
                        {log.action}
                      </span>{" "}
                      {log.entityType} - {log.entityName}
                    </p>
                    <p className="text-gray-500">
                      by {log.userName} •{" "}
                      {formatDistanceToNow(log.timestamp.toDate(), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ActivityLogList;
