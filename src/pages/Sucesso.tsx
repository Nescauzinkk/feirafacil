import { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import React from 'react';

export default function Sucesso() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const iniciou = useRef(false);

  useEffect(() => {
    if (iniciou.current) return;
    iniciou.current = true;

    const email = searchParams.get('email');

    if (!email) {
      navigate('/plans');
      return;
    }

    let tentativas = 0;
    const MAX_TENTATIVAS = 15; // Aumentado para 30 segundos (15 * 2s)

    const tentarBuscar = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/get-token-by-email?email=${email.toLowerCase()}`);
        const data = await res.json();

        if (data.token) {
          navigate(`/signup?token=${data.token}`, { replace: true });
        } else {
          if (tentativas < MAX_TENTATIVAS) {
            tentativas++;
            setTimeout(tentarBuscar, 2000);
          } else {
            // Se falhar após todas as tentativas, não dá erro, mas mostra opção manual
          }
        }
      } catch (err) {
        console.error('Erro ao buscar token:', err);
        if (tentativas < MAX_TENTATIVAS) {
          tentativas++;
          setTimeout(tentarBuscar, 2000);
        }
      }
    };

    tentarBuscar();
  }, [searchParams, navigate]);

  return (
    <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 text-center space-y-8 animate-in fade-in zoom-in duration-500 mx-auto">
      <div className="flex justify-center">
        <div className="bg-green-100 p-6 rounded-full animate-bounce">
          <span className="text-6xl">🚀</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Pagamento Confirmado!
        </h1>
        <p className="text-gray-500 text-lg font-medium">
          Estamos liberando seu acesso. <br/>
          Você será redirecionado em instantes...
        </p>
      </div>

      <div className="flex justify-center items-center gap-2">
        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
      </div>

      <div className="pt-8 border-t border-gray-100">
        <p className="text-sm text-gray-400">
          Demorando muito? <br/>
          <Link 
            to={`/recuperar?email=${searchParams.get('email')}`} 
            className="text-green-700 font-bold hover:text-green-800 underline transition-colors"
          >
            Clique aqui para tentar manualmente
          </Link>
        </p>
      </div>
    </div>
  );
}
