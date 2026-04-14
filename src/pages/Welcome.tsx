import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import welcomeBg from '@/assets/welcome-bg.jpg';

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center text-white">
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${welcomeBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-green-900/70 via-green-800/60 to-green-950/80" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center max-w-md">
        <span className="text-5xl">🌾</span>
        <h1 className="text-4xl font-extrabold tracking-tight">Feira Fácil</h1>
        <p className="text-lg text-green-100 leading-relaxed">
          Transforme sua produção em lucro.
          <br />
          O sistema completo para produtores artesanais gerenciarem estoque, produção, vendas e finanças em um só lugar.
        </p>

        <div className="flex flex-col gap-3 w-full mt-4">
          <Button
            size="lg"
            className="w-full text-lg font-bold bg-green-100 text-green-800 hover:bg-green-200"
            onClick={() => navigate('/login')}
          >
            Entrar
          </Button>
          <Button
            size="lg"
            className="w-full text-lg font-bold bg-green-700 text-white hover:bg-green-800"
            onClick={() => navigate('/plans')}
          >
            Ver planos
          </Button>
        </div>

        <p className="text-sm text-green-200 mt-6">
          Pronto para começar? <button onClick={() => navigate('/plans')} className="underline font-semibold text-white hover:text-green-100">Escolha já seu plano!</button>
        </p>
      </div>
    </div>
  );
}
