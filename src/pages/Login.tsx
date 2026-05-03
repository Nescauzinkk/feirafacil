import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { signIn } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({
        title: 'Erro ao entrar',
        description: error.message === 'Invalid login credentials'
          ? 'E-mail ou senha incorretos.'
          : error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Login realizado!',
        description: 'Bem-vindo ao sistema 🚀',
        variant: 'success',
      });

      navigate('/dashboard');
    }
  }

  return (
    <div className="w-full max-w-md">
      <Card className="w-full bg-white shadow-xl border-none">
      <CardHeader className="text-center relative pt-8">
        <button
          onClick={() => navigate('/welcome')}
          className="absolute top-6 left-6 text-muted-foreground hover:text-foreground transition-colors"
          title="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="text-5xl mb-2 block">🌾</span>
        <CardTitle className="text-3xl font-extrabold text-gray-800">Entrar</CardTitle>
      </CardHeader>
      <CardContent className="px-8 pb-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-600">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 text-base"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold text-gray-600">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 text-base"
              required
            />
          </div>
          <Button type="submit" className="w-full h-12 text-white text-lg font-bold bg-green-700 hover:bg-green-800 transition-colors shadow-md" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <p className="text-sm text-muted-foreground">
            Não tem conta?{' '}
            <button 
              onClick={() => navigate('/plans')} 
              className="text-green-700 hover:text-green-800 font-bold underline transition-colors"
            >
              Selecione já um plano!
            </button>
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
  );
}
