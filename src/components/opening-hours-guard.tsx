"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRestaurantStore } from "@/stores/restaurant";
import { Clock } from "lucide-react";

export function OpeningHoursGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { openingHours, loadSettings, setRestaurantOpen, isRestaurantOpen } = useRestaurantStore();
  const [loading, setLoading] = useState(true);
  const [nextOpening, setNextOpening] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  // Paths that should NOT be affected
  const excludedPaths = [
    "/admin",
    "/login",
    "/kitchen",
    "/pos",
    "/server",
    "/print"
  ];

  const isExcluded = excludedPaths.some(path => pathname?.startsWith(path));

  useEffect(() => {
    loadSettings().finally(() => setLoading(false));
  }, [loadSettings]);

  useEffect(() => {
    // If excluded, always consider "Open" (allow actions)
    if (isExcluded) {
      setRestaurantOpen(true);
      return;
    }

    if (loading) return;

    const checkOpeningStatus = () => {
      const now = new Date();
      // Format current day to match keys in openingHours (monday, tuesday...)
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const currentDayName = days[now.getDay()];
      
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const currentConfig = openingHours[currentDayName];

      const timeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      let isOpenNow = false;
      let msg = "";

      if (!currentConfig || currentConfig.closed) {
        isOpenNow = false;
        msg = "Le restaurant est fermé aujourd'hui.";
      } else {
        const openMinutes = timeToMinutes(currentConfig.open);
        const closeMinutes = timeToMinutes(currentConfig.close);

        if (closeMinutes < openMinutes) {
            // Spans midnight
            if (currentTime >= openMinutes || currentTime < closeMinutes) {
                isOpenNow = true;
            }
        } else {
            // Standard Day
            if (currentTime >= openMinutes && currentTime < closeMinutes) {
                isOpenNow = true;
            }
        }

        if (!isOpenNow) {
            if (currentTime < openMinutes) {
                msg = `Le restaurant n'est pas encore ouvert.`;
                setNextOpening(`Ouvrira à ${currentConfig.open}`);
            } else {
                msg = `Le restaurant est fermé pour la journée.`;
            }
        }
      }

      setRestaurantOpen(isOpenNow);
      setStatusMessage(msg);
    };

    checkOpeningStatus();
    const interval = setInterval(checkOpeningStatus, 60000); // Check every minute
    return () => clearInterval(interval);

  }, [openingHours, isExcluded, loading, setRestaurantOpen]);

  // Always render children. Use a banner if closed.
  return (
    <div className="flex flex-col min-h-[100dvh]">
      {!isRestaurantOpen && !isExcluded && !loading && (
        <div className="w-full bg-red-600 text-white px-4 py-3 text-center shadow-md flex flex-col sm:flex-row items-center justify-center gap-2 animate-in slide-in-from-top duration-500 z-[100]">
           <div className="flex items-center gap-2">
             <Clock className="w-4 h-4" />
             <span className="font-bold uppercase tracking-wide">Fermé</span>
           </div>
           <span className="text-sm font-medium opacity-90">
             {statusMessage}
             {nextOpening && <span className="ml-1">({nextOpening})</span>}
           </span>
        </div>
      )}
      
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
