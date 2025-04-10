import { useEffect, useState } from "react";
import MetricCard from "./MetricCard";
import { Users, GraduationCap, BarChart, DollarSign } from "lucide-react";
import { metricsService } from "@/lib/services/firebase/metrics";

interface Metrics {
  leads?: {
    total: number;
    new: number;
    trend: number;
  };
  students?: {
    total: number;
    active: number;
    trend: number;
  };
  courses?: {
    total: number;
    completed: number;
    completionRate: number;
  };
  revenue?: {
    total: number;
    trend: number;
  };
}

const MetricsGrid = () => {
  const [metrics, setMetrics] = useState<Metrics>({});

  useEffect(() => {
    const listener = metricsService.subscribeToMetrics((update) => {
      setMetrics((prev) => ({ ...prev, [update.type]: update }));
    });

    return () => listener.unsubscribe();
  }, []);

  return (
    <div className="bg-gray-50 p-6 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Leads"
          value={metrics.leads?.total?.toString() || "0"}
          trend={Number(metrics.leads?.trend || 0)}
          icon={<Users className="h-6 w-6 text-blue-500" />}
          color="bg-blue-500"
        />
        <MetricCard
          title="Active Students"
          value={metrics.students?.active?.toString() || "0"}
          trend={Number(metrics.students?.trend || 0)}
          icon={<GraduationCap className="h-6 w-6 text-green-500" />}
          color="bg-green-500"
        />
        <MetricCard
          title="Course Completion Rate"
          value={`${metrics.courses?.completionRate || 0}%`}
          trend={Number(metrics.courses?.completionRate || 0)}
          icon={<BarChart className="h-6 w-6 text-purple-500" />}
          color="bg-purple-500"
        />
        <MetricCard
          title="Revenue"
          value={`$${metrics.revenue?.total?.toLocaleString() || 0}`}
          trend={Number(metrics.revenue?.trend || 0)}
          icon={<DollarSign className="h-6 w-6 text-yellow-500" />}
          color="bg-yellow-500"
        />
      </div>
    </div>
  );
};

export default MetricsGrid;
