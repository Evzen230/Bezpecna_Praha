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
import { LogOut, Filter, User, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import InteractiveMap from "@/components/map/interactive-map";
import AlertStats from "@/components/alerts/alert-stats";
import { motion, AnimatePresence } from "framer-motion";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreatingAlert, setIsCreatingAlert] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header Navigation */}
      <header className="bg-white shadow-sm border-b border-gray-200 relative z-50 shrink-0">
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
                  Filtrovat:
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
                    <SelectItem value="road">Dopravní</SelectItem>
                    <SelectItem value="criminal">Kriminální</SelectItem>
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
                    <SelectItem value="all">Všechny</SelectItem>
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
      <main className="relative flex flex-1 overflow-hidden h-full">
        {/* Sidebar Toggle Button (Floating) */}
        <Button
          size="icon"
          variant="secondary"
          className={`fixed top-20 z-30 transition-all duration-300 shadow-md ${
            isSidebarOpen ? "left-[304px]" : "left-4"
          }`}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          data-testid="button-toggle-sidebar"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        {/* Sidebar for stats and filters */}
        <motion.aside 
          initial={false}
          animate={{ width: isSidebarOpen ? 320 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="bg-white border-r border-gray-200 z-20 shadow-lg flex flex-col relative"
        >
          <div className={`flex-1 overflow-y-auto w-80 ${!isSidebarOpen && "invisible"}`}>
            <div className="p-4 h-full">
              <AlertStats />
            </div>
          </div>
        </motion.aside>

        {/* Map area */}
        <section className="flex-1 relative bg-gray-900">
          <InteractiveMap
            categoryFilter={categoryFilter}
            severityFilter={severityFilter}
            isAdmin={!!user}
            isCreatingAlert={isCreatingAlert}
            onCreatingChange={setIsCreatingAlert}
          />
        </section>

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
      </main>
    </div>
  );
}
