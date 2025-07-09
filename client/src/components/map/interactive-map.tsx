import { useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert } from "@shared/schema";
import AlertMarker from "@/components/alerts/alert-marker";
import AlertDetailModal from "@/components/alerts/alert-detail-modal";
import AlertFormModal from "@/components/admin/alert-form-modal";
import mapImageUrl from "@assets/Snímek obrazovky 2025-07-09 202523_1752088416796.jpg";

interface InteractiveMapProps {
  categoryFilter: string;
  severityFilter: string;
  isAdmin: boolean;
}

export default function InteractiveMap({ categoryFilter, severityFilter, isAdmin }: InteractiveMapProps) {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const filteredAlerts = alerts.filter(alert => {
    const categoryMatch = categoryFilter === "all" || alert.category === categoryFilter;
    const severityMatch = severityFilter === "all" || alert.severity === severityFilter;
    return categoryMatch && severityMatch;
  });

  const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAdmin) return;

    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPendingPosition({ x, y });
    setShowAlertForm(true);
  }, [isAdmin]);

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading map...</div>
      </div>
    );
  }

  return (
    <>
      <div 
        ref={mapRef}
        className="h-screen bg-gray-900 relative overflow-hidden cursor-crosshair"
        onClick={handleMapClick}
        style={{ cursor: isAdmin ? 'crosshair' : 'default' }}
      >
        {/* Base Map Image */}
        <img 
          src={mapImageUrl} 
          alt="City Map" 
          className="w-full h-full object-cover"
          draggable={false}
        />
        
        {/* Alert Markers */}
        {filteredAlerts.map((alert) => (
          <AlertMarker
            key={alert.id}
            alert={alert}
            onClick={() => handleAlertClick(alert)}
          />
        ))}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <AlertDetailModal
          alert={selectedAlert}
          isOpen={!!selectedAlert}
          onClose={() => setSelectedAlert(null)}
        />
      )}

      {/* Alert Form Modal */}
      {isAdmin && (
        <AlertFormModal
          isOpen={showAlertForm}
          onClose={() => {
            setShowAlertForm(false);
            setPendingPosition(null);
          }}
          initialPosition={pendingPosition}
        />
      )}
    </>
  );
}
