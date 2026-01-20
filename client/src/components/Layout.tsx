import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, LayoutDashboard, LogOut, Menu, PieChart, Settings, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { brand } = useTheme();
  const { logout } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: BarChart3, label: "Relatórios", href: "/reports" },
    { icon: PieChart, label: "Análises", href: "/analytics" },
    { icon: Settings, label: "Configurações", href: "/settings" },
  ];

  const NavContent = () => (
    <>
      <div className="p-6 flex items-center gap-3 border-b border-sidebar-border/20">
        <div className="bg-white p-1.5 rounded-lg shadow-sm overflow-hidden">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt="Logo" className="w-6 h-6 object-contain" />
          ) : (
            <ShieldCheck className="w-6 h-6 text-primary" />
          )}
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight text-white truncate max-w-[140px]">{brand.appName}</h1>
          <p className="text-xs text-sidebar-foreground/70 font-medium">Recife EPIs</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <a
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-sidebar-accent text-white shadow-md translate-x-1"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-white hover:translate-x-1"
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-accent" : "text-sidebar-foreground/60 group-hover:text-accent"
                  )}
                />
                {item.label}
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border/20">
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-sidebar text-white p-4 flex items-center justify-between shadow-md z-20 sticky top-0">
        <div className="flex items-center gap-2">
          <div className="bg-white p-1 rounded shadow-sm overflow-hidden">
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt="Logo" className="w-5 h-5 object-contain" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-primary" />
            )}
          </div>
          <span className="font-bold tracking-tight truncate max-w-[180px]">{brand.appName}</span>
        </div>
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-sidebar border-r-sidebar-border w-72 text-sidebar-foreground flex flex-col">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-sidebar text-sidebar-foreground flex-col fixed h-full shadow-xl z-10">
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto w-full">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
