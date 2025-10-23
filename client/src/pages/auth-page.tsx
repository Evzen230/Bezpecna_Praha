import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, AlertTriangle, Users, MapPin } from "lucide-react";
import { insertUserSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (user) {
    return null;
  }

  const onLogin = (data: { username: string; password: string }) => {
    loginMutation.mutate(data, {
      onSuccess: () => setLocation("/"),
    });
  };

  const onRegister = (data: { username: string; password: string }) => {
    registerMutation.mutate(data, {
      onSuccess: () => setLocation("/"),
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Auth Forms */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">CityAlert</h1>
            </div>
            <p className="text-gray-600">Přístup pro administrátory do systému upozornění</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Přihlášení</TabsTrigger>
              <TabsTrigger value="register">Registrace</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Přihlášení administrátora</CardTitle>
                  <CardDescription>
                    Přístup k administračnímu panelu pro správu upozornění
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Uživatelské jméno</FormLabel>
                            <FormControl>
                              <Input placeholder="Zadejte uživatelské jméno" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Heslo</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Zadejte heslo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? "Přihlašování..." : "Přihlásit se"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Registrace administrátora</CardTitle>
                  <CardDescription>
                    Vytvořte nový účet pro správu upozornění
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Uživatelské jméno</FormLabel>
                            <FormControl>
                              <Input placeholder="Zvolte uživatelské jméno" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Heslo</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="Vytvořte heslo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? "Vytváření účtu..." : "Registrovat"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right Column - Hero Section */}
      <div className="flex-1 bg-gradient-to-br from-primary to-blue-800 text-white p-8 flex items-center justify-center">
        <div className="max-w-lg text-center space-y-6">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Správa upozornění</h2>
            <p className="text-lg text-blue-100">
              Udržujte svou komunitu v bezpečí díky upozorněním v reálném čase
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 mt-8">
            <div className="flex items-center space-x-3 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <AlertTriangle className="h-8 w-8 text-yellow-300" />
              <div className="text-left">
                <h3 className="font-semibold">Upozornění v reálném čase</h3>
                <p className="text-sm text-blue-100">Okamžitá upozornění</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <MapPin className="h-8 w-8 text-green-300" />
              <div className="text-left">
                <h3 className="font-semibold">Mapování lokací</h3>
                <p className="text-sm text-blue-100">Přesné geografické cílení</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
              <Users className="h-8 w-8 text-purple-300" />
              <div className="text-left">
                <h3 className="font-semibold">Bezpečnost komunity</h3>
                <p className="text-sm text-blue-100">Společná ochrana občanů</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
