import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

import { useSearchParams } from 'react-router-dom';

export default function RecuperarAcesso() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const navigate = useNavigate();

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setMensagem('Digite seu email');
      return;
    }

    setLoading(true);
    setMensagem('');

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(
        `${apiUrl}/get-token-by-email?email=${email}`
      );

      const data = await res.json();

      if (data.token) {
        navigate(`/signup?token=${data.token}`);
      } else {
        setMensagem('Nenhum acesso encontrado para este email.');
      }
    } catch (err) {
      console.error(err);
      setMensagem('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <Card className="w-full bg-white shadow-xl border-none">
      <CardHeader className="text-center relative pt-8">
        <button
          onClick={() => navigate('/login')}
          className="absolute top-6 left-6 text-muted-foreground hover:text-foreground transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-5xl mb-2 block">🌾</span>
        <CardTitle className="text-3xl font-extrabold text-gray-800">Recuperar acesso</CardTitle>
      </CardHeader>
      <CardContent className="px-8 pb-10">
        <p className="text-center text-gray-500 mb-8">
          Digite o email usado na compra para continuar seu cadastro.
        </p>

        <form onSubmit={handleBuscar} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-600">E-mail</Label>
            <Input
              type="email"
              placeholder="seuemail@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-white text-lg font-bold bg-green-700 hover:bg-green-800 transition-colors shadow-md"
          >
            {loading ? 'Buscando...' : 'Continuar cadastro'}
          </Button>

          {mensagem && (
            <p className="text-center text-sm text-red-500 mt-2 font-bold animate-fade-in">
              {mensagem}
            </p>
          )}
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <button 
            onClick={() => navigate('/login')}
            className="text-sm text-green-700 hover:text-green-800 font-bold underline transition-colors"
          >
            Voltar para o login
          </button>
        </div>
      </CardContent>
    </Card>
  </div>
  );
}
