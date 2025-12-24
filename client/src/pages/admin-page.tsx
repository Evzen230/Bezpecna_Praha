import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Ban, CheckCircle, ArrowLeft } from "lucide-react";

interface UserItem {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  isBanned: boolean;
  banReason?: string;
  createdAt: string;
}

export default function AdminPage() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (user.role !== 'admin') {
      navigate("/");
      return;
    }
  }, [user, navigate]);

  const { data: users = [], refetch } = useQuery<UserItem[]>({
    queryKey: ['/api/admin/users'],
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'admin' | 'user' }) => {
      return apiRequest('PATCH', `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      toast({ title: "Úspěch", description: "Role byla změněna" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    },
  });

  const banMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      return apiRequest('POST', `/api/admin/ban/${userId}`, { reason });
    },
    onSuccess: () => {
      toast({ title: "Úspěch", description: "Uživatel byl zablokován" });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    },
  });

  const unbanMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest('POST', `/api/admin/unban/${userId}`, {});
    },
    onSuccess: () => {
      toast({ title: "Úspěch", description: "Uživatel byl odblokován" });
      refetch();
    },
    onError: (error: any) => {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    },
  });

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-4"
          data-testid="button-back-admin"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zpět na mapu
        </Button>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="w-8 h-8" />
              Admin Panel
            </h1>
            <p className="text-muted-foreground mt-1">Správa uživatelů a oprávnění</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => logoutMutation.mutate()} 
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            Odhlásit
          </Button>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Uživatelé systému</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Uživatelské jméno</th>
                  <th className="text-left py-2 px-4">E-mail</th>
                  <th className="text-left py-2 px-4">Role</th>
                  <th className="text-left py-2 px-4">Status</th>
                  <th className="text-left py-2 px-4">Akce</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b hover:bg-accent/50">
                    <td className="py-3 px-4 font-medium">{u.username}</td>
                    <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>
                          {u.role === 'admin' ? 'Admin' : 'User'}
                        </Badge>
                        <select
                          value={u.role}
                          onChange={(e) => {
                            changeRoleMutation.mutate({
                              userId: u.id,
                              role: e.target.value as 'admin' | 'user',
                            });
                          }}
                          disabled={changeRoleMutation.isPending}
                          className="text-xs bg-background border rounded px-2 py-1 cursor-pointer"
                          data-testid={`select-role-${u.id}`}
                        >
                          <option value="user">Změnit na User</option>
                          <option value="admin">Změnit na Admin</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {u.isBanned ? (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <Ban className="w-3 h-3" />
                          Zablokován
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <CheckCircle className="w-3 h-3" />
                          Aktivní
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {u.isBanned ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => unbanMutation.mutate(u.id)}
                            disabled={unbanMutation.isPending}
                            data-testid={`button-unban-${u.id}`}
                          >
                            Odblokovat
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              const reason = prompt('Důvod blokování:');
                              if (reason && reason.length >= 5) {
                                banMutation.mutate({ userId: u.id, reason });
                              } else if (reason) {
                                toast({
                                  title: "Chyba",
                                  description: "Důvod musí mít alespoň 5 znaků",
                                  variant: "destructive",
                                });
                              }
                            }}
                            disabled={banMutation.isPending}
                            data-testid={`button-ban-${u.id}`}
                          >
                            Blokovat
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Celkem: {users.length} uživatelů
          </p>
        </Card>

        <Card className="p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Debug - Databáze</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Podívej se na všechna data v aplikaci (JSON formát)
          </p>
          <Button 
            onClick={() => {
              fetch('/api/admin/debug', { credentials: 'include' })
                .then(r => r.json())
                .then(data => {
                  const json = JSON.stringify(data, null, 2);
                  console.log('Database:', data);
                  toast({ 
                    title: "Databáze", 
                    description: "Data jsou vidět v konzoli (F12 → Console)" 
                  });
                  // Also copy to clipboard
                  navigator.clipboard.writeText(json);
                });
            }}
            variant="outline"
            className="gap-2"
            data-testid="button-view-database"
          >
            Zobrazit data
          </Button>
          <Button 
            onClick={() => {
              if (confirm('Opravdu chceš smazat VŠECHNA data?')) {
                fetch('/api/admin/debug/clear', { 
                  method: 'POST',
                  credentials: 'include' 
                })
                  .then(r => r.json())
                  .then(() => {
                    toast({ 
                      title: "Smazáno", 
                      description: "Všechna data byla odstraněna" 
                    });
                    refetch();
                  });
              }
            }}
            variant="destructive"
            className="gap-2 ml-2"
            data-testid="button-clear-database"
          >
            Smazat vše
          </Button>
        </Card>
      </div>
    </div>
  );
}
