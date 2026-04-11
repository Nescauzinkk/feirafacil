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
      alert('Email não encontrado');
      navigate('/plans');
      return;
    }

    let tentativas = 0;
    const MAX_TENTATIVAS = 10;

    const tentarBuscar = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiUrl}/get-token-by-email?email=${email}`);
        const data = await res.json();

        if (data.token) {
          console.log('✅ TOKEN ENCONTRADO:', data.token);
          navigate(`/signup?token=${data.token}`);
        } else {
          if (tentativas < MAX_TENTATIVAS) {
            tentativas++;
            console.log(`⏳ Tentativa ${tentativas}`);
            setTimeout(tentarBuscar, 1500);
          } else {
            alert('Demorou demais para liberar acesso. Tente novamente.');
            navigate('/plans');
          }
        }
      } catch (err) {
        console.error('Erro ao buscar token:', err);

        if (tentativas < MAX_TENTATIVAS) {
          tentativas++;
          setTimeout(tentarBuscar, 1500);
        } else {
          alert('Erro ao conectar com o servidor.');
          navigate('/plans');
        }
      }
    };

    tentarBuscar();
  }, [searchParams, navigate]);

  return (
    <div className="text-center text-white">
      <h1 className="text-xl font-bold">
        Finalizando seu acesso... ⏳
      </h1>

      <p className="text-white/80 mt-6">
        Já pagou? <Link to="/recuperar" className="underline">Recuperar acesso</Link>
      </p>
    </div>
  );
}
