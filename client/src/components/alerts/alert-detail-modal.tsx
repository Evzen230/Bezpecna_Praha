import { Alert } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AlertDetailModalProps {
  alert: Alert;
  isOpen: boolean;
  onClose: () => void;
}

const categoryLabels = {
  road: "Road Hazards",
  criminal: "Criminal Activity", 
  emergency: "Medical Emergency",
  weather: "Weather Alert",
  traffic: "Traffic Update",
};

const severityColors = {
  critical: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500", 
  low: "bg-green-500",
};

export default function AlertDetailModal({ alert, isOpen, onClose }: AlertDetailModalProps) {
  const severityColor = severityColors[alert.severity as keyof typeof severityColors];
  const categoryLabel = categoryLabels[alert.category as keyof typeof categoryLabels] || alert.category;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <span className={`inline-block w-3 h-3 ${severityColor} rounded-full`} />
            <DialogTitle className="text-lg">{alert.title}</DialogTitle>
          </div>
          <DialogDescription>
            View detailed information about this emergency alert
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <span className="text-sm font-medium text-gray-700">Category:</span>
            <span className="text-sm text-gray-900 ml-2">{categoryLabel}</span>
          </div>
          
          <div>
            <span className="text-sm font-medium text-gray-700">Severity:</span>
            <Badge variant="secondary" className="ml-2 capitalize">
              {alert.severity}
            </Badge>
          </div>
          
          <div>
            <span className="text-sm font-medium text-gray-700">Description:</span>
            <p className="text-sm text-gray-900 mt-1">{alert.description}</p>
          </div>
          
          {alert.alternativeRoute && (
            <div>
              <span className="text-sm font-medium text-gray-700">Alternative Route:</span>
              <p className="text-sm text-gray-900 mt-1">{alert.alternativeRoute}</p>
            </div>
          )}
          
          <div>
            <span className="text-sm font-medium text-gray-700">Reported:</span>
            <span className="text-sm text-gray-900 ml-2">
              {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
            </span>
          </div>
          
          <div>
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <Badge variant="outline" className="ml-2 text-green-700 border-green-700">
              Active
            </Badge>
          </div>
          
          {alert.expiresAt && (
            <div>
              <span className="text-sm font-medium text-gray-700">Expires:</span>
              <span className="text-sm text-gray-900 ml-2">
                {formatDistanceToNow(new Date(alert.expiresAt), { addSuffix: true })}
              </span>
            </div>
          )}
        </div>
        
        <Button 
          variant="secondary" 
          className="w-full mt-6"
          onClick={onClose}
        >
          <MapPin className="h-4 w-4 mr-2" />
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
