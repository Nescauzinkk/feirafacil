import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Mensal',
    price: 'R$ 29,00/mês',
    description: 'Ideal para começar com flexibilidade',
    features: [
      'Controle de estoque',
      'Registro de eventos',
      'Relatórios avançados',
      'Histórico de preços',
      'Backup na nuvem',
    ],
    highlighted: false,
  },
  {
    name: 'Anual',
    price: 'R$ 289,90/ano',
    oldPrice: 'R$ 348',
    description: 'Melhor custo-benefício 🚀',
    features: [
      'Tudo do plano mensal',
      'Economia de R$ 58',
      'Suporte prioritário',
      'Backup na nuvem',
    ],
    highlighted: true,
  },
];

export default function Plans() {
  const navigate = useNavigate();

  // ✅ estado dentro do componente
  const [email, setEmail] = useState('');

  const handleCheckout = async (tipo: string) => {
    console.log('ENVIANDO EMAIL:', email);
    console.log('ENVIANDO:', tipo);

    if (!email) {
      alert('Digite seu email antes de continuar');
      return;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiUrl}/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        plan: tipo,
        email: email,
      }),
    });

    const data = await res.json();
    console.log('DATA:', data);

    if (!data.url) {
      alert('Erro: URL não veio');
      return;
    }

    // 🔥 redireciona pro Stripe
    window.location.href = data.url;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-800 to-green-950 p-4 flex flex-col items-center">
      <div className="w-full max-w-lg">

        {/* 🔥 INPUT DE EMAIL */}
        <Input
          type="email"
          placeholder="Digite seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 bg-white text-black"
        />

        {/* VOLTAR */}
        <button
          onClick={() => navigate('/welcome')}
          className="text-white/80 hover:text-white mb-6 flex items-center gap-1"
        >
          <ArrowLeft className="h-5 w-5" /> Voltar
        </button>

        {/* TÍTULO */}
        <h1 className="text-3xl font-extrabold text-white text-center mb-2">
          Nossos Planos
        </h1>

        <p className="text-green-200 text-center mb-8">
          Escolha o melhor para o seu negócio
        </p>

        {/* PLANOS */}
        <div className="space-y-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`bg-white text-black ${plan.highlighted
                  ? 'border-2 border-primary ring-2 ring-primary/20'
                  : ''
                }`}
            >
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{plan.name}</span>
                  <div className="text-right">
                    {plan.oldPrice && (
                      <p className="text-base line-through text-red-500">
                        {plan.oldPrice}
                      </p>
                    )}
                    <span className="text-xl font-bold text-primary">
                      {plan.price}
                    </span>
                  </div>
                </CardTitle>

                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full text-white bg-green-600 hover:bg-green-700"
                  onClick={() =>
                    handleCheckout(
                      plan.name === 'Anual' ? 'anual' : 'mensal'
                    )
                  }
                >
                  {plan.highlighted
                    ? 'Assinar anual'
                    : 'Assinar mensal'}
                </Button>
              </CardContent>
            </Card>
            
          ))}
        </div>
        <p className="text-center text-white/80 mt-6">
  Já pagou? <Link to="/recuperar" className="underline">Recuperar acesso</Link>
</p>
      </div>
    </div>
    
  );
}