import { MessageCircle, HelpCircle, LayoutDashboard, Package, ChefHat, ShoppingCart, CalendarDays, Wallet, TrendingUp, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const WHATSAPP_URL = "https://wa.me/5542988464660?text=Olá%2C%20preciso%20de%20ajuda%20no%20Feira%20Facil!";

const sections = [
  {
    title: "🏠 Início (Dashboard)",
    icon: LayoutDashboard,
    items: [
      {
        q: "O que aparece nessa tela?",
        a: "É o resumo do seu negócio. Mostra o lucro total, vendas do dia e gráficos de entradas vs saídas. Use para ter uma visão rápida se está ganhando dinheiro.",
      },
      {
        q: "Como ler os indicadores?",
        a: "O 'Lucro' é o valor real que sobrou no seu bolso após subtrair todos os gastos das vendas. 'Entradas' é o faturamento bruto e 'Saídas' são seus custos.",
      },
    ],
  },
  {
    title: "📦 Estoque (Insumos e Produtos)",
    icon: Package,
    items: [
      {
        q: "Qual a diferença entre Insumo e Produto?",
        a: "Insumos são ingredientes (farinha, ovos). Produtos são o que você vende (bolo, pão). Você compra insumos e produz produtos.",
      },
      {
        q: "Botão 'Registrar Compra'",
        a: "Use este botão quando chegar do mercado. Ele adiciona a quantidade ao estoque e já registra o gasto automaticamente nas Finanças.",
      },
      {
        q: "Alerta de Estoque Baixo",
        a: "O sistema mostra um aviso quando um insumo atinge o limite que você definiu. Isso evita que você comece uma produção e perceba que falta algo.",
      },
    ],
  },
  {
    title: "🍳 Produção e Receitas",
    icon: ChefHat,
    items: [
      {
        q: "Como funciona o botão 'Produzir'?",
        a: "Ao clicar em produzir, o sistema retira os ingredientes do estoque e adiciona o produto pronto. Ele também calcula o custo exato de cada unidade produzida.",
      },
      {
        q: "O que é o 'Lucro Estimado' na receita?",
        a: "O sistema compara o custo de produção com o seu preço de venda (Local e Revenda) e te mostra quanto você ganha em cada unidade.",
      },
      {
        q: "Metas de Produção",
        a: "Você pode criar metas diárias (ex: 'Produzir 50 pães hoje'). O sistema mostra uma barra de progresso conforme você finaliza as fornadas.",
      },
    ],
  },
  {
    title: "🛒 Lista de Mercado (NOVO!)",
    icon: ShoppingCart,
    items: [
      {
        q: "Como adicionar itens à lista?",
        a: "Na aba Produção, ao tentar produzir algo que não tem estoque, clique em 'Adicionar à Lista de Mercado'. Você pode adicionar várias receitas diferentes.",
      },
      {
        q: "O que é a 'Consolidação' de itens?",
        a: "A lista soma automaticamente ingredientes iguais de receitas diferentes. Se duas receitas usam farinha, a lista mostrará o total somado para você comprar de uma vez.",
      },
      {
        q: "Botão 'Exportar para WhatsApp'",
        a: "Gera uma mensagem organizada com tudo o que você precisa comprar e envia direto para o seu WhatsApp ou de um fornecedor.",
      },
    ],
  },
  {
    title: "🎪 Eventos (Vendas ao Vivo)",
    icon: CalendarDays,
    items: [
      {
        q: "Tabela de Preço (Local, Regional, Revenda)",
        a: "Agora você escolhe o tipo de preço na CRIAÇÃO do evento. Isso bloqueia o preço correto para aquela feira, evitando erros na hora da venda rápida.",
      },
      {
        q: "Modo 'Ao Vivo'",
        a: "Uma tela simplificada com botões grandes. Ideal para registrar vendas em segundos enquanto atende o cliente. Suporta Dinheiro, Pix e Cartão.",
      },
      {
        q: "Controle de Carga",
        a: "Você registra quanto levou para a feira. O sistema abate as vendas e te diz exatamente quanto deve sobrar no final do dia.",
      },
    ],
  },
  {
    title: "💰 Finanças e Vendas Manuais",
    icon: Wallet,
    items: [
      {
        q: "Vincular Produtos em 'Nova Entrada'",
        a: "Ao registrar uma venda manual (fora de feira), você pode selecionar quais produtos vendeu. O sistema descontará esses produtos do seu estoque automaticamente.",
      },
      {
        q: "Categorias de Gastos",
        a: "Organize seus custos em Logística, Taxas, Ingredientes, etc. Isso ajuda a saber onde você está gastando mais dinheiro no mês.",
      },
      {
        q: "Exclusão e Estorno",
        a: "Se você excluir uma venda que tinha produtos vinculados, o sistema devolve automaticamente esses produtos para o seu estoque.",
      },
    ],
  },
];

export default function Help() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto animate-fade-in pb-10">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold">Central de Ajuda</h1>
        <p className="text-muted-foreground">Tudo o que você precisa saber para dominar o Feira Fácil Online</p>
      </div>

      {/* WhatsApp Support */}
      <Card className="border-2 border-green-600/20 bg-green-50/50">
        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-left">
            <div className="bg-green-600 p-3 rounded-full">
              <MessageCircle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Ainda com dúvidas?</h2>
              <p className="text-sm text-muted-foreground">Fale com nosso suporte técnico agora mesmo.</p>
            </div>
          </div>
          <Button
            size="lg"
            className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white gap-2 shadow-lg"
            onClick={() => window.open(WHATSAPP_URL, "_blank")}
          >
            Chamar no WhatsApp
          </Button>
        </CardContent>
      </Card>

      {/* Quick Guide by Section */}
      <div className="grid gap-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Info className="h-5 w-5 text-green-600" /> Guia de Funções por Aba
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section) => (
            <Card key={section.title} className="overflow-hidden border-none shadow-sm bg-white hover:shadow-md transition-shadow">
              <CardHeader className="bg-gray-50/50 pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <section.icon className="h-4 w-4 text-green-600" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  {section.items.map((item, i) => (
                    <AccordionItem key={i} value={`${section.title}-${i}`} className="border-b px-4 last:border-0">
                      <AccordionTrigger className="text-sm text-left hover:no-underline py-3">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <Card className="bg-blue-50 border-blue-100">
        <CardContent className="p-6">
          <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
            💡 Dica de Ouro
          </h3>
          <p className="text-sm text-blue-800 leading-relaxed">
            O sistema foi desenhado para ser seu assistente. Se você mantiver o **Estoque de Insumos** sempre atualizado (usando o botão 'Registrar Compra'), todo o restante do sistema (custo de receitas, lucro de eventos e lista de compras) funcionará de forma automática e precisa!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
