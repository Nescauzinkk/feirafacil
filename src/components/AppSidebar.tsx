import { LayoutDashboard, Package, ChefHat, CalendarDays, Wallet, TrendingUp, HelpCircle, UserCog, ShoppingCart } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Shield } from "lucide-react";

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { user } = useAuth();

  const items = [
  { title: "Início", url: "/", icon: LayoutDashboard },
  { title: "Estoque", url: "/stock", icon: Package },
  { title: "Produção", url: "/production", icon: ChefHat },
  { title: "Lista de Mercado", url: "/shopping", icon: ShoppingCart },
  { title: "Eventos", url: "/events", icon: CalendarDays },
  { title: "Finanças", url: "/finance", icon: Wallet },
  { title: "Preços", url: "/prices", icon: TrendingUp },
  { title: "Ajuda", url: "/help", icon: HelpCircle },
  { title: "Minha Conta", url: "/account", icon: UserCog },

  ...(user?.role === "admin"
    ? [{ title: "Admin", url: "/admin", icon: Shield }]
    : []),
];

  return (
    <Sidebar collapsible="icon" className="bg-green-900 text-white [&_*]:bg-green-900 shadow-2xl">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2">
          <span className="text-2xl">🌾</span>
          {!collapsed && <span className="text-white font-bold text-lg text-sidebar-foreground">Feira Fácil</span>}
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        `py-3 text-white ${isActive ? "bg-white text-green-800 font-semibold" : "hover:bg-white/10"
                        }`
                      }

                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 mt-auto border-t border-white/10">
        {!collapsed ? (
          <div className="text-[10px] text-white/40 flex flex-col gap-0.5">
            <p className="font-medium">Desenvolvido por Aldo ®</p>
            <p>© {new Date().getFullYear()} Feira Fácil</p>
            <p>Todos os direitos reservados</p>
          </div>
        ) : (
          <div className="text-center text-[10px] text-white/40 font-bold">
            Aldo®
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
