import { useState } from "react";

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState("");

  const criarUsuario = async () => {
    if (!email) {
      setMsg("Digite um email");
      return;
    }

    setLoading(true);
    setMsg("");
    setToken("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/create-test-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (res.ok) {
        setMsg("✅ Usuário criado com sucesso!");
        setEmail("");
        setToken(data.token);
      } else {
        setMsg(data.error || "Erro ao criar usuário");
      }

    } catch (err) {
      console.error(err);
      setMsg("Erro no servidor");
    }

    setLoading(false);
  };

  const copiarLink = () => {
    if (!token) return;

    const link = `${window.location.origin}/signup?token=${token}`;
    navigator.clipboard.writeText(link);

    setMsg("📋 Link copiado!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-950 flex items-center justify-center p-6">
      
      <div className="bg-white text-black p-8 rounded-2xl shadow-xl w-full max-w-md">
        
        <h1 className="text-2xl font-bold text-center mb-2">
          👑 Painel Admin
        </h1>

        <p className="text-center text-gray-500 mb-6">
          Criar usuários para teste
        </p>

        <input
          type="email"
          placeholder="email@teste.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <button
          onClick={criarUsuario}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
        >
          {loading ? "Criando..." : "Criar usuário"}
        </button>

        {/* TOKEN / LINK */}
        {token && (
          <div className="mt-6 bg-gray-100 p-4 rounded-lg text-sm break-all">
            <p className="mb-2 font-medium">🔗 Link de acesso:</p>
            <p className="mb-3">
              {window.location.origin}/signup?token={token}
            </p>

            <button
              onClick={copiarLink}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            >
              Copiar link
            </button>
          </div>
        )}

        {/* MENSAGEM */}
        {msg && (
          <p className="mt-4 text-center text-sm text-gray-700">
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}