import { useState, useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users, Mail, RefreshCw, Search, ShieldCheck,
  Clock, KeyRound, AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";
import { toast } from "sonner";

// ─── Cliente admin ────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://qlzekyiwgawxtfzoufgw.supabase.co";
const SERVICE_KEY  = import.meta.env.VITE_SUPABASE_SERVICE_KEY as string;

const adminClient = SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

const ADMIN_EMAIL = "baluta530@gmail.com";

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface AppUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastSignIn: string | null;
  confirmed: boolean;
  role: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(iso: string | null): string {
  if (!iso) return "nunca";
  const diff = Date.now() - new Date(iso).getTime();
  const min  = Math.floor(diff / 60000);
  if (min < 2)  return "agora";
  if (min < 60) return `${min} min atrás`;
  const h = Math.floor(min / 60);
  if (h < 24)   return `${h}h atrás`;
  const d = Math.floor(h / 24);
  if (d < 30)   return `${d} dias atrás`;
  return fmt(iso).split(",")[0];
}

// ─── Card de usuário ─────────────────────────────────────────────────────────
function UserCard({ user, onReset }: { user: AppUser; onReset: (u: AppUser) => void }) {
  return (
    <Card className="border hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">

        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{user.name || "Sem nome"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {user.role === "admin" ? (
              <Badge className="bg-yellow-500 text-yellow-950 text-[10px]">
                <ShieldCheck className="h-3 w-3 mr-1" />Admin
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px]">Usuário</Badge>
            )}
            {user.confirmed ? (
              <Badge className="bg-green-100 text-green-800 border-green-300 text-[10px]">
                <CheckCircle2 className="h-3 w-3 mr-1" />Confirmado
              </Badge>
            ) : (
              <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-[10px]">
                <XCircle className="h-3 w-3 mr-1" />Pendente
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t pt-2">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0" />
            <span>Cadastro: {fmt(user.createdAt).split(",")[0]}</span>
          </div>
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3 shrink-0" />
            <span>Acesso: {timeAgo(user.lastSignIn)}</span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs border-amber-400 text-amber-700 hover:bg-amber-50"
          onClick={() => onReset(user)}
        >
          <KeyRound className="h-3.5 w-3.5 mr-1.5" />
          Enviar redefinição de senha
        </Button>

      </CardContent>
    </Card>
  );
}

// ─── Painel Admin ─────────────────────────────────────────────────────────────
export default function AdminPage() {

  // ════════════════════════════════════════════════════════════
  //  REGRA DOS HOOKS: todos os hooks ANTES de qualquer return
  // ════════════════════════════════════════════════════════════
  const { user, loading: authLoading } = useAuth();

  const [users,       setUsers      ] = useState<AppUser[]>([]);
  const [loading,     setLoading    ] = useState(true);
  const [search,      setSearch     ] = useState("");
  const [resetTarget, setResetTarget] = useState<AppUser | null>(null);
  const [resetting,   setResetting  ] = useState(false);
  const [error,       setError      ] = useState<string | null>(null);

  const isAdmin = !authLoading && !!user && user.email === ADMIN_EMAIL;

  const fetchUsers = async () => {
    if (!adminClient) {
      setError("VITE_SUPABASE_SERVICE_KEY não configurada. Adicione nas variáveis de ambiente do Vercel e faça um novo deploy.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data: authData, error: authError } =
        await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (authError) throw authError;

      const { data: profiles  } = await adminClient.from("profiles" ).select("id, name");
      const { data: rolesData } = await adminClient.from("users_app").select("email, role");

      const profileMap = new Map<string, string>(
        (profiles  || []).map((p: any) => [p.id,              p.name  || ""])
      );
      const roleMap = new Map<string, string>(
        (rolesData || []).map((r: any) => [r.email?.toLowerCase(), r.role || "user"])
      );

      const mapped: AppUser[] = (authData?.users || []).map((u: any) => ({
        id:         u.id,
        email:      u.email || "",
        name:       profileMap.get(u.id) || u.user_metadata?.name || "",
        createdAt:  u.created_at,
        lastSignIn: u.last_sign_in_at || null,
        confirmed:  !!u.email_confirmed_at,
        role:       roleMap.get(u.email?.toLowerCase()) || "user",
      }));

      mapped.sort((a, b) => {
        if (a.role === "admin" && b.role !== "admin") return -1;
        if (b.role === "admin" && a.role !== "admin") return  1;
        const aT = a.lastSignIn ? new Date(a.lastSignIn).getTime() : 0;
        const bT = b.lastSignIn ? new Date(b.lastSignIn).getTime() : 0;
        return bT - aT;
      });

      setUsers(mapped);
    } catch (err: any) {
      setError(err?.message || "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  // useEffect sempre após os useState, nunca depois de um return condicional
  useEffect(() => {
    if (isAdmin) fetchUsers();
    // se não for admin, loading fica true eternamente — zera para não travar
    if (!authLoading && !isAdmin) setLoading(false);
  }, [isAdmin, authLoading]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      u => u.email.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
    );
  }, [search, users]);

  const handleResetPassword = async () => {
    if (!resetTarget || !adminClient) return;
    setResetting(true);
    try {
      const { error } = await adminClient.auth.resetPasswordForEmail(
        resetTarget.email,
        { redirectTo: `${window.location.origin}/recuperar` }
      );
      if (error) throw error;
      toast.success(`Email de redefinição enviado para ${resetTarget.email}`);
      setResetTarget(null);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar email");
    } finally {
      setResetting(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  //  Returns condicionais somente DEPOIS de todos os hooks
  // ════════════════════════════════════════════════════════════
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 rounded-full border-4 border-green-700 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  // ─── Estatísticas ─────────────────────────────────────────
  const totalConfirmed = users.filter(u => u.confirmed).length;
  const totalPending   = users.length - totalConfirmed;
  const activeRecently = users.filter(u =>
    u.lastSignIn && Date.now() - new Date(u.lastSignIn).getTime() < 7 * 24 * 60 * 60 * 1000
  ).length;

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">

      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-yellow-500" />
            Painel Admin
          </h1>
          <p className="text-muted-foreground mt-1">Gerenciamento de usuários do sistema</p>
        </div>
        <Button variant="outline" onClick={fetchUsers} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Aviso: service key ausente */}
      {!SERVICE_KEY && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-800 text-sm">Chave de serviço não configurada</p>
              <p className="text-red-700 text-xs mt-1">
                Adicione <code className="bg-red-100 px-1 rounded">VITE_SUPABASE_SERVICE_KEY</code> nas
                variáveis de ambiente do Vercel e faça um novo deploy.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Erro de carregamento */}
      {error && !loading && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="p-4 flex items-center gap-2 text-red-700 text-sm">
            <AlertTriangle className="h-4 w-4" />{error}
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      {!loading && users.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-extrabold text-green-700">{users.length}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Users className="h-3 w-3" />Total
              </p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-extrabold text-blue-700">{totalConfirmed}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <CheckCircle2 className="h-3 w-3" />Confirmados
              </p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-extrabold text-orange-600">{totalPending}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <XCircle className="h-3 w-3" />Pendentes
              </p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-extrabold text-purple-700">{activeRecently}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />Ativos (7d)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Lista de usuários */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-8 bg-gray-100 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            <Users className="mx-auto h-12 w-12 mb-3 opacity-30" />
            <p>{search ? `Nenhum resultado para "${search}"` : "Nenhum usuário cadastrado"}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "usuário" : "usuários"}
            {search && ` para "${search}"`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filtered.map(u => (
              <UserCard key={u.id} user={u} onReset={setResetTarget} />
            ))}
          </div>
        </>
      )}

      {/* Modal de redefinição de senha */}
      <Dialog open={!!resetTarget} onOpenChange={() => setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-600" />
              Redefinir senha
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Será enviado um email de redefinição para:
            </p>
            <div className="bg-gray-50 border rounded-lg p-3">
              <p className="font-bold text-sm">{resetTarget?.name || "Sem nome"}</p>
              <p className="text-xs text-muted-foreground">{resetTarget?.email}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              O usuário receberá um link seguro para criar uma nova senha.
              A senha atual continua válida até o uso do link.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setResetTarget(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleResetPassword}
                disabled={resetting}
              >
                {resetting ? "Enviando..." : "Enviar email"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
