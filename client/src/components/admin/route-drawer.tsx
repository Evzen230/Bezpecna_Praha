import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";

interface Point {
  x: number;
  y: number;
}

interface DrawnRoute {
  id: string;
  points: Point[];
  color: string;
  name: string;
}

interface RouteDrawerProps {
  onRoutesChange: (routes: DrawnRoute[]) => void;
  initialRoutes?: DrawnRoute[];
}

export default function RouteDrawer({ onRoutesChange, initialRoutes = [] }: RouteDrawerProps) {
  const [routes, setRoutes] = useState<DrawnRoute[]>(initialRoutes);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<DrawnRoute | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff'];

  const createNewRoute = () => {
    const newRoute: DrawnRoute = {
      id: Date.now().toString(),
      points: [],
      color: colors[routes.length % colors.length],
      name: `Route ${routes.length + 1}`
    };
    setCurrentRoute(newRoute);
    setIsDrawing(true);
  };

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !currentRoute) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPoint = { x, y };
    const updatedRoute = {
      ...currentRoute,
      points: [...currentRoute.points, newPoint]
    };
    setCurrentRoute(updatedRoute);
  }, [isDrawing, currentRoute]);

  const finishRoute = () => {
    if (!currentRoute || currentRoute.points.length < 2) return;

    const updatedRoutes = [...routes, currentRoute];
    setRoutes(updatedRoutes);
    onRoutesChange(updatedRoutes);
    setCurrentRoute(null);
    setIsDrawing(false);
  };

  const deleteRoute = (routeId: string) => {
    const updatedRoutes = routes.filter(route => route.id !== routeId);
    setRoutes(updatedRoutes);
    onRoutesChange(updatedRoutes);
  };

  const cancelDrawing = () => {
    setCurrentRoute(null);
    setIsDrawing(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <Button 
          onClick={createNewRoute} 
          disabled={isDrawing}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Route
        </Button>
        {isDrawing && (
          <>
            <Button onClick={finishRoute} size="sm" disabled={!currentRoute || currentRoute.points.length < 2}>
              Finish Route
            </Button>
            <Button onClick={cancelDrawing} variant="outline" size="sm">
              Cancel
            </Button>
          </>
        )}
      </div>

      <div 
        ref={canvasRef}
        className="relative bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden"
        style={{ 
          width: '100%', 
          height: '200px',
          cursor: isDrawing ? 'crosshair' : 'default'
        }}
        onClick={handleCanvasClick}
      >
        <div className="absolute inset-2 text-xs text-gray-500 pointer-events-none">
          {isDrawing ? 'Click to add points to your route' : 'Click "Add Route" to start drawing'}
        </div>

        {/* Render completed routes */}
        <svg
            className="absolute inset-0 pointer-events-none"
            style={{ 
              width: '100%', 
              height: '100%',
              top: 0,
              left: 0,
              zIndex: 5
            }}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {routes.map((route) => (
              <polyline
                key={route.id}
                points={route.points.map(p => `${p.x},${p.y}`).join(' ')}
                stroke={route.color}
                strokeWidth="1"
                fill="none"
                strokeDasharray="4,2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />
            ))}
            {currentRoute && currentRoute.points.length > 0 && (
              <polyline
                points={currentRoute.points.map(p => `${p.x},${p.y}`).join(' ')}
                stroke={currentRoute.color}
                strokeWidth="1"
                fill="none"
                strokeDasharray="4,2"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.9"
              />
            )}
          </svg>
      </div>

      {/* Route List */}
      {routes.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Routes:</h4>
          {routes.map((route) => (
            <div key={route.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded" 
                  style={{ backgroundColor: route.color }}
                />
                <Input
                  value={route.name}
                  onChange={(e) => {
                    const updatedRoutes = routes.map(r => 
                      r.id === route.id ? { ...r, name: e.target.value } : r
                    );
                    setRoutes(updatedRoutes);
                    onRoutesChange(updatedRoutes);
                  }}
                  className="h-6 text-xs"
                />
              </div>
              <Button
                onClick={() => deleteRoute(route.id)}
                variant="ghost"
                size="sm"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}