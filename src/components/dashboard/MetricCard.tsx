import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  trend: number;
  icon: React.ReactNode;
  color: string;
}

const MetricCard = ({
  title = "Total Leads",
  value = "1,234",
  trend = 12.5,
  icon = <ArrowUpIcon className="h-6 w-6" />,
  color = "bg-blue-500",
}: MetricCardProps) => {
  const isPositiveTrend = trend >= 0;

  return (
    <Card className="bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            <div className="flex items-center mt-2">
              <span
                className={`flex items-center text-sm ${isPositiveTrend ? "text-green-600" : "text-red-600"}`}
              >
                {isPositiveTrend ? (
                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                )}
                {Math.abs(trend)}%
              </span>
              <span className="text-gray-500 text-sm ml-2">vs last month</span>
            </div>
          </div>
          <div
            className={`${color} p-4 rounded-full bg-opacity-10 flex items-center justify-center`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;
