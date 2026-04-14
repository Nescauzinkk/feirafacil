import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, Outlet } from "react-router-dom";
import { Toaster as Sonner } from "./components/ui/sonner";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { AppLayout } from "./components/AppLayout";
import { useAuth } from "./hooks/useAuth";
import Dashboard from "./pages/Dashboard";
import Stock from "./pages/Stock";
import Production from "./pages/Production";
import ShoppingList from "./pages/ShoppingList";
import Events, { EventDetail } from "./pages/Events";
import Finance from "./pages/Finance";
import PriceHistory from "./pages/PriceHistory";
import Help from "./pages/Help";
import MyAccount from "./pages/MyAccount";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Sucesso from "./pages/Sucesso";
import Plans from "./pages/Plans";
import RecuperarAcesso from "./pages/RecuperarAcesso";
import AdminPage from "./pages/AdminPage";

const queryClient = new QueryClient();

function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-800 p-4">
      <Outlet />
    </div>
  );
}

function AuthenticatedRoutes() {
  const { user, profileName, loading } = useAuth();

  // 🔥 ESPERA O AUTH TERMINAR (ESSENCIAL)
  if (loading) {
    return <div>Carregando...</div>;
  }

  // 🔓 NÃO LOGADO
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Navigate to="/welcome" replace />} />
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/recuperar" element={<RecuperarAcesso />} />
        </Route>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/sucesso" element={<Sucesso />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="*" element={<Navigate to="/welcome" replace />} />
      </Routes>
    );
  }

  // 🔐 LOGADO
  return (
    <Routes>
      {/* REDIRECT INICIAL */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* LAYOUT */}
      <Route element={<AppLayout userName={profileName} />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/production" element={<Production />} />
        <Route path="/shopping" element={<ShoppingList />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/prices" element={<PriceHistory />} />
        <Route path="/help" element={<Help />} />
        <Route path="/account" element={<MyAccount />} />

        {/* 👑 ADMIN (PROTEGIDO) */}
        <Route
          path="/admin"
          element={
            user?.role === "admin"
              ? <AdminPage />
              : <Navigate to="/dashboard" replace />
          }
        />
      </Route>

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthenticatedRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
