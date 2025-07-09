import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Edit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import AlertFormModal from "./alert-form-modal";

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);

  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/admin/alerts"],
  });

  const severityColors = {
    critical: "bg-red-500",
    high: "bg-orange-500", 
    medium: "bg-yellow-500",
    low: "bg-green-500"
  };

  const activeAlerts = alerts.filter(alert => alert.isActive);
  const todayAlerts = alerts.filter(alert => {
    const today = new Date();
    const alertDate = new Date(alert.createdAt);
    return alertDate.toDateString() === today.toDateString();
  });

  return (
    <>
      <Card className="fixed top-20 right-4 w-80 z-40 backdrop-blur-sm bg-white/95 border border-gray-200 shadow-xl">
        <CardHeader className="border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Admin Panel</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 space-y-4">
          {/* Add Alert Button */}
          <Button 
            className="w-full" 
            onClick={() => setShowAlertForm(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New Alert
          </Button>
          
          {/* Active Alerts Management */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Manage Active Alerts</h4>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {isLoading ? (
                  <div className="text-center text-gray-500 py-4">Loading...</div>
                ) : activeAlerts.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">No active alerts</div>
                ) : (
                  activeAlerts.map((alert) => (
                    <div key={alert.id} className="bg-gray-50 p-3 rounded-md">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span 
                              className={`inline-block w-2 h-2 rounded-full ${severityColors[alert.severity as keyof typeof severityColors]}`} 
                            />
                            <span className="text-sm font-medium text-gray-900">
                              {alert.title}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600">{alert.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setEditingAlert(alert)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
          
          {/* Quick Stats */}
          <div className="border-t border-gray-200 pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Quick Stats</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="font-semibold text-gray-900">{activeAlerts.length}</div>
                <div className="text-xs text-gray-600">Total Active</div>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <div className="font-semibold text-gray-900">{todayAlerts.length}</div>
                <div className="text-xs text-gray-600">Today</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Form Modal */}
      <AlertFormModal
        isOpen={showAlertForm}
        onClose={() => setShowAlertForm(false)}
        editingAlert={editingAlert}
        onAfterSubmit={() => {
          setShowAlertForm(false);
          setEditingAlert(null);
        }}
      />
    </>
  );
}
