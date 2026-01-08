"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRestaurantStore } from "@/stores/restaurant";
import { Clock, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function OpeningHoursGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { openingHours, specialHours, loadSettings } = useRestaurantStore();
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [nextOpening, setNextOpening] = useState("");
  const [loading, setLoading] = useState(true);

  // Paths that should NOT be blocked
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
    if (isExcluded) {
      setIsOpen(true);
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

      // Format simple string HH:mm to minutes
      const timeToMinutes = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      if (!currentConfig || currentConfig.closed) {
        setIsOpen(false);
        setMessage("Le restaurant est fermé aujourd'hui.");
        return;
      }

      const openMinutes = timeToMinutes(currentConfig.open);
      const closeMinutes = timeToMinutes(currentConfig.close);

      // Handle cases where closing is after midnight (e.g. 02:00)
      // Standard case: 09:00 - 23:00 (540 - 1380)
      // Late night case: 18:00 - 02:00 (1080 - 120)

      let isCurrentlyOpen = false;

      if (closeMinutes < openMinutes) {
        // Spans midnight
        if (currentTime >= openMinutes || currentTime < closeMinutes) {
            isCurrentlyOpen = true;
        }
      } else {
        // Standard Day
        if (currentTime >= openMinutes && currentTime < closeMinutes) {
            isCurrentlyOpen = true;
        }
      }

      if (!isCurrentlyOpen) {
        setIsOpen(false);
        if (currentTime < openMinutes) {
            setMessage(`Le restaurant n'est pas encore ouvert.`);
            setNextOpening(`Ouvrira à ${currentConfig.open}`);
        } else {
            setMessage(`Le restaurant est fermé pour la journée.`);
            // Maybe calculate next opening day/time logic later if needed
        }
      } else {
        setIsOpen(true);
        setMessage("");
      }
    };

    checkOpeningStatus();
    const interval = setInterval(checkOpeningStatus, 60000); // Check every minute
    return () => clearInterval(interval);

  }, [openingHours, isExcluded, loading]);

  if (loading || isExcluded || isOpen) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md text-center shadow-lg border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Le restaurant est fermé</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-zinc-600 dark:text-zinc-400">
            {message}
          </p>
          {nextOpening && (
             <div className="inline-block px-4 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-full text-sm font-medium">
                {nextOpening}
             </div>
          )}
          
          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <h4 className="text-sm font-semibold mb-3">Nos horaires</h4>
            <div className="space-y-1 text-sm text-zinc-500">
               {/* Display weekly schedule */}
                {Object.entries(openingHours).map(([day, config]) => {
                    const frenchDays: any = {
                        monday: "Lundi", tuesday: "Mardi", wednesday: "Mercredi",
                        thursday: "Jeudi", friday: "Vendredi", saturday: "Samedi", sunday: "Dimanche"
                    };
                    const isToday = new Date().getDay() === ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(day);
                    
                    return (
                        <div key={day} className={`flex justify-between ${isToday ? "font-bold text-black dark:text-white" : ""}`}>
                            <span>{frenchDays[day]}</span>
                            <span>
                                {config.closed ? "Fermé" : `${config.open} - ${config.close}`}
                            </span>
                        </div>
                    );
                })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
