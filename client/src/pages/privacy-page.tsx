import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => setLocation("/")}
          data-testid="button-back-privacy"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zpět na mapu
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Zásady o zpracování osobních údajů</CardTitle>
            <CardDescription>
              Poslední aktualizace: Prosinec 2025
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Úvod</h2>
                <p className="text-gray-700">
                  Vaše soukromí je pro nás důležité. Tyto zásady vysvětlují, jak sbíráme, používáme a chráníme vaše osobní údaje.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Jaké údaje sbíráme</h2>
                <p className="text-gray-700">
                  Sbíráme následující údaje:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>E-mailová adresa</li>
                  <li>Uživatelské jméno</li>
                  <li>Informace z upozornění, která vytváříte</li>
                  <li>IP adresa a informace o zařízení</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Jak používáme vaše údaje</h2>
                <p className="text-gray-700">
                  Vaše údaje používáme pro:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Poskytování a zlepšování služby</li>
                  <li>Komunikaci s vámi</li>
                  <li>Vymáhání bezpečnosti a prevence podvodů</li>
                  <li>Soulad s právními požadavky</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Ochrana údajů</h2>
                <p className="text-gray-700">
                  Používáme technické bezpečnostní opatření k ochraně vašich údajů před neoprávněným přístupem, změnou a zničením.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Sdílení údajů</h2>
                <p className="text-gray-700">
                  Vaše osobní údaje nesdílíme s třetími stranami bez vašeho svolení, pokud to není vyžadováno zákonem.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Vaše práva</h2>
                <p className="text-gray-700">
                  Máte právo:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Přistupovat ke svým osobním údajům</li>
                  <li>Opravit nepřesné údaje</li>
                  <li>Požádat o smazání údajů</li>
                  <li>Namítat zpracování vašich údajů</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">7. Kontakt</h2>
                <p className="text-gray-700">
                  Pokud máte otázky ohledně těchto zásad, prosím kontaktujte nás přes naši webovou stránku.
                </p>
              </section>

              <section className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Toto je zástupný dokument o zásadách ochrany soukromí. Prosím, nahraďte jej svými vlastními zásadami ochrany soukromí v souladu s GDPR a místními zákony.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
