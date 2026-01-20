import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";
import { ShareLink } from "@/components/ShareLink";
import { useLocation } from "wouter";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login, addUser } = useAuth();
  const { brand } = useTheme();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check for invite link
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    
    if (invite) {
      try {
        // Decode invite data: username:password:name:role
        const decoded = atob(invite);
        const [invUsername, invPassword, invName, invRole] = decoded.split(':');
        
        if (invUsername && invPassword) {
          // Auto-create user locally if not exists
          // Note: In a real app, we would verify a token with the server
          // Here we trust the link to recreate the user in local storage
          addUser({
            username: invUsername,
            password: invPassword,
            name: invName || invUsername,
            role: (invRole as any) || 'viewer'
          });

          // Auto-fill form
          setUsername(invUsername);
          setPassword(invPassword);
          
          // Auto-login
          login(invUsername, invPassword).then(success => {
            if (success) {
              // Clear invite param from URL to keep it clean
              window.history.replaceState({}, document.title, "/");
              setLocation("/");
            }
          });
        }
      } catch (e) {
        console.error("Invalid invite link", e);
        setError("Link de convite inválido ou expirado");
      }
    }
  }, [login, addUser, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const success = await login(username, password);
    if (success) {
      setLocation("/");
    } else {
      setError("Usuário ou senha incorretos");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-primary/10 p-3 rounded-full">
              {brand.logoUrl ? (
                <img src={brand.logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
              ) : (
                <ShieldCheck className="w-10 h-10 text-primary" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">{brand.appName}</CardTitle>
          <CardDescription>
            Entre com suas credenciais para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                placeholder="Digite seu usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-md">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full">
              Entrar
            </Button>
            
            <div className="text-center text-xs text-muted-foreground mt-4">
              <p>Credenciais padrão:</p>
              <p>Admin: admin / 123</p>
              <p>Visitante: visitante / 123</p>
            </div>

            <div className="pt-4 border-t mt-4">
              <div className="flex justify-center">
                <ShareLink />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
