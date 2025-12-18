import { Check, Clock, ChefHat, Bell, Utensils, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus as StatusType } from "@/types";
import { motion } from "framer-motion";

interface OrderStatusProps {
  status: StatusType;
}

const STEPS = [
  { id: 'pending', label: 'En attente', icon: Clock, description: 'Commande reçue' },
  { id: 'preparing', label: 'En cuisine', icon: ChefHat, description: 'Préparation en cours' },
  { id: 'ready', label: 'C\'est prêt !', icon: Bell, description: 'À récupérer au comptoir' },
  { id: 'served', label: 'Servi', icon: Utensils, description: 'Bon appétit' },
];

export function OrderStatus({ status }: OrderStatusProps) {
  const currentStepIndex = STEPS.findIndex(s => s.id === status);
  const isReady = status === 'ready';

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Special Celebration Card for Ready State */}
      {isReady && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-8 p-6 bg-green-500 text-white rounded-xl shadow-lg text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
          <PartyPopper className="w-12 h-12 mx-auto mb-2 animate-bounce" />
          <h2 className="text-2xl font-black uppercase tracking-wider mb-1">Votre commande est prête !</h2>
          <p className="font-medium opacity-90">Veuillez vous présenter au comptoir pour la récupérer.</p>
        </motion.div>
      )}

      <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100 dark:before:bg-zinc-800">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="relative group">
              <div className={cn(
                "absolute -left-[2.15rem] flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-500 z-10",
                isCompleted || isCurrent 
                  ? "bg-primary border-primary text-primary-foreground scale-110 shadow-md" 
                  : "bg-background border-zinc-200 text-muted-foreground dark:border-zinc-700"
              )}>
                {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              
              <div className={cn(
                "transition-all duration-300 p-3 rounded-lg", 
                isCurrent ? "bg-zinc-50 dark:bg-zinc-900 translate-x-2 shadow-sm" : "opacity-60"
              )}>
                <h3 className={cn("font-bold leading-none", isCurrent && "text-primary text-lg")}>
                  {step.label}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
