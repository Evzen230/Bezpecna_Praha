import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertAlertSchema, Alert, InsertAlert } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Save, X } from "lucide-react";
import RouteDrawer from "./route-drawer";
import { availableIcons } from "@/components/alerts/alert-marker";

interface AlertFormSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  initialPosition?: { x: number; y: number } | null;
  editingAlert?: Alert | null;
  onAfterSubmit?: () => void;
  onRouteDrawingChange?: (isDrawing: boolean) => void;
  onRoutesChange?: (routes: any[]) => void;
}

const extendedAlertSchema = insertAlertSchema.extend({
  expirationHours: insertAlertSchema.shape.expirationHours.default(24),
  alternativeRoute: insertAlertSchema.shape.alternativeRoute.optional(),
});

export default function AlertFormSidebar({ 
  isOpen, 
  onClose, 
  initialPosition, 
  editingAlert,
  onAfterSubmit,
  onRouteDrawingChange,
  onRoutesChange
}: AlertFormSidebarProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [alternativeRoutes, setAlternativeRoutes] = useState<any[]>(
    editingAlert?.alternativeRoutes ? JSON.parse(editingAlert.alternativeRoutes) : []
  );
  const [showRouteDrawer, setShowRouteDrawer] = useState(false);

  const form = useForm<z.infer<typeof insertAlertSchema>>({
    resolver: zodResolver(insertAlertSchema),
    defaultValues: {
      title: editingAlert?.title || "",
      description: editingAlert?.description || "",
      category: editingAlert?.category || "road",
      severity: editingAlert?.severity || "medium",
      xPosition: editingAlert?.xPosition ?? initialPosition?.x ?? 50,
      yPosition: editingAlert?.yPosition ?? initialPosition?.y ?? 50,
      alternativeRoute: editingAlert?.alternativeRoute || "",
      icon: editingAlert?.icon || "",
      expirationHours: 24,
    },
  });

  // Update form values when initialPosition changes
  useEffect(() => {
    if (initialPosition && !editingAlert) {
      form.setValue('xPosition', initialPosition.x);
      form.setValue('yPosition', initialPosition.y);
    }
  }, [initialPosition, editingAlert, form]);

  const createAlertMutation = useMutation({
    mutationFn: async (data: InsertAlert) => {
      const res = await apiRequest("POST", "/api/alerts", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/alerts"] });
      toast({
        title: "Success",
        description: "Alert created successfully",
      });
      form.reset();
      onAfterSubmit?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateAlertMutation = useMutation({
    mutationFn: async (data: Partial<Alert>) => {
      const res = await apiRequest("PUT", `/api/alerts/${editingAlert?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/alerts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/alerts"] });
      toast({
        title: "Success",
        description: "Alert updated successfully",
      });
      onAfterSubmit?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof insertAlertSchema>) => {
    const submitData = {
      ...data,
      alternativeRoutes: JSON.stringify(alternativeRoutes),
    };

    if (editingAlert) {
      updateAlertMutation.mutate(submitData);
    } else {
      createAlertMutation.mutate(submitData);
    }
  };

  const handleRoutesChange = (routes: any[]) => {
    setAlternativeRoutes(routes);
    onRoutesChange?.(routes);
  };

  // Pass current drawn routes to form submission
  useEffect(() => {
    const routesString = JSON.stringify(alternativeRoutes);
    form.setValue('alternativeRoutes', routesString);
  }, [alternativeRoutes, form]);

  useEffect(() => {
    onRouteDrawingChange?.(showRouteDrawer);
  }, [showRouteDrawer, onRouteDrawingChange]);

  if (!isOpen) return null;

  return (
    <>
      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingAlert ? "Edit Alert" : "Create New Alert"}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Alert title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Alert description" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="road">Road Hazards</SelectItem>
                            <SelectItem value="criminal">Criminal Activity</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select icon" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(availableIcons).map(([key, IconComponent]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                <span className="capitalize">{key}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expirationHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expires After (hours)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          min="1"
                          max="720"
                          placeholder="24"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <FormLabel>Alternative Routes</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRouteDrawer(!showRouteDrawer)}
                    >
                      {showRouteDrawer ? "Stop Drawing" : "Draw Routes"}
                    </Button>
                  </div>
                  
                  {showRouteDrawer && (
                    <div className="space-y-2">
                      <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                        Click on the map to draw alternative routes. Double-click to finish a route.
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Route Color:</label>
                        <div className="flex gap-2 flex-wrap">
                          {['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#ff9ff3', '#54a0ff'].map((color) => (
                            <button
                              key={color}
                              type="button"
                              className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-500 hover:scale-110 transition-all"
                              style={{ 
                                backgroundColor: color,
                                borderColor: window.currentRouteColor === color ? '#374151' : '#d1d5db'
                              }}
                              onClick={() => {
                                console.log('Color selected:', color);
                                // This will be handled by the parent component
                                if (window.setRouteColor) {
                                  window.setRouteColor(color);
                                  window.currentRouteColor = color;
                                }
                              }}
                              title={`Select ${color}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {alternativeRoutes.length > 0 
                      ? `${alternativeRoutes.length} route(s) drawn`
                      : "No routes drawn yet"
                    }
                  </div>
                  
                  {alternativeRoutes.length > 0 && (
                    <div className="space-y-1">
                      {alternativeRoutes.map((route, index) => (
                        <div key={route.id} className="flex items-center justify-between text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: route.color }}
                            />
                            <span>{route.name}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                            onClick={() => {
                              const newRoutes = alternativeRoutes.filter((_, i) => i !== index);
                              handleRoutesChange(newRoutes);
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="alternativeRoute"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alternative Route Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe alternative routes..." rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="xPosition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>X Position</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            step="0.1"
                            min="0"
                            max="100"
                            readOnly
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="yPosition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Y Position</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            step="0.1"
                            min="0"
                            max="100"
                            readOnly
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={createAlertMutation.isPending || updateAlertMutation.isPending}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {editingAlert ? "Update Alert" : "Create Alert"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>



      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
    </>
  );
}