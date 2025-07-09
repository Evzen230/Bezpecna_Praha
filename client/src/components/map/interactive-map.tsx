import { useState, useRef, useCallback, useEffect } from "react";
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
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTouch, setLastTouch] = useState<{ x: number; y: number; distance: number } | null>(null);

  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
  });

  const filteredAlerts = alerts.filter(alert => {
    const categoryMatch = categoryFilter === "all" || alert.category === categoryFilter;
    const severityMatch = severityFilter === "all" || alert.severity === severityFilter;
    return categoryMatch && severityMatch;
  });

  const handleMapClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAdmin || isDragging) return;

    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate position relative to the transformed map
    const x = ((e.clientX - rect.left - transform.x) / transform.scale / rect.width) * 100;
    const y = ((e.clientY - rect.top - transform.y) / transform.scale / rect.height) * 100;

    setPendingPosition({ x, y });
    setShowAlertForm(true);
  }, [isAdmin, isDragging, transform]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isAdmin) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  }, [isAdmin, transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !isAdmin) return;
    
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }));
  }, [isDragging, isAdmin, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(transform.scale * delta, 0.5), 3);
    
    // Calculate zoom center
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setTransform(prev => ({
      x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
      y: mouseY - (mouseY - prev.y) * (newScale / prev.scale),
      scale: newScale
    }));
  }, [isAdmin, transform]);

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    
    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mouseleave', handleGlobalMouseUp);
    }
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mouseleave', handleGlobalMouseUp);
    };
  }, [isDragging]);

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
        className="h-screen bg-gray-900 relative overflow-hidden"
        onClick={handleMapClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ 
          cursor: isAdmin ? (isDragging ? 'grabbing' : 'grab') : 'default',
          userSelect: 'none'
        }}
      >
        {/* Base Map Image */}
        <div
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: '0 0',
            width: '100%',
            height: '100%',
            position: 'relative'
          }}
        >
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
