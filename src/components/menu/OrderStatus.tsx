import { Check, Clock, ChefHat, Bell, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OrderStatus as StatusType } from "@/types";

interface OrderStatusProps {
  status: StatusType;
}

const STEPS = [
  { id: 'pending', label: 'En attente', icon: Clock, description: 'Votre commande a été envoyée' },
  { id: 'preparing', label: 'En préparation', icon: ChefHat, description: 'Nos chefs cuisinent pour vous' },
  { id: 'ready', label: 'Prêt', icon: Bell, description: 'Votre commande est prête à être servie' },
  { id: 'served', label: 'Servi', icon: Utensils, description: 'Bon appétit !' },
];

export function OrderStatus({ status }: OrderStatusProps) {
  const currentStepIndex = STEPS.findIndex(s => s.id === status);

  return (
    <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100 dark:before:bg-zinc-800">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const Icon = step.icon;

        return (
          <div key={step.id} className="relative">
            <div className={cn(
              "absolute -left-[2.15rem] flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
              isCompleted || isCurrent 
                ? "bg-primary border-primary text-primary-foreground" 
                : "bg-background border-zinc-200 text-muted-foreground dark:border-zinc-700"
            )}>
              {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </div>
            
            <div className={cn("transition-opacity", isCurrent ? "opacity-100" : "opacity-70")}>
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
  );
}
