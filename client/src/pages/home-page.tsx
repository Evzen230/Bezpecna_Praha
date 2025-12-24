import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { LogOut, Filter, User, Plus } from "lucide-react";
import { useLocation } from "wouter";
import InteractiveMap from "@/components/map/interactive-map";
import AlertStats from "@/components/alerts/alert-stats";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-bold text-gray-900">
                Bezpečná Praha
              </h1>
              <Badge variant="default" className="bg-primary text-white">
                ŽIVĚ
              </Badge>
            </div>

            {/* Filter Controls */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Filtrovat upozornění:
                </label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všechny typy</SelectItem>
                    <SelectItem value="road">Dopravní nebezpečí</SelectItem>
                    <SelectItem value="criminal">
                      Kriminální aktivita
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">
                  Závažnost:
                </label>
                <Select
                  value={severityFilter}
                  onValueChange={setSeverityFilter}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Všechny úrovně</SelectItem>
                    <SelectItem value="critical">Kritická</SelectItem>
                    <SelectItem value="high">Vysoká</SelectItem>
                    <SelectItem value="medium">Střední</SelectItem>
                    <SelectItem value="low">Nízká</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* User Controls */}
            <div className="flex items-center space-x-3">
              {user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setLocation("/auth")}
                  className="hidden sm:flex"
                >
                  <User className="h-4 w-4 mr-2" />
                  Přihlášení
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative">
        <InteractiveMap
          categoryFilter={categoryFilter}
          severityFilter={severityFilter}
          isAdmin={!!user}
          isCreatingAlert={isCreatingAlert}
          onCreatingChange={setIsCreatingAlert}
        />

        {/* Alert Statistics Panel */}
        <AlertStats />

        {/* Create Alert Button */}
        {user && (
          <Button
            size="icon"
            className="fixed bottom-6 right-6 z-30 rounded-full w-14 h-14 p-0 shadow-lg"
            onClick={() => setIsCreatingAlert(!isCreatingAlert)}
            data-testid="button-create-alert-map"
            variant={isCreatingAlert ? "default" : "secondary"}
          >
            <Plus className="h-6 w-6" />
          </Button>
        )}

        {/* Mobile Filter Button */}
        <Button
          className="md:hidden fixed bottom-24 right-6 z-30 rounded-full w-12 h-12 p-0"
          onClick={() => {
            /* TODO: Show mobile filter modal */
          }}
        >
          <Filter className="h-5 w-5" />
        </Button>
      </main>
    </div>
  );
}
