import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, Settings, LogOut, Filter, User } from "lucide-react";
import { useLocation } from "wouter";
import InteractiveMap from "@/components/map/interactive-map";
import AdminPanel from "@/components/admin/admin-panel";
import GameInfrastructurePanel from "@/components/admin/game-infrastructure-panel";
import AlertStats from "@/components/alerts/alert-stats";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showGameInfrastructure, setShowGameInfrastructure] = useState(false);
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
              <Shield className="text-primary text-2xl" />
              <h1 className="text-xl font-bold text-gray-900">CityAlert</h1>
              <Badge variant="default" className="bg-primary text-white">LIVE</Badge>
            </div>
            
            {/* Filter Controls */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Filter Alerts:</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="road">Road Hazards</SelectItem>
                    <SelectItem value="criminal">Criminal Activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Severity:</label>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Admin Controls */}
            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                    className="hidden sm:flex"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Admin Panel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowGameInfrastructure(true)}
                    className="hidden sm:flex"
                  >
                    Game Map
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setLocation("/auth")}
                  className="hidden sm:flex"
                >
                  <User className="h-4 w-4 mr-2" />
                  Admin Login
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
        />
        
        {/* Alert Statistics Panel */}
        <AlertStats />
        
        {/* Admin Panel */}
        {user && showAdminPanel && (
          <AdminPanel onClose={() => setShowAdminPanel(false)} />
        )}

        {/* Game Infrastructure Panel */}
        {user && showGameInfrastructure && (
          <GameInfrastructurePanel onClose={() => setShowGameInfrastructure(false)} />
        )}
        
        {/* Mobile Filter Button */}
        <Button
          className="md:hidden fixed bottom-20 right-4 z-40 rounded-full w-12 h-12 p-0"
          onClick={() => {/* TODO: Show mobile filter modal */}}
        >
          <Filter className="h-5 w-5" />
        </Button>
      </main>
    </div>
  );
}
