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
  Flame,
  Wrench,
  Ban,
  AlertCircle,
  HelpCircle,
  Info,
  MapPin,
  Phone,
  Users,
  TreePine,
  ShieldCheck,
  Crosshair
} from "lucide-react";

interface AlertMarkerProps {
  alert: Alert;
  onClick: () => void;
  scale?: number;
}

export const availableIcons = {
  "alert-triangle": AlertTriangle,
  "construction": Construction,
  "user-x": UserX,
  "ambulance": Ambulance,
  "car": Car,
  "shield": Shield,
  "flame": Flame,
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
  "car-crash": Car,
  "police": ShieldCheck,
  "gun": Crosshair,
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

export default function AlertMarker({ alert, onClick, scale = 1 }: AlertMarkerProps) {
  // Use custom icon if specified, otherwise fall back to category default
  const customIcon = alert.icon ? availableIcons[alert.icon as keyof typeof availableIcons] : null;
  const Icon = customIcon || categoryIcons[alert.category as keyof typeof categoryIcons] || AlertTriangle;
  const colorClass = severityColors[alert.severity as keyof typeof severityColors];
  
  // Calculate responsive size based on zoom level
  const markerScale = Math.max(0.5, Math.min(2, 1 / scale));
  const iconSize = Math.max(12, Math.min(24, 16 * markerScale));
  const fontSize = Math.max(10, Math.min(16, 14 * markerScale));
  const padding = Math.max(8, Math.min(16, 12 * markerScale));
  return (
    <div
      className="absolute cursor-pointer transition-all duration-200 hover:scale-110 hover:z-10"
      style={{
        top: `${alert.yPosition}%`,
        left: `${alert.xPosition}%`,
        zIndex: 10,
        transform: `translate(-50%, -50%) scale(${markerScale})`,
        transformOrigin: 'center center',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div 
        className={`${colorClass} text-white rounded-lg shadow-lg border-2 border-white relative`}
        style={{
          padding: `${padding}px`,
        }}
      >
        <div className="flex items-center space-x-2">
          <Icon style={{ width: `${iconSize}px`, height: `${iconSize}px` }} />
          <span 
            className="font-semibold whitespace-nowrap"
            style={{ fontSize: `${fontSize}px` }}
          >
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
