import { useQuery } from "@tanstack/react-query";
import { Alert } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

export default function AlertStats() {
  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  if (isLoading) {
    return (
      <div className="absolute top-20 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs z-40">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex justify-between">
                <div className="h-3 bg-gray-200 rounded w-16"></div>
                <div className="h-3 bg-gray-200 rounded w-4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const severityCounts = alerts.reduce((acc, alert) => {
    acc[alert.severity] = (acc[alert.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const lastUpdated = alerts.length > 0 
    ? formatDistanceToNow(new Date(Math.max(...alerts.map(a => new Date(a.createdAt).getTime()))), { addSuffix: true })
    : "Žádná upozornění";

  return (
    <Card className="absolute top-20 left-4 max-w-xs z-40 backdrop-blur-sm bg-white/95">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Aktivní upozornění</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Kritická</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {severityCounts.critical || 0}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Vysoká</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {severityCounts.high || 0}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Střední</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {severityCounts.medium || 0}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-700">Nízká</span>
          </div>
          <span className="text-sm font-semibold text-gray-900">
            {severityCounts.low || 0}
          </span>
        </div>
        
        <div className="pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            Poslední aktualizace: {lastUpdated}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
