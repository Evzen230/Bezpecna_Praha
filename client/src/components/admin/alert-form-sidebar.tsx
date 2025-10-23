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

  const [expirationMinutes, setExpirationMinutes] = useState(60);

  const form = useForm<z.infer<typeof insertAlertSchema>>({
    resolver: zodResolver(insertAlertSchema),
    defaultValues: {
      title: editingAlert?.title || "",
      description: editingAlert?.description || "",
      category: (editingAlert?.category as "road" | "criminal") || "road",
      severity: (editingAlert?.severity as "low" | "medium" | "high" | "critical") || "medium",
      xPosition: editingAlert ? editingAlert.xPosition : (initialPosition?.x ?? 50),
      yPosition: editingAlert ? editingAlert.yPosition : (initialPosition?.y ?? 50),
      alternativeRoute: editingAlert?.alternativeRoute || "",
      isActive: editingAlert?.isActive ?? true,
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
        title: "Úspěch",
        description: "Upozornění bylo úspěšně vytvořeno",
      });
      form.reset();
      onAfterSubmit?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Chyba",
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
        title: "Úspěch",
        description: "Upozornění bylo úspěšně aktualizováno",
      });
      onAfterSubmit?.();
    },
    onError: (error: Error) => {
      toast({
        title: "Chyba",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof insertAlertSchema>) => {
    const submitData: any = {
      ...data,
      expiresAt: expirationMinutes > 0 
        ? new Date(Date.now() + expirationMinutes * 60000)
        : null,
    };

    if (editingAlert) {
      updateAlertMutation.mutate(submitData);
    } else {
      createAlertMutation.mutate(submitData);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-900 shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {editingAlert ? "Upravit upozornění" : "Vytvořit nové upozornění"}
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
                      <FormLabel>Název</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Název upozornění" />
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
                      <FormLabel>Popis</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Popis upozornění" rows={3} />
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
                        <FormLabel>Kategorie</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte kategorii" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="road">Dopravní nebezpečí</SelectItem>
                            <SelectItem value="criminal">Kriminální aktivita</SelectItem>
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
                        <FormLabel>Závažnost</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte závažnost" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Nízká</SelectItem>
                            <SelectItem value="medium">Střední</SelectItem>
                            <SelectItem value="high">Vysoká</SelectItem>
                            <SelectItem value="critical">Kritická</SelectItem>
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
                      <FormLabel>Ikona</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte ikonu" />
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

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Vyprší za
                  </label>
                  <Select onValueChange={(value) => setExpirationMinutes(parseInt(value))} defaultValue={String(expirationMinutes)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minut</SelectItem>
                      <SelectItem value="10">10 minut</SelectItem>
                      <SelectItem value="15">15 minut</SelectItem>
                      <SelectItem value="30">30 minut</SelectItem>
                      <SelectItem value="60">1 hodina</SelectItem>
                      <SelectItem value="360">6 hodin</SelectItem>
                      <SelectItem value="1440">24 hodin</SelectItem>
                      <SelectItem value="10080">1 týden</SelectItem>
                      <SelectItem value="0">Nikdy nevyprší</SelectItem>
                    </SelectContent>
                  </Select>
                </div>


                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="xPosition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>X Pozice (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            step="0.1"
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
                        <FormLabel>Y Pozice (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value))}
                            step="0.1"
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
                    {editingAlert ? "Aktualizovat upozornění" : "Vytvořit upozornění"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                  >
                    Zrušit
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