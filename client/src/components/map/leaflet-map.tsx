import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { Alert } from "@shared/schema";
import AlertDetailModal from "@/components/alerts/alert-detail-modal";
import AlertFormSidebar from "@/components/admin/alert-form-sidebar";
import { Button } from "@/components/ui/button";
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Type declaration for window extension
declare global {
  interface Window {
    setRouteColor?: (color: string) => void;
  }
}

interface DrawnRoute {
  id: string;
  points: { lat: number; lng: number }[];
  color: string;
  name: string;
}

interface LeafletMapProps {
  categoryFilter: string;
  severityFilter: string;
  isAdmin: boolean;
}

// Custom marker colors based on severity
const createCustomIcon = (severity: string, category: string) => {
  const colors = {
    critical: '#ef4444',
    high: '#f97316', 
    medium: '#eab308',
    low: '#22c55e'
  };
  
  const color = colors[severity as keyof typeof colors] || '#6b7280';
  
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 12px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      ">
        ${category === 'road' ? '🚧' : '⚠️'}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

// Component for handling map clicks
function MapClickHandler({ isAdmin, isRouteDrawing, onMapClick, onRoutePointAdd }: {
  isAdmin: boolean;
  isRouteDrawing: boolean;
  onMapClick: (lat: number, lng: number) => void;
  onRoutePointAdd: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      if (!isAdmin) return;
      
      if (isRouteDrawing) {
        onRoutePointAdd(e.latlng.lat, e.latlng.lng);
      } else {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
    dblclick: (e) => {
      if (isRouteDrawing) {
        e.originalEvent.preventDefault();
      }
    }
  });
  
  return null;
}

export default function LeafletMap({ categoryFilter, severityFilter, isAdmin }: LeafletMapProps) {
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [isRouteDrawing, setIsRouteDrawing] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<{ lat: number; lng: number }[]>([]);
  const [drawnRoutes, setDrawnRoutes] = useState<DrawnRoute[]>([]);
  const [routeColors] = useState(['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#ff9ff3', '#54a0ff']);
  const [currentRouteColor, setCurrentRouteColor] = useState('#ff6b6b');

  const { data: alerts = [], isLoading } = useQuery<Alert[]>({
    queryKey: ["/api/alerts"],
    refetchInterval: 5000,
  });

  const filteredAlerts = alerts.filter(alert => {
    const categoryMatch = categoryFilter === "all" || alert.category === categoryFilter;
    const severityMatch = severityFilter === "all" || alert.severity === severityFilter;
    return categoryMatch && severityMatch;
  });

  // Convert alert positions to lat/lng (assuming positions are stored as percentages)
  const convertPositionToLatLng = (xPos: number, yPos: number) => {
    // Prague bounds as example - you can adjust these for your specific map area
    const bounds = {
      north: 50.1755,
      south: 49.9425,
      east: 14.7068,
      west: 14.2244
    };
    
    const lat = bounds.south + (bounds.north - bounds.south) * (1 - yPos / 100);
    const lng = bounds.west + (bounds.east - bounds.west) * (xPos / 100);
    
    return { lat, lng };
  };

  const convertLatLngToPosition = (lat: number, lng: number) => {
    const bounds = {
      north: 50.1755,
      south: 49.9425,
      east: 14.7068,
      west: 14.2244
    };
    
    const xPos = ((lng - bounds.west) / (bounds.east - bounds.west)) * 100;
    const yPos = (1 - (lat - bounds.south) / (bounds.north - bounds.south)) * 100;
    
    return { x: xPos, y: yPos };
  };

  const handleMapClick = useCallback((lat: number, lng: number) => {
    console.log('Map clicked at:', { lat, lng });
    const position = convertLatLngToPosition(lat, lng);
    setPendingPosition({ lat, lng });
    setShowAlertForm(true);
  }, []);

  const handleRoutePointAdd = useCallback((lat: number, lng: number) => {
    console.log('Route point added:', { lat, lng });
    setCurrentRoute(prev => [...prev, { lat, lng }]);
  }, []);

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

  const finishCurrentRoute = useCallback(() => {
    if (currentRoute.length < 2) return;
    
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
  }, [currentRoute, currentRouteColor, drawnRoutes.length, routeColors]);

  const handleAlertClick = (alert: Alert) => {
    setSelectedAlert(alert);
  };

  const handleEditAlert = (alert: Alert) => {
    setEditingAlert(alert);
    setShowAlertForm(true);
  };

  // Expose route color setter to window for sidebar access
  useEffect(() => {
    window.setRouteColor = setCurrentRouteColor;
    return () => {
      delete window.setRouteColor;
    };
  }, []);

  // Center of Prague as default center
  const defaultCenter: [number, number] = [50.0755, 14.4378];

  return (
    <div className="relative w-full h-screen">
      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-[1000] space-y-2">
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur"
        >
          Reset View
        </Button>
        {isRouteDrawing && currentRoute.length >= 2 && (
          <Button
            onClick={finishCurrentRoute}
            variant="default"
            size="sm"
            className="bg-blue-600 text-white"
          >
            Finish Route
          </Button>
        )}
      </div>

      {/* Route Drawing Instructions */}
      {isRouteDrawing && (
        <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-[1000]">
          <div className="text-sm font-medium flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full border border-white" 
              style={{ backgroundColor: currentRouteColor }}
            />
            Drawing Route Mode
          </div>
          <div className="text-xs opacity-90">Click to add points • Click "Finish Route" to complete</div>
          {currentRoute.length > 0 && (
            <div className="text-xs opacity-75">{currentRoute.length} points added</div>
          )}
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapClickHandler 
          isAdmin={isAdmin}
          isRouteDrawing={isRouteDrawing}
          onMapClick={handleMapClick}
          onRoutePointAdd={handleRoutePointAdd}
        />

        {/* Alert Markers */}
        {filteredAlerts.map((alert) => {
          const position = convertPositionToLatLng(alert.xPosition, alert.yPosition);
          return (
            <Marker 
              key={alert.id}
              position={[position.lat, position.lng]}
              icon={createCustomIcon(alert.severity, alert.category)}
              eventHandlers={{
                click: () => handleAlertClick(alert),
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold">{alert.title}</h3>
                  <p className="text-sm text-gray-600">{alert.description}</p>
                  <div className="mt-2 flex gap-2">
                    <span className={`px-2 py-1 text-xs rounded ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-800">
                      {alert.category}
                    </span>
                  </div>
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => handleEditAlert(alert)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Existing routes from alerts */}
        {filteredAlerts.map((alert) => {
          if (!alert.alternativeRoutes) return null;
          
          try {
            const routes: any[] = JSON.parse(alert.alternativeRoutes);
            return routes.map((route) => {
              // Convert percentage-based points to lat/lng
              const latLngPoints = route.points.map((point: any) => {
                const pos = convertPositionToLatLng(point.x, point.y);
                return [pos.lat, pos.lng] as [number, number];
              });
              
              return (
                <Polyline
                  key={`${alert.id}-${route.id}`}
                  positions={latLngPoints}
                  color={route.color}
                  weight={3}
                  opacity={0.8}
                  dashArray="5, 5"
                />
              );
            });
          } catch (e) {
            console.warn('Failed to parse alternative routes for alert:', alert.id);
            return null;
          }
        })}

        {/* Currently drawn routes */}
        {drawnRoutes.map((route) => (
          <Polyline
            key={route.id}
            positions={route.points.map(p => [p.lat, p.lng] as [number, number])}
            color={route.color}
            weight={4}
            opacity={0.9}
            dashArray="6, 3"
          />
        ))}

        {/* Current route being drawn */}
        {isRouteDrawing && currentRoute.length > 1 && (
          <Polyline
            positions={currentRoute.map(p => [p.lat, p.lng] as [number, number])}
            color={currentRouteColor}
            weight={4}
            opacity={0.7}
          />
        )}
      </MapContainer>

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
          initialPosition={pendingPosition ? convertLatLngToPosition(pendingPosition.lat, pendingPosition.lng) : null}
          editingAlert={editingAlert}
          onAfterSubmit={() => {
            setShowAlertForm(false);
            setPendingPosition(null);
            setEditingAlert(null);
            setIsRouteDrawing(false);
            setCurrentRoute([]);
          }}
          onRouteDrawingChange={handleRouteDrawingChange}
          onRoutesChange={handleRoutesChange}
        />
      )}
    </div>
  );
}