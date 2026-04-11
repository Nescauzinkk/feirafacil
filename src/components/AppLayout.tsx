import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { signOut } from "@/hooks/useAuth";
import { LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Outlet, useNavigate } from "react-router-dom";

interface AppLayoutProps {
  children: React.ReactNode;
  userName?: string;
}

export function AppLayout({ children, userName }: AppLayoutProps) {
  const displayName = userName || 'Produtor';
  const navigate = useNavigate();

  // 🔥 FUNÇÃO DE LOGOUT CORRIGIDA
  const handleLogout = async () => {
    await signOut();
    navigate("/welcome");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b bg-white px-4 sticky top-0 z-10 shadow-sm">
            <SidebarTrigger className="mr-3" />
            <span className="font-semibold text-lg md:hidden">🌾 Feira Fácil</span>

            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">
                  Olá, <strong className="text-foreground">{displayName}</strong>!
                </span>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={handleLogout} // ✅ AQUI FOI CORRIGIDO
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto">
            <Outlet />
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}