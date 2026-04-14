import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Calendar, CreditCard, ExternalLink, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function MyAccount() {
  const { user, profileName } = useAuth();
  const [loadingPortal, setLoadingPortal] = useState(false);

  // Formatar data de adesão
  const joinDate = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : 'Não disponível';

  const handleManageSubscription = async () => {
    if (!user?.email) return;
    
    setLoadingPortal(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Erro ao abrir portal');
      }
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Erro ao conectar com o Stripe.";
      toast.error(message);
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto py-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Minha Conta</h1>
        <p className="text-muted-foreground mt-2 text-lg">Gerencie suas informações e assinatura.</p>
      </div>

      <div className="grid gap-6">
        {/* Perfil */}
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader className="bg-green-700 text-white pb-8">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full">
                <User className="h-8 w-8 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">{profileName || 'Usuário'}</CardTitle>
                <p className="text-green-100 opacity-90">{user?.email}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="h-5 w-5 text-green-700" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Membro desde</p>
                <p className="font-medium">{joinDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <ShieldCheck className="h-5 w-5 text-green-700" />
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Tipo de conta</p>
                <p className="font-medium capitalize">{user?.role || 'Usuário'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assinatura */}
        <Card className="border-none shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CreditCard className="h-6 w-6 text-green-700" />
              Plano e Assinatura
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-bold text-gray-500 uppercase">Plano Atual</p>
                  <p className="text-2xl font-black text-green-800">Assinante Premium</p>
                </div>
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                  Ativo
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Para alterar seu plano, atualizar dados de pagamento ou cancelar sua assinatura, acesse o portal de autoatendimento da Stripe clicando no botão abaixo.
              </p>
              
              <Button 
                onClick={handleManageSubscription} 
                disabled={loadingPortal}
                className="w-full h-12 bg-gray-900 hover:bg-black text-white gap-2 font-bold text-base shadow-lg transition-all"
              >
                {loadingPortal ? "Carregando..." : (
                  <>
                    Gerenciar Assinatura na Stripe
                    <ExternalLink className="h-4 w-4" />
                  </>
                )}
              </Button>
              
              <p className="text-[10px] text-center text-muted-foreground uppercase tracking-tighter">
                Seguro e processado por Stripe.com
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
