import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

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

    // 🔥 CRIA USUÁRIO NO AUTH COM METADATA DE NOME
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      }
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center">Criar conta</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input value={email || ""} disabled className="bg-gray-100" />
        </div>

        <div>
          <label className="text-sm font-medium">Seu Nome</label>
          <Input
            placeholder="Como deseja ser chamado?"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">Senha</label>
          <Input
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Criando conta..." : "Cadastrar"}
        </Button>
      </form>

      <p className="text-sm text-center">
        Já tem conta?{" "}
        <span
          className="text-green-700 cursor-pointer hover:underline"
          onClick={() => navigate("/login")}
        >
          Entrar
        </span>
      </p>
    </div>
  );
}
