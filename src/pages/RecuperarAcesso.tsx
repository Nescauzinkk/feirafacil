import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function RecuperarAcesso() {
  const [email, setEmail] = useState('');
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-center text-gray-800">
        Recuperar acesso
      </h1>

      <p className="text-center text-gray-500">
        Digite o email usado na compra para continuar seu cadastro.
      </p>

      <form onSubmit={handleBuscar} className="space-y-4">
        <Input
          type="email"
          placeholder="seuemail@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Buscando...' : 'Continuar cadastro'}
        </Button>

        {mensagem && (
          <p className="text-center text-sm text-red-500 mt-2 font-medium">
            {mensagem}
          </p>
        )}
      </form>

      <div className="pt-4 border-t text-center">
        <button 
          onClick={() => navigate('/login')}
          className="text-sm text-green-700 hover:underline"
        >
          Voltar para o login
        </button>
      </div>
    </div>
  );
}
