import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Building, 
  Construction, 
  Navigation,
  Plus,
  Trash2,
  Edit3,
  Save,
  Route
} from "lucide-react";

interface GameInfrastructurePanelProps {
  onClose: () => void;
}

interface GameElement {
  id: string;
  type: 'road' | 'building' | 'landmark' | 'intersection';
  name: string;
  coordinates: { x: number; y: number };
  status: 'active' | 'blocked' | 'under_construction';
  connections?: string[]; // IDs of connected elements
}

export default function GameInfrastructurePanel({ onClose }: GameInfrastructurePanelProps) {
  const [gameElements, setGameElements] = useState<GameElement[]>([
    {
      id: '1',
      type: 'road',
      name: 'Main Street',
      coordinates: { x: 45, y: 30 },
      status: 'active',
      connections: ['2', '3']
    },
    {
      id: '2',
      type: 'intersection',
      name: 'Central Square',
      coordinates: { x: 50, y: 50 },
      status: 'active',
      connections: ['1', '3', '4']
    },
    {
      id: '3',
      type: 'road',
      name: 'Oak Avenue',
      coordinates: { x: 60, y: 70 },
      status: 'blocked',
      connections: ['2']
    },
    {
      id: '4',
      type: 'building',
      name: 'City Hall',
      coordinates: { x: 30, y: 60 },
      status: 'active',
      connections: ['2']
    }
  ]);

  const [selectedElement, setSelectedElement] = useState<GameElement | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'road': return <Route className="h-4 w-4" />;
      case 'building': return <Building className="h-4 w-4" />;
      case 'landmark': return <MapPin className="h-4 w-4" />;
      case 'intersection': return <Navigation className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'blocked': return 'destructive';
      case 'under_construction': return 'secondary';
      default: return 'default';
    }
  };

  const toggleElementStatus = (elementId: string) => {
    setGameElements(prev => prev.map(element => {
      if (element.id === elementId) {
        const newStatus = element.status === 'active' ? 'blocked' : 'active';
        return { ...element, status: newStatus };
      }
      return element;
    }));
  };

  const deleteElement = (elementId: string) => {
    setGameElements(prev => prev.filter(element => element.id !== elementId));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Building className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Game City Infrastructure
            </h2>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Game Map System
            </Badge>
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="elements" className="h-full flex flex-col">
            <TabsList className="mx-6 mt-4 w-fit">
              <TabsTrigger value="elements">Map Elements</TabsTrigger>
              <TabsTrigger value="roads">Road Network</TabsTrigger>
              <TabsTrigger value="analytics">Game Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="elements" className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">City Elements</h3>
                <Button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add New Element
                </Button>
              </div>

              <div className="grid gap-4">
                {gameElements.map((element) => (
                  <Card key={element.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          {getElementIcon(element.type)}
                        </div>
                        <div>
                          <h4 className="font-medium">{element.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {element.type} • Coordinates: ({element.coordinates.x.toFixed(1)}, {element.coordinates.y.toFixed(1)})
                          </p>
                          {element.connections && element.connections.length > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              Connected to: {element.connections.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusColor(element.status) as any}>
                          {element.status.replace('_', ' ')}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleElementStatus(element.id)}
                        >
                          {element.status === 'active' ? 'Block' : 'Activate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedElement(element)}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteElement(element.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="roads" className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Road Network Management</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Route className="h-5 w-5" />
                        Active Roads
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        {gameElements.filter(e => e.type === 'road' && e.status === 'active').length}
                      </div>
                      <p className="text-sm text-gray-600">Roads open for navigation</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Construction className="h-5 w-5" />
                        Blocked Roads
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">
                        {gameElements.filter(e => e.type === 'road' && e.status === 'blocked').length}
                      </div>
                      <p className="text-sm text-gray-600">Roads requiring alternative routes</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Road Status Overview</h4>
                  {gameElements.filter(e => e.type === 'road').map((road) => (
                    <div key={road.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Route className="h-4 w-4" />
                        <span>{road.name}</span>
                      </div>
                      <Badge variant={getStatusColor(road.status) as any}>
                        {road.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Game Map Analytics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Total Elements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{gameElements.length}</div>
                      <p className="text-sm text-gray-600">Map elements created</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Navigation Points</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {gameElements.filter(e => e.type === 'intersection').length}
                      </div>
                      <p className="text-sm text-gray-600">Key navigation intersections</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Buildings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">
                        {gameElements.filter(e => e.type === 'building').length}
                      </div>
                      <p className="text-sm text-gray-600">Game world structures</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Game Map Coverage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Map utilization</span>
                        <span className="font-medium">
                          {Math.round((gameElements.length / 20) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((gameElements.length / 20) * 100, 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600">
                        Game world coverage based on element density
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}