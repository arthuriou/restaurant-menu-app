"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@/stores/auth";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user?: User | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function UserAvatar({ user, size = "md", className }: UserAvatarProps) {
  if (!user) return null;

  const initials = user.avatar || user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={user.avatar} alt={user.name} />
      <AvatarFallback className="bg-primary/10 text-primary font-bold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
