import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2, Plus, Palette } from "lucide-react";

interface RoutePoint {
  x: number;
  y: number;
}

interface DrawnRoute {
  id: string;
  points: RoutePoint[];
  color: string;
  name: string;
}

interface RouteDrawerProps {
  onRoutesChange: (routes: DrawnRoute[]) => void;
  initialRoutes?: DrawnRoute[];
}

const availableColors = [
  { name: "Red", value: "#ef4444" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Green", value: "#22c55e" },
  { name: "Purple", value: "#a855f7" },
  { name: "Orange", value: "#f97316" },
  { name: "Pink", value: "#ec4899" },
  { name: "Cyan", value: "#06b6d4" },
  { name: "Yellow", value: "#eab308" },
];

export default function RouteDrawer({ onRoutesChange, initialRoutes = [] }: RouteDrawerProps) {
  const [routes, setRoutes] = useState<DrawnRoute[]>(initialRoutes);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<RoutePoint[]>([]);
  const [selectedColor, setSelectedColor] = useState(availableColors[0].value);
  const [routeName, setRouteName] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startDrawing = useCallback(() => {
    setIsDrawing(true);
    setCurrentRoute([]);
    setRouteName(`Route ${routes.length + 1}`);
  }, [routes.length]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newPoint = { x, y };
    setCurrentRoute(prev => [...prev, newPoint]);
  }, [isDrawing]);

  const finishDrawing = useCallback(() => {
    if (currentRoute.length < 2) return;

    const newRoute: DrawnRoute = {
      id: Date.now().toString(),
      points: currentRoute,
      color: selectedColor,
      name: routeName || `Route ${routes.length + 1}`,
    };

    const updatedRoutes = [...routes, newRoute];
    setRoutes(updatedRoutes);
    onRoutesChange(updatedRoutes);
    setIsDrawing(false);
    setCurrentRoute([]);
    setRouteName("");
  }, [currentRoute, selectedColor, routeName, routes, onRoutesChange]);

  const cancelDrawing = useCallback(() => {
    setIsDrawing(false);
    setCurrentRoute([]);
    setRouteName("");
  }, []);

  const deleteRoute = useCallback((routeId: string) => {
    const updatedRoutes = routes.filter(route => route.id !== routeId);
    setRoutes(updatedRoutes);
    onRoutesChange(updatedRoutes);
  }, [routes, onRoutesChange]);

  const renderRouteOnCanvas = useCallback((route: DrawnRoute, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx || route.points.length < 2) return;

    ctx.strokeStyle = route.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const firstPoint = route.points[0];
    ctx.moveTo((firstPoint.x / 100) * canvas.width, (firstPoint.y / 100) * canvas.height);

    for (let i = 1; i < route.points.length; i++) {
      const point = route.points[i];
      ctx.lineTo((point.x / 100) * canvas.width, (point.y / 100) * canvas.height);
    }

    ctx.stroke();
  }, []);

  const renderCurrentRoute = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || currentRoute.length < 2) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    const firstPoint = currentRoute[0];
    ctx.moveTo((firstPoint.x / 100) * canvas.width, (firstPoint.y / 100) * canvas.height);

    for (let i = 1; i < currentRoute.length; i++) {
      const point = currentRoute[i];
      ctx.lineTo((point.x / 100) * canvas.width, (point.y / 100) * canvas.height);
    }

    ctx.stroke();
    ctx.setLineDash([]);
  }, [currentRoute, selectedColor]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw all completed routes
    routes.forEach(route => renderRouteOnCanvas(route, canvas));

    // Draw current route being drawn
    renderCurrentRoute();
  }, [routes, renderRouteOnCanvas, renderCurrentRoute]);

  // Redraw canvas when routes change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Pencil className="h-5 w-5" />
          <span>Route Drawing</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drawing Canvas */}
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={300}
            height={200}
            className="border border-gray-300 rounded-lg cursor-crosshair bg-gray-50"
            onClick={handleCanvasClick}
          />
          {isDrawing && (
            <div className="absolute top-2 left-2 text-xs text-gray-600 bg-white px-2 py-1 rounded">
              Click to add points
            </div>
          )}
        </div>

        {/* Drawing Controls */}
        {isDrawing ? (
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Route name"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={finishDrawing} disabled={currentRoute.length < 2}>
                Finish Route
              </Button>
              <Button size="sm" variant="outline" onClick={cancelDrawing}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Palette className="h-4 w-4" />
              <span className="text-sm">Color:</span>
              <div className="flex space-x-1">
                {availableColors.map((color) => (
                  <button
                    key={color.value}
                    className={`w-6 h-6 rounded-full border-2 ${
                      selectedColor === color.value ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => setSelectedColor(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            <Button size="sm" onClick={startDrawing} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Draw New Route
            </Button>
          </div>
        )}

        {/* Route List */}
        {routes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Alternative Routes:</h4>
            <div className="space-y-1">
              {routes.map((route) => (
                <div key={route.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: route.color }}
                    />
                    <span className="text-sm">{route.name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteRoute(route.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}