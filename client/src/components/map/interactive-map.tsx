import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert } from "@shared/schema";
import AlertMarker from "@/components/alerts/alert-marker";
import AlertDetailModal from "@/components/alerts/alert-detail-modal";
import AlertFormSidebar from "@/components/admin/alert-form-sidebar";
import { Button } from "@/components/ui/button";
import mapImageUrl from "@assets/Snímek obrazovky 2025-07-09 202523_1752088416796.jpg";

interface DrawnRoute {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  name: string;
}

interface InteractiveMapProps {
  categoryFilter: string;
  severityFilter: string;
  isAdmin: boolean;
}

export default function InteractiveMap({ categoryFilter, severityFilter, isAdmin }: InteractiveMapProps) {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.8 }); // Start with slightly zoomed out view
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [lastTouch, setLastTouch] = useState<{ x: number; y: number; distance: number } | null>(null);

  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 5000, // Auto-refresh every 5 seconds for real-time updates
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

    // Calculate position relative to the original map coordinates (before transform)
    const x = ((e.clientX - rect.left - transform.x) / transform.scale / rect.width) * 100;
    const y = ((e.clientY - rect.top - transform.y) / transform.scale / rect.height) * 100;

    // Ensure positions are within bounds
    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    console.log('Map clicked at:', { x: clampedX, y: clampedY });
    setPendingPosition({ x: clampedX, y: clampedY });
    setShowAlertForm(true);
  }, [isAdmin, isDragging, transform]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    setTransform(prev => ({
      ...prev,
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    }));
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(transform.scale * delta, 0.3), 3); // Allow more zoom out
    
    // Calculate zoom center
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    setTransform(prev => ({
      x: mouseX - (mouseX - prev.x) * (newScale / prev.scale),
      y: mouseY - (mouseY - prev.y) * (newScale / prev.scale),
      scale: newScale
    }));
  }, [transform]);

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 0.8 });
  }, []);

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

  const handleEditAlert = (alert: Alert) => {
    setEditingAlert(alert);
    setShowAlertForm(true);
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
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <Button
          onClick={resetView}
          variant="secondary"
          size="sm"
          className="bg-white/90 hover:bg-white shadow-md"
        >
          Reset View
        </Button>
        {isAdmin && (
          <div className="text-xs text-white bg-black/70 px-2 py-1 rounded">
            Click to add alert
          </div>
        )}
      </div>

      <div 
        ref={mapRef}
        className="h-screen bg-gray-900 relative overflow-hidden"
        onClick={handleMapClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ 
          cursor: isDragging ? 'grabbing' : (isAdmin ? 'grab' : 'default'),
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
            className="w-full h-full object-contain"
            draggable={false}
          />
          
          {/* Alternative Routes - painted on the actual map */}
          <svg
            className="absolute inset-0 pointer-events-none"
            style={{ 
              width: '100%', 
              height: '100%',
              top: 0,
              left: 0
            }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {filteredAlerts.map((alert) => {
              if (!alert.alternativeRoutes) return null;
              
              try {
                const routes: DrawnRoute[] = JSON.parse(alert.alternativeRoutes);
                return routes.map((route) => (
                  <polyline
                    key={`${alert.id}-${route.id}`}
                    points={route.points.map(p => `${p.x},${p.y}`).join(' ')}
                    stroke={route.color}
                    strokeWidth="1"
                    fill="none"
                    strokeDasharray="4,2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                  />
                ));
              } catch (e) {
                console.warn('Failed to parse alternative routes for alert:', alert.id);
                return null;
              }
            })}
          </svg>

          {/* Alert Markers */}
          {filteredAlerts.map((alert) => (
            <AlertMarker
              key={alert.id}
              alert={alert}
              onClick={() => handleAlertClick(alert)}
              scale={transform.scale}
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
          onEdit={isAdmin ? handleEditAlert : undefined}
        />
      )}

      {/* Alert Form Sidebar */}
      {isAdmin && (
        <AlertFormSidebar
          isOpen={showAlertForm}
          onClose={() => {
            setShowAlertForm(false);
            setPendingPosition(null);
            setEditingAlert(null);
          }}
          initialPosition={pendingPosition}
          editingAlert={editingAlert}
          onAfterSubmit={() => {
            setShowAlertForm(false);
            setPendingPosition(null);
            setEditingAlert(null);
          }}
        />
      )}
    </>
  );
}
