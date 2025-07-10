import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert } from "@shared/schema";
import AlertMarker from "@/components/alerts/alert-marker";
import AlertDetailModal from "@/components/alerts/alert-detail-modal";
import AlertFormSidebar from "@/components/admin/alert-form-sidebar";
import { Button } from "@/components/ui/button";
import mapImageUrl from "@assets/Snímek obrazovky 2025-07-09 202523_1752088416796.jpg";

// Type declaration for window extension
declare global {
  interface Window {
    setRouteColor?: (color: string) => void;
  }
}

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
  const [isRouteDrawing, setIsRouteDrawing] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<{ x: number; y: number }[]>([]);
  const [drawnRoutes, setDrawnRoutes] = useState<DrawnRoute[]>([]);
  const [routeColors] = useState(['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#ff9ff3', '#54a0ff']);
  const [currentRouteColor, setCurrentRouteColor] = useState('#ff6b6b');

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

    if (isRouteDrawing) {
      console.log('Route drawing - adding point:', { x: clampedX, y: clampedY });
      // Add point to current route
      setCurrentRoute(prev => {
        const newRoute = [...prev, { x: clampedX, y: clampedY }];
        console.log('Current route now has points:', newRoute.length);
        return newRoute;
      });
      return;
    }

    console.log('Map clicked at:', { x: clampedX, y: clampedY });
    setPendingPosition({ x: clampedX, y: clampedY });
    setShowAlertForm(true);
  }, [isAdmin, isDragging, transform, isRouteDrawing]);

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

  const handleMapDoubleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRouteDrawing || currentRoute.length < 2) return;
    
    e.preventDefault();
    
    // Finish current route
    const newRoute: DrawnRoute = {
      id: Date.now().toString(),
      points: [...currentRoute],
      color: currentRouteColor,
      name: `Route ${drawnRoutes.length + 1}`
    };
    
    setDrawnRoutes(prev => [...prev, newRoute]);
    setCurrentRoute([]);
    
    // Auto-select next color
    const nextColorIndex = (routeColors.indexOf(currentRouteColor) + 1) % routeColors.length;
    setCurrentRouteColor(routeColors[nextColorIndex]);
  }, [isRouteDrawing, currentRoute, currentRouteColor, drawnRoutes.length, routeColors]);

  const handleRouteDrawingChange = useCallback((isDrawing: boolean) => {
    console.log('Route drawing changed:', isDrawing);
    setIsRouteDrawing(isDrawing);
    if (!isDrawing) {
      setCurrentRoute([]);
    }
  }, []);

  const handleRoutesChange = useCallback((routes: DrawnRoute[]) => {
    setDrawnRoutes(routes);
  }, []);

  // Expose route color setter to window for sidebar access
  useEffect(() => {
    window.setRouteColor = setCurrentRouteColor;
    return () => {
      delete window.setRouteColor;
    };
  }, []);

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
        onDoubleClick={handleMapDoubleClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ 
          cursor: isDragging ? 'grabbing' : isRouteDrawing ? 'crosshair' : (isAdmin ? 'grab' : 'default'),
          userSelect: 'none'
        }}
        onContextMenu={(e) => {
          // Prevent context menu when route drawing to avoid interference
          if (isRouteDrawing) {
            e.preventDefault();
          }
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
            {/* Existing alert routes */}
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
            
            {/* Currently drawn routes */}
            {drawnRoutes.map((route) => (
              <polyline
                key={route.id}
                points={route.points.map(p => `${p.x},${p.y}`).join(' ')}
                stroke={route.color}
                strokeWidth="2"
                fill="none"
                strokeDasharray="6,3"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
            ))}
            
            {/* Current route being drawn */}
            {isRouteDrawing && currentRoute.length > 0 && (
              <polyline
                points={currentRoute.map(p => `${p.x},${p.y}`).join(' ')}
                stroke={currentRouteColor}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.7"
              />
            )}
            
            {/* Route points - make them more visible */}
            {isRouteDrawing && currentRoute.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="0.8"
                fill={currentRouteColor}
                stroke="white"
                strokeWidth="0.2"
                opacity="0.9"
              />
            ))}
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
            setIsRouteDrawing(false);
            setCurrentRoute([]);
          }}
          initialPosition={pendingPosition}
          editingAlert={editingAlert}
          onAfterSubmit={() => {
            setShowAlertForm(false);
            setPendingPosition(null);
            setEditingAlert(null);
            setIsRouteDrawing(false);
            setCurrentRoute([]);
            // Don't clear drawn routes here, let them persist for the form
          }}
          onRouteDrawingChange={handleRouteDrawingChange}
          onRoutesChange={handleRoutesChange}
        />
      )}

      {/* Route Drawing Instructions */}
      {isRouteDrawing && (
        <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-20">
          <div className="text-sm font-medium flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full border border-white" 
              style={{ backgroundColor: currentRouteColor }}
            />
            Drawing Route Mode
          </div>
          <div className="text-xs opacity-90">Click to add points • Double-click to finish</div>
          {currentRoute.length > 0 && (
            <div className="text-xs opacity-75">{currentRoute.length} points added</div>
          )}
        </div>
      )}
    </>
  );
}
