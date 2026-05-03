import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');

    if (!tokenParam) {
      alert('Link inválido');
      navigate('/plans');
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    fetch(`${apiUrl}/validate-token?token=${tokenParam}`)
      .then(res => {
        if (!res.ok) throw new Error("Erro no servidor");
        return res.json();
      })
      .then(data => {
        if (data.email) {
          setEmail(data.email);
        } else {
          alert('Token inválido ou já usado');
          navigate('/plans');
        }
      })
      .catch(err => {
        console.error("Erro ao validar token:", err);
        alert("Erro ao conectar com o servidor.");
        navigate('/plans');
      });
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name) {
      alert("Digite seu nome");
      return;
    }

    if (!password || password.length < 6) {
      alert("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setLoading(true);

    // 🔥 TENTA CRIAR O USUÁRIO NO AUTH
    // Se o e-mail já existe na tabela users_app (criado pelo webhook), 
    // o signUp do Supabase Auth pode falhar se não estiver configurado para permitir.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      }
    });

    if (authError) {
      // Se o erro for que o usuário já existe, vamos tentar uma abordagem de recuperação/vínculo
      if (authError.message.includes("already registered") || authError.message.includes("User already registered")) {
        alert("Este e-mail já possui um acesso liberado. Por favor, tente fazer login. Se não souber a senha, use a 'Recuperação de Senha' do sistema.");
        navigate('/login');
        setLoading(false);
        return;
      }
      
      alert(authError.message);
      setLoading(false);
      return;
    }

    // Se o signUp retornou sucesso mas sem sessão (confirmação de e-mail ativa)
    if (authData.user && !authData.session) {
      alert("Conta criada! Por favor, verifique seu e-mail para confirmar o cadastro antes de fazer login.");
    }

    // 🔥 MARCA TOKEN COMO USADO
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const tokenParam = searchParams.get('token');
    try {
      await fetch(`${apiUrl}/use-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenParam }),
      });
    } catch (err) {
      console.error("Erro ao marcar token como usado:", err);
    }

    alert("Conta criada com sucesso!");
    navigate('/dashboard');
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      <Card className="w-full bg-white shadow-xl border-none">
      <CardHeader className="text-center relative pt-8">
        <button
          onClick={() => navigate('/plans')}
          className="absolute top-6 left-6 text-muted-foreground hover:text-foreground transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-5xl mb-2 block">🌾</span>
        <CardTitle className="text-3xl font-extrabold text-gray-800">Criar conta</CardTitle>
      </CardHeader>
      <CardContent className="px-8 pb-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-600">E-mail</Label>
            <Input value={email || ""} disabled className="h-12 bg-gray-50 border-gray-200 text-gray-500" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-600">Seu Nome</Label>
            <Input
              placeholder="Como deseja ser chamado?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-600">Senha</Label>
            <Input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 text-base"
              required
            />
          </div>

          <Button type="submit" className="w-full h-12 text-white text-lg font-bold bg-green-700 hover:bg-green-800 transition-colors shadow-md" disabled={loading}>
            {loading ? "Criando conta..." : "Cadastrar"}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-muted-foreground">
            Já tem conta?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-green-700 hover:text-green-800 font-bold underline transition-colors"
            >
              Entrar
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
  );
}
