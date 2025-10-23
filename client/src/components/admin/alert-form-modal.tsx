import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertAlertSchema, Alert, InsertAlert } from "@shared/schema";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Save, X } from "lucide-react";
import { availableIcons } from "@/components/alerts/alert-marker";

interface AlertFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPosition?: { x: number; y: number } | null;
  editingAlert?: Alert | null;
  onAfterSubmit?: () => void;
}

const extendedAlertSchema = insertAlertSchema.extend({
  expirationMinutes: insertAlertSchema.shape.expirationMinutes.default(60),
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

  const form = useForm<z.infer<typeof insertAlertSchema>>({
    resolver: zodResolver(insertAlertSchema),
    defaultValues: {
      title: editingAlert?.title || "",
      description: editingAlert?.description || "",
      category: (editingAlert?.category as "road" | "criminal") || "road",
      severity: (editingAlert?.severity as "low" | "medium" | "high" | "critical") || "medium",
      xPosition: editingAlert ? Number(editingAlert.xPosition) : (initialPosition?.x ?? 50),
      yPosition: editingAlert ? Number(editingAlert.yPosition) : (initialPosition?.y ?? 50),
      alternativeRoute: editingAlert?.alternativeRoute || "",
      expirationMinutes: 60,
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

  const onSubmit = (data: any) => {
    console.log('Form submitted with data:', data);

    const alertData = {
        ...data,
        xPosition: data.xPosition ?? initialPosition?.x ?? 50,
        yPosition: data.yPosition ?? initialPosition?.y ?? 50,
        icon: data.icon || null,
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
          <DialogTitle>{editingAlert ? "Upravit upozornění" : "Přidat nové upozornění"}</DialogTitle>
          <DialogDescription>
            {editingAlert ? "Upravte podrobnosti upozornění níže" : "Vytvořte nové upozornění vyplněním formuláře níže"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategorie upozornění</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ikona</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte ikonu" />
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
                  <FormLabel>Název upozornění</FormLabel>
                  <FormControl>
                    <Input placeholder="Stručný název upozornění" {...field} />
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
                    <Textarea 
                      placeholder="Podrobný popis upozornění"
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="text-xs text-gray-500 p-2 bg-blue-50 rounded">
              Pozice bude automaticky nastavena podle toho, kam kliknete na mapě
            </div>

            <FormField
              control={form.control}
              name="expirationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vyprší za</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
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
                {createAlertMutation.isPending || updateAlertMutation.isPending ? "Ukládání..." : "Uložit upozornění"}
              </Button>
              <Button 
                type="button" 
                variant="secondary"
                className="flex-1"
                onClick={onClose}
              >
                <X className="h-4 w-4 mr-2" />
                Zrušit
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}