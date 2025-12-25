import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cookie } from "lucide-react";

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="p-4 shadow-lg border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-full shrink-0">
              <Cookie className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Souhlas s cookies</p>
              <p className="text-sm text-muted-foreground">
                Tento web používá soubory cookies k zajištění nejlepšího uživatelského zážitku.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={acceptCookies}
              data-testid="button-cookie-decline"
            >
              Nezbytné
            </Button>
            <Button 
              size="sm" 
              onClick={acceptCookies}
              data-testid="button-cookie-accept"
            >
              Rozumím
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
