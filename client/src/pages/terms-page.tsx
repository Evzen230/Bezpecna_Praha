import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => setLocation("/auth")}
          data-testid="button-back-terms"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zpět
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Podmínky používání</CardTitle>
            <CardDescription>
              Poslední aktualizace: Prosinec 2025
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <div className="space-y-6">
              <section>
                <h2 className="text-xl font-semibold mb-3">1. Přijetí podmínek</h2>
                <p className="text-gray-700">
                  Používáním služby CityAlert souhlasíte s těmito podmínkami používání. Pokud s nimi nesouhlasíte, prosím službu nepoužívejte.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">2. Popis služby</h2>
                <p className="text-gray-700">
                  CityAlert je platforma pro sdílení upozornění v komunity. Uživatelé mohou vytvářet a sdílet upozornění o situacích, které mohou ovlivnit bezpečnost komunity.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">3. Odpovědnost uživatele</h2>
                <p className="text-gray-700">
                  Souhlasíte, že:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Budete dodržovat všechny platné zákony a předpisy</li>
                  <li>Nebudete vytvářet falešná nebo zavádějící upozornění</li>
                  <li>Budete odpovědný za obsah, který vytváříte</li>
                  <li>Nebudete používat službu k ohrožování bezpečnosti</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">4. Práva a povinnosti</h2>
                <p className="text-gray-700">
                  Udělujete nám právo hostovat, reprodukovat a šířit obsah, který vytváříte. Zachováváte si právo vlastnictví obsahu, který vytváříte.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">5. Omezení odpovědnosti</h2>
                <p className="text-gray-700">
                  Služba se poskytuje bez záruk. Neneseme odpovědnost za přímé, nepřímé, náhodné nebo následné škody.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold mb-3">6. Změny podmínek</h2>
                <p className="text-gray-700">
                  Vyhrazujeme si právo tyto podmínky kdykoli změnit. Budete informováni o významných změnách.
                </p>
              </section>

              <section className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  Toto jsou zástupné podmínky používání. Prosím, nahraďte je svými vlastními právními podmínkami podle vašich potřeb a místních zákonů.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
