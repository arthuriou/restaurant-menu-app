"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ChefHat, Loader2, Delete, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithPin } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  
  // Email Form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // PIN Form
  const [pin, setPin] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      redirectUser();
    } catch (error: any) {
      toast.error(error.message || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinLogin = async () => {
    if (pin.length < 4) return;
    setIsLoading(true);
    try {
      await loginWithPin(pin);
      redirectUser();
    } catch (error: any) {
      toast.error(error.message || "Code PIN invalide");
      setPin("");
    } finally {
      setIsLoading(false);
    }
  };

  const redirectUser = () => {
    const user = useAuthStore.getState().user;
    toast.success(`Bienvenue ${user?.name}`);
    switch (user?.role) {
      case 'admin': router.push('/admin'); break;
      case 'server': router.push('/server'); break;
      case 'kitchen': router.push('/kitchen'); break;
      default: router.push('/');
    }
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
    }
  };

  const handlePinDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
      <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <ChefHat className="w-8 h-8" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Bienvenue</CardTitle>
          <CardDescription>Identifiez-vous pour accéder au service</CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="pin" className="w-full">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="pin">Code PIN</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pin" className="space-y-4 px-6 pb-6">
            {/* PIN Display */}
            <div className="flex justify-center gap-4 my-6">
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    i < pin.length ? "bg-primary scale-110" : "bg-zinc-200 dark:bg-zinc-800"
                  }`} 
                />
              ))}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button
                  key={num}
                  variant="outline"
                  className="h-16 text-2xl font-medium rounded-2xl hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all"
                  onClick={() => handlePinInput(num.toString())}
                  disabled={isLoading}
                >
                  {num}
                </Button>
              ))}
              <Button
                variant="outline"
                className="h-16 rounded-2xl hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all"
                onClick={handlePinDelete}
                disabled={isLoading}
              >
                <Delete className="w-6 h-6" />
              </Button>
              <Button
                variant="outline"
                className="h-16 text-2xl font-medium rounded-2xl hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all"
                onClick={() => handlePinInput("0")}
                disabled={isLoading}
              >
                0
              </Button>
              <Button
                className="h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white"
                onClick={handlePinLogin}
                disabled={isLoading || pin.length < 4}
              >
                <ArrowRight className="w-6 h-6" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="email" className="px-6 pb-6">
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@restaurant.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12"
                />
              </div>
              <Button className="w-full h-12 text-lg" type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" /> : "Se connecter"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
