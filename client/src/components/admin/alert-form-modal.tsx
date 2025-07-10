import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertAlertSchema, Alert } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Save, X } from "lucide-react";
import RouteDrawer from "./route-drawer";
import { availableIcons } from "@/components/alerts/alert-marker";

interface AlertFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPosition?: { x: number; y: number } | null;
  editingAlert?: Alert | null;
  onAfterSubmit?: () => void;
}

const extendedAlertSchema = insertAlertSchema.extend({
  expirationHours: insertAlertSchema.shape.expirationHours.default(24),
  alternativeRoute: insertAlertSchema.shape.alternativeRoute.optional(),
});

export default function AlertFormModal({ 
  isOpen, 
  onClose, 
  initialPosition, 
  editingAlert,
  onAfterSubmit 
}: AlertFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [alternativeRoutes, setAlternativeRoutes] = useState<any[]>(
    editingAlert?.alternativeRoutes ? JSON.parse(editingAlert.alternativeRoutes) : []
  );

  const form = useForm<z.infer<typeof insertAlertSchema>>({
    resolver: zodResolver(insertAlertSchema),
    defaultValues: {
      title: editingAlert?.title || "",
      description: editingAlert?.description || "",
      category: editingAlert?.category || "road",
      severity: editingAlert?.severity || "medium",
      xPosition: editingAlert?.xPosition || initialPosition?.x || 50,
      yPosition: editingAlert?.yPosition || initialPosition?.y || 50,
      alternativeRoute: editingAlert?.alternativeRoute || "",
      icon: editingAlert?.icon || "",
      expirationHours: 24,
    },
  });

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

  const onSubmit = (data: any) => {
    console.log('Form submitted with data:', data);

    const alertData = {
        ...data,
        alternativeRoutes: JSON.stringify(alternativeRoutes),
        icon: data.icon || null,
        expiresAt: data.expirationHours > 0 ? 
          new Date(Date.now() + data.expirationHours * 60 * 60 * 1000).toISOString() : 
          null
      };

    console.log('Processed alert data:', alertData);

    if (editingAlert) {
      updateAlertMutation.mutate(alertData);
    } else {
      createAlertMutation.mutate(alertData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingAlert ? "Edit Alert" : "Add New Alert"}</DialogTitle>
          <DialogDescription>
            {editingAlert ? "Modify the alert details below" : "Create a new emergency alert by filling out the form below"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alert Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an icon" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(availableIcons).map(([key, IconComponent]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center space-x-2">
                            <IconComponent className="h-4 w-4" />
                            <span className="capitalize">{key.replace('-', ' ')}</span>
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alert Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief alert title" {...field} />
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
                    <Textarea 
                      placeholder="Detailed description of the alert"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="alternativeRoute"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alternative Route (for road closures)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="e.g., Use Main St instead of Oak Ave, or take Highway 101 detour"
                      rows={2}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Route Drawing Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Draw Alternative Routes on Map</label>
              <RouteDrawer
                onRoutesChange={setAlternativeRoutes}
                initialRoutes={editingAlert?.alternativeRoutes ? JSON.parse(editingAlert.alternativeRoutes) : []}
              />
            </div>

            <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded">
              Position will be automatically set from where you click on the map
            </div>

            <FormField
              control={form.control}
              name="expirationHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auto-expire after</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="6">6 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="168">1 week</SelectItem>
                      <SelectItem value="0">Never expire</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createAlertMutation.isPending || updateAlertMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {createAlertMutation.isPending || updateAlertMutation.isPending ? "Saving..." : "Save Alert"}
              </Button>
              <Button 
                type="button" 
                variant="secondary"
                className="flex-1"
                onClick={onClose}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}