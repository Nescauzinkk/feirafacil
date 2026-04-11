import { MessageCircle, HelpCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    items: [
      {
        q: "O que aparece nessa tela?",
        a: "Essa é a tela principal. Ela mostra um resumo de tudo: quanto você vendeu, quanto gastou e quanto lucrou. É como um \"placar\" do seu negócio.",
      },
      {
        q: "O que é \"Entradas\"?",
        a: "Entradas é todo dinheiro que entrou no seu bolso. Por exemplo: você vendeu pães na feira e recebeu R$200. Isso é uma entrada.",
      },
      {
        q: "O que é \"Saídas\"?",
        a: "Saídas é todo dinheiro que você gastou. Por exemplo: comprou farinha por R$50. Isso é uma saída.",
      },
      {
        q: "O que é \"Lucro\"?",
        a: "Lucro é o que sobra depois de tirar os gastos. Se você vendeu R$200 e gastou R$80, seu lucro foi R$120. É o dinheiro que realmente ficou com você.",
      },
    ],
  },
  {
    title: "📦 Estoque",
    items: [
      {
        q: "O que são ingredientes?",
        a: "Ingredientes são as coisas que você compra para fazer seus produtos. Exemplo: farinha, açúcar, leite, fermento.",
      },
      {
        q: "O que são produtos?",
        a: "Produtos são o que você vende. Exemplo: pão de queijo, bolo de milho, queijo minas. Cada produto tem um preço de venda.",
      },
      {
        q: "Como adicionar um ingrediente?",
        a: "Vá em Estoque, clique em \"Novo ingrediente\", escreva o nome (ex: Farinha), escolha a unidade (Kg, litro...) e pronto!",
      },
      {
        q: "O que é \"Quantidade em estoque\"?",
        a: "É quanto você tem guardado de cada ingrediente. Exemplo: se você tem 10 kg de farinha, esse é seu estoque de farinha.",
      },
      {
        q: "Como registrar uma compra?",
        a: "Clique em \"Registrar compra\", escolha o ingrediente, coloque quantos pacotes comprou, o peso de cada pacote e o preço total. O sistema calcula tudo sozinho e adiciona no seu estoque.",
      },
    ],
  },
  {
    title: "🍳 Produção",
    items: [
      {
        q: "O que é uma receita?",
        a: "Uma receita é a lista de ingredientes que você usa para fazer um produto. Exemplo: para fazer 20 pães, você usa 2 kg de farinha, 3 ovos e 100g de fermento.",
      },
      {
        q: "Como criar uma receita?",
        a: "Vá em Produção, clique em \"Nova receita\", escolha os ingredientes e a quantidade de cada um. Depois diga quantas unidades essa receita rende.",
      },
      {
        q: "O que é \"rendimento\"?",
        a: "Rendimento é quantas unidades do produto essa receita faz. Exemplo: com essa receita você faz 20 pães. Então o rendimento é 20.",
      },
      {
        q: "Como funciona a produção?",
        a: "Quando você produz uma receita, o sistema desconta os ingredientes do estoque automaticamente e adiciona os produtos prontos para venda.",
      },
    ],
  },
  {
    title: "🎪 Eventos (Feiras)",
    items: [
      {
        q: "O que é um evento?",
        a: "Um evento é uma feira, uma venda ou qualquer dia que você sai para vender. Você cria o evento, coloca os produtos que vai levar e registra as vendas.",
      },
      {
        q: "Como criar um evento?",
        a: "Clique em \"Novo evento\", dê um nome (ex: Feira do sábado), escolha a data e adicione os produtos que vai levar para vender.",
      },
      {
        q: "O que acontece ao clicar \"Iniciar evento\"?",
        a: "O evento começa! A tela de vendas aparece com botões grandes dos seus produtos. Cada vez que vender um, é só apertar o botão.",
      },
      {
        q: "Como registrar vendas?",
        a: "Durante o evento, cada produto aparece como um botão grande. Vendeu um pão de queijo? Aperta no botão \"Pão de queijo\". O sistema conta tudo sozinho.",
      },
      {
        q: "O que são as metas do evento?",
        a: "Metas são seus objetivos de venda. Exemplo: \"quero vender 50 pães\". O sistema mostra em porcentagem (%) quanto falta para você bater a meta.",
      },
    ],
  },
  {
    title: "💰 Finanças",
    items: [
      {
        q: "O que são \"Entradas\"?",
        a: "É todo dinheiro que você recebeu. Vendas na feira, encomendas, qualquer valor que entrou. O gráfico verde mostra de onde veio o dinheiro.",
      },
      {
        q: "O que são \"Saídas\"?",
        a: "É todo dinheiro que você gastou. Compra de ingredientes, gasolina, aluguel de barraca. O gráfico vermelho mostra onde você gastou.",
      },
      {
        q: "Como adicionar uma entrada?",
        a: "Clique em \"Adicionar entrada\", escolha a categoria (ex: Venda na feira), coloque o valor e uma descrição. Pronto!",
      },
      {
        q: "Como adicionar uma saída?",
        a: "Clique em \"Adicionar saída\", escolha a categoria (ex: Ingredientes), coloque o valor e uma descrição.",
      },
    ],
  },
  {
    title: "📊 Histórico de Preços",
    items: [
      {
        q: "O que essa tela mostra?",
        a: "Mostra como o preço dos seus ingredientes mudou ao longo do tempo. Por exemplo: a farinha custava R$15 em janeiro e agora custa R$20.",
      },
      {
        q: "Por que isso é útil?",
        a: "Para você saber se está pagando mais caro e decidir se precisa aumentar o preço dos seus produtos. Também ajuda a encontrar o fornecedor mais barato.",
      },
      {
        q: "Como ler o gráfico?",
        a: "O gráfico é uma linha que sobe e desce. Se a linha sobe, o preço aumentou. Se desce, ficou mais barato. Cada cor é um ingrediente diferente.",
      },
    ],
  },
  {
    title: "🔘 O que cada botão faz?",
    items: [
      {
        q: "\"Novo evento\"",
        a: "Cria uma nova feira ou dia de vendas. Você escolhe o nome, a data e os produtos que vai levar.",
      },
      {
        q: "\"Iniciar evento\"",
        a: "Começa o evento. A tela muda para o modo de vendas com botões grandes para você ir registrando cada venda.",
      },
      {
        q: "Botões dos produtos (durante vendas)",
        a: "Cada botão é um produto. Apertou = vendeu uma unidade. O sistema conta automaticamente quantos você vendeu e quanto dinheiro entrou.",
      },
      {
        q: "\"Adicionar entrada\"",
        a: "Registra dinheiro que você recebeu. Pode ser venda, encomenda ou qualquer valor que entrou no caixa.",
      },
      {
        q: "\"Adicionar saída\"",
        a: "Registra um gasto. Pode ser compra de ingrediente, combustível ou qualquer despesa do negócio.",
      },
      {
        q: "\"Registrar compra\"",
        a: "Registra a compra de um ingrediente. Você informa o preço e a quantidade, e o estoque é atualizado sozinho.",
      },
    ],
  },
];

export default function Help() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">Ajuda</h1>

      {/* WhatsApp Support */}
      <Card className="border-2 border-primary/30 bg-primary/5">
        <CardContent className="p-6 text-center space-y-3">
          <HelpCircle className="h-10 w-10 mx-auto text-primary" />
          <h2 className="text-xl font-bold">Precisa de ajuda?</h2>
          <p className="text-muted-foreground">
            Se ficou com alguma dúvida, fale diretamente com a gente pelo WhatsApp. Respondemos rapidinho!
          </p>
          <Button
            size="lg"
            className="w-full sm:w-auto bg-green-700 hover:bg-green-800 text-white text-base gap-2"
            onClick={() => window.open(WHATSAPP_URL, "_blank")}
          >
            <MessageCircle className="h-5 w-5" />
            Falar no WhatsApp
          </Button>
        </CardContent>
      </Card>

      {/* FAQ */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">📚 Dúvidas rápidas</h2>
        <p className="text-muted-foreground text-sm">
          Toque em qualquer pergunta para ver a resposta. Explicamos tudo de um jeito bem simples!
        </p>

        {sections.map((section) => (
          <Card key={section.title}>
            <CardContent className="p-4">
              <h3 className="font-semibold text-base mb-2">{section.title}</h3>
              <Accordion type="multiple" className="space-y-1">
                {section.items.map((item, i) => (
                  <AccordionItem key={i} value={`${section.title}-${i}`} className="border-b-0">
                    <AccordionTrigger className="text-sm text-left py-2 hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground pb-2">
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
  );
}
