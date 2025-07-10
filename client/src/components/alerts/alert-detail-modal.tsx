import { Alert } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { MapPin, Clock, User, Navigation, Edit, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface AlertDetailModalProps {
  alert: Alert;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
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

export default function AlertDetailModal({ alert, isOpen, onClose, onEdit }: AlertDetailModalProps) {
  const severityColor = severityColors[alert.severity as keyof typeof severityColors];
  const categoryLabel = categoryLabels[alert.category as keyof typeof categoryLabels] || alert.category;
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isOwner = user?.id === alert.userId;

  const deleteAlertMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/alerts/${alert.id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Alert deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error!",
        description: "Failed to delete alert.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = async () => {
    await deleteAlertMutation.mutateAsync();
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    }
  };


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

        <div className="flex justify-between pt-4">
          <div className="flex space-x-2">
            {isOwner && onEdit && (
              <Button onClick={handleEdit} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            {isOwner && (
              <Button 
                onClick={handleDelete} 
                variant="destructive" 
                size="sm"
                disabled={deleteAlertMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                {deleteAlertMutation.isPending ? "Deleting..." : "Delete"}
              </Button>
            )}
          </div>
          <Button onClick={onClose} variant="outline">
            <MapPin className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}