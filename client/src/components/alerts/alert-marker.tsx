import { Alert } from "@shared/schema";
import { 
  AlertTriangle, 
  UserX, 
  Ambulance, 
  Cloud, 
  Car,
  Construction,
  Shield,
  Zap,
  Fire,
  Wrench,
  Ban,
  AlertCircle,
  HelpCircle,
  Info,
  MapPin,
  Phone,
  Users,
  TreePine
} from "lucide-react";

interface AlertMarkerProps {
  alert: Alert;
  onClick: () => void;
}

export const availableIcons = {
  "alert-triangle": AlertTriangle,
  "construction": Construction,
  "user-x": UserX,
  "ambulance": Ambulance,
  "car": Car,
  "shield": Shield,
  "fire": Fire,
  "wrench": Wrench,
  "ban": Ban,
  "alert-circle": AlertCircle,
  "help-circle": HelpCircle,
  "info": Info,
  "map-pin": MapPin,
  "phone": Phone,
  "users": Users,
  "tree-pine": TreePine,
  "zap": Zap,
  "cloud": Cloud,
};

const categoryIcons = {
  road: Construction,
  criminal: UserX,
};

const severityColors = {
  critical: "bg-red-500 border-red-600",
  high: "bg-orange-500 border-orange-600",
  medium: "bg-yellow-500 border-yellow-600",
  low: "bg-green-500 border-green-600",
};

export default function AlertMarker({ alert, onClick }: AlertMarkerProps) {
  // Use custom icon if specified, otherwise fall back to category default
  const customIcon = alert.icon ? availableIcons[alert.icon as keyof typeof availableIcons] : null;
  const Icon = customIcon || categoryIcons[alert.category as keyof typeof categoryIcons] || AlertTriangle;
  const colorClass = severityColors[alert.severity as keyof typeof severityColors];
  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10"
      style={{
        top: `${alert.yPosition}%`,
        left: `${alert.xPosition}%`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div className={`
        ${colorClass} text-white px-3 py-2 rounded-lg shadow-lg border-2 border-white relative
      `}>
        <div className="flex items-center space-x-2">
          <Icon className="h-4 w-4" />
          <span className="font-semibold text-sm whitespace-nowrap">
            {alert.title}
          </span>
        </div>
        {/* Arrow pointing down */}
        <div 
          className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent`}
          style={{
            borderTopColor: alert.severity === "critical" ? "#ef4444" :
                           alert.severity === "high" ? "#f97316" :
                           alert.severity === "medium" ? "#eab308" : "#22c55e"
          }}
        />
      </div>
    </div>
  );
}
