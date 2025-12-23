import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, Users, MapPin } from "lucide-react";
import { insertUserSchema, loginSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { user, loginMutation, registerMutation, verifyEmailMutation, requestPasswordResetMutation, resetPasswordMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("login");
  const [pendingVerification, setPendingVerification] = useState<{ email: string; verificationCode: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmailOrUsername, setResetEmailOrUsername] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetCodeReceived, setResetCodeReceived] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const { toast } = useToast();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

  const registerForm = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      acceptedTerms: false,
      acceptedPrivacy: false,
    },
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (user) {
    return null;
  }

  const onLogin = (data: any) => {
    loginMutation.mutate(data, {
      onSuccess: () => setLocation("/"),
    });
  };

  const onRegister = (data: any) => {
    registerMutation.mutate(data, {
      onSuccess: (response) => {
        toast({
          title: "Registrace úspěšná",
          description: "Zkontrolujte svou e-mailovou adresu pro ověřovací kód.",
        });
        setPendingVerification({ 
          email: data.email,
          verificationCode: response.verificationCode || ""
        });
        registerForm.reset();
      },
    });
  };

  const onVerifyEmail = () => {
    if (!pendingVerification || !verificationCode) {
      toast({
        title: "Chyba",
        description: "Zadejte ověřovací kód.",
        variant: "destructive",
      });
      return;
    }

    verifyEmailMutation.mutate(
      { email: pendingVerification.email, verificationCode },
      {
        onSuccess: () => {
          toast({
            title: "E-mail ověřen",
            description: "Nyní se můžete přihlásit.",
          });
          setPendingVerification(null);
          setVerificationCode("");
          setActiveTab("login");
        },
      }
    );
  };

  const onRequestPasswordReset = () => {
    if (!resetEmailOrUsername) {
      toast({
        title: "Chyba",
        description: "Zadejte e-mail nebo uživatelské jméno.",
        variant: "destructive",
      });
      return;
    }

    requestPasswordResetMutation.mutate(
      { emailOrUsername: resetEmailOrUsername },
      {
        onSuccess: (response) => {
          setResetCodeReceived(response.resetCode);
          toast({
            title: "Reset kód vygenerován",
            description: "Reset kód je zobrazen níže.",
          });
        },
      }
    );
  };

  const onResetPassword = () => {
    if (!resetCode || !newPassword) {
      toast({
        title: "Chyba",
        description: "Zadejte reset kód a nové heslo.",
        variant: "destructive",
      });
      return;
    }

    resetPasswordMutation.mutate(
      { emailOrUsername: resetEmailOrUsername, resetCode, newPassword },
      {
        onSuccess: () => {
          toast({
            title: "Heslo změněno",
            description: "Nyní se můžete přihlásit novým heslem.",
          });
          setShowPasswordReset(false);
          setResetEmailOrUsername("");
          setResetCode("");
          setResetCodeReceived(null);
          setNewPassword("");
        },
      }
    );
  };

  if (pendingVerification) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-gray-900">CityAlert</h1>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Ověřte svou e-mailovou adresu</CardTitle>
                <CardDescription>
                  Zadejte ověřovací kód odeslán na {pendingVerification.email}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingVerification.verificationCode && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <strong>Váš ověřovací kód:</strong> <code className="font-mono font-bold text-lg">{pendingVerification.verificationCode}</code>
                    </AlertDescription>
                  </Alert>
                )}
                <div>
                  <Label htmlFor="code">Ověřovací kód</Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="Zadejte 6místný kód"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
                    maxLength={6}
                    data-testid="input-verification-code"
                  />
                </div>
                <Button
                  onClick={onVerifyEmail}
                  className="w-full"
                  disabled={verifyEmailMutation.isPending || verificationCode.length !== 6}
                  data-testid="button-verify-email"
                >
                  {verifyEmailMutation.isPending ? "Ověřování..." : "Ověřit e-mail"}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setPendingVerification(null);
                    setVerificationCode("");
                  }}
                  data-testid="button-back"
                >
                  Zpět
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex-1 bg-gradient-to-br from-primary to-blue-800 text-white p-8 flex items-center justify-center">
          <div className="max-w-lg text-center space-y-6">
            <h2 className="text-3xl font-bold">Ověřování e-mailu</h2>
            <p className="text-lg text-blue-100">
              Přijímáte ověřovací kód, který potřebujete k aktivaci svého účtu.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showPasswordReset) {
    return (
      <div className="min-h-screen flex">
        <div className="flex-1 flex items-center justify-center p-8 bg-white">
          <div className="w-full max-w-md space-y-6">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Shield className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold text-gray-900">CityAlert</h1>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Reset hesla</CardTitle>
                <CardDescription>
                  Zadejte e-mail nebo uživatelské jméno
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!resetCodeReceived ? (
                  <>
                    <div>
                      <Label htmlFor="reset-email">E-mail nebo uživatelské jméno</Label>
                      <Input
                        id="reset-email"
                        type="text"
                        placeholder="vase@email.cz nebo uživatelské jméno"
                        value={resetEmailOrUsername}
                        onChange={(e) => setResetEmailOrUsername(e.target.value)}
                        data-testid="input-reset-email"
                      />
                    </div>
                    <Button
                      onClick={onRequestPasswordReset}
                      className="w-full"
                      disabled={requestPasswordResetMutation.isPending}
                      data-testid="button-request-reset"
                    >
                      {requestPasswordResetMutation.isPending ? "Generování..." : "Odeslat reset kód"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertTriangle className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <strong>Váš reset kód:</strong> <code className="font-mono font-bold text-lg">{resetCodeReceived}</code>
                      </AlertDescription>
                    </Alert>
                    <div>
                      <Label htmlFor="reset-code">Reset kód</Label>
                      <Input
                        id="reset-code"
                        type="text"
                        placeholder="Zadejte 6místný reset kód"
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.slice(0, 6))}
                        maxLength={6}
                        data-testid="input-reset-code"
                      />
                    </div>
                    <div>
                      <Label htmlFor="new-password">Nové heslo</Label>
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Zadejte nové heslo"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        data-testid="input-new-password"
                      />
                    </div>
                    <Button
                      onClick={onResetPassword}
                      className="w-full"
                      disabled={resetPasswordMutation.isPending || resetCode.length !== 6 || !newPassword}
                      data-testid="button-reset-password"
                    >
                      {resetPasswordMutation.isPending ? "Resetování..." : "Resetovat heslo"}
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowPasswordReset(false);
                    setResetEmailOrUsername("");
                    setResetCode("");
                    setResetCodeReceived(null);
                    setNewPassword("");
                  }}
                  data-testid="button-back-reset"
                >
                  Zpět
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex-1 bg-gradient-to-br from-primary to-blue-800 text-white p-8 flex items-center justify-center">
          <div className="max-w-lg text-center space-y-6">
            <h2 className="text-3xl font-bold">Zapomenuté heslo?</h2>
            <p className="text-lg text-blue-100">
              Zadejte svůj e-mail nebo uživatelské jméno a obdržíte reset kód.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">CityAlert</h1>
            </div>
            <p className="text-gray-600">Systém upozornění pro komunitu</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Přihlášení</TabsTrigger>
              <TabsTrigger value="register">Registrace</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Přihlášení</CardTitle>
                  <CardDescription>
                    Přihlaste se e-mailem, uživatelským jménem a heslem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="emailOrUsername"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail nebo uživatelské jméno</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="vase@email.cz nebo vaše_jméno"
                                {...field}
                                data-testid="input-login-email"
                              />
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
                              <Input
                                type="password"
                                placeholder="Zadejte heslo"
                                {...field}
                                data-testid="input-login-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                        data-testid="button-login"
                      >
                        {loginMutation.isPending ? "Přihlašování..." : "Přihlásit se"}
                      </Button>
                    </form>
                  </Form>
                  <Button
                    variant="link"
                    className="w-full mt-4"
                    onClick={() => setShowPasswordReset(true)}
                    data-testid="button-forgot-password"
                  >
                    Zapomenuté heslo?
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Registrace</CardTitle>
                  <CardDescription>
                    Vytvořte nový účet
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>E-mail</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="vase@email.cz"
                                {...field}
                                data-testid="input-register-email"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Uživatelské jméno</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Zvolte uživatelské jméno"
                                {...field}
                                data-testid="input-register-username"
                              />
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
                              <Input
                                type="password"
                                placeholder="Vytvořte heslo"
                                {...field}
                                data-testid="input-register-password"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="acceptedTerms"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-terms"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-normal cursor-pointer">
                                Souhlasím s{" "}
                                <a href="/terms" className="underline text-primary hover:text-primary/80">
                                  podmínkami používání
                                </a>
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="acceptedPrivacy"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-privacy"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-normal cursor-pointer">
                                Souhlasím se{" "}
                                <a href="/privacy" className="underline text-primary hover:text-primary/80">
                                  zásadami o zpracování osobních údajů
                                </a>
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={registerMutation.isPending}
                        data-testid="button-register"
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
