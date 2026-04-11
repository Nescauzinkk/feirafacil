import { LayoutDashboard, Package, ChefHat, CalendarDays, Wallet, TrendingUp, HelpCircle } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
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
  { title: "Eventos", url: "/events", icon: CalendarDays },
  { title: "Finanças", url: "/finance", icon: Wallet },
  { title: "Preços", url: "/prices", icon: TrendingUp },
  { title: "Ajuda", url: "/help", icon: HelpCircle },

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
    </Sidebar>
  );
}
