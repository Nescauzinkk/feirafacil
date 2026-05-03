# Changelog de Correções — Feira Fácil

## 🔴 BUG CRÍTICO CORRIGIDO: Estoque "multiplicando" após venda em evento

### Causa raiz
**Race condition em `registerSale` (src/lib/store.ts)**

Ao clicar rapidamente no botão de venda (ou duplo-clique), duas chamadas de `registerSale`
eram disparadas quase ao mesmo tempo. Ambas liam o mesmo valor de `product.quantity` da
memória antes que qualquer uma tivesse concluído a atualização no banco de dados.

Resultado: se o estoque era 10 e a venda era de 1 unidade, ambas as chamadas calculavam
`10 - 1 = 9` e gravavam `9` no banco — em vez de `10 → 9 → 8`. O estoque ficava "parado"
ou, em casos de múltiplas vendas simultâneas, o valor em memória ficava inconsistente com
o banco, criando a aparência de "multiplicação".

### Solução aplicada
1. **Lock por produto (`saleInProgress` Set)** — impede que duas vendas do mesmo produto
   no mesmo evento sejam processadas ao mesmo tempo.
2. **Leitura do estoque direto do banco** — antes de debitar, o `registerSale` busca
   `quantity` diretamente do Supabase (não da memória), garantindo que o cálculo seja
   sempre baseado no valor mais atual.
3. **Validação de estoque insuficiente** — se o banco retornar quantidade menor que a
   solicitada, a venda é bloqueada com mensagem de erro clara.
4. **Snapshot atômico da memória** — o estado em memória é atualizado uma única vez,
   após todas as operações no banco concluírem com sucesso.

---

## 🟡 BUG CORRIGIDO: `priceRegional` nunca era salvo/carregado

### Causa raiz
A coluna `price_regional` não existia na tabela `products` do banco de dados.
O campo `priceRegional` existia apenas no tipo TypeScript e nunca era persistido.
Ao recarregar a página, o preço regional era perdido.

### Solução aplicada
1. **Nova migration SQL**: `20260503000000_add_price_regional_to_products.sql`
   — adiciona a coluna `price_regional NUMERIC` na tabela `products`.
2. **`loadDataFromSupabase`** — agora mapeia `r.price_regional` → `priceRegional`.
3. **`addProduct` e `updateProduct`** — agora incluem `price_regional` nas operações de
   insert/update.
4. **Migração de dados do localStorage** — inclui `price_regional` ao migrar dados antigos.

---

## 🟡 BUG CORRIGIDO: `undoSale` com estoque stale

### Causa raiz
`undoSale` lia `product.quantity` da memória antes de devolver ao estoque. Se a memória
estava desatualizada (após várias vendas rápidas), a devolução era calculada incorretamente.

### Solução aplicada
`undoSale` agora lê a quantidade atual do produto diretamente do banco antes de devolver,
garantindo que a reversão seja baseada no valor real.

---

## 🔵 MELHORIAS DE UX/UI

### Tela de Evento Ativo
- **Spinner de loading** exibido enquanto uma venda está sendo processada.
- **Todos os botões de produto desabilitados** durante o processamento de uma venda
  (evita double-click e cliques simultâneos).
- **Mensagem de erro toast** quando a venda falha (estoque insuficiente, erro de rede).
- **Botões de forma de pagamento** com estilo mais claro mostrando qual está selecionado
  (borda verde destacada em vez de cor sólida para os não selecionados).
- **"Desfazer venda" e "Remover"** desabilitados durante venda em andamento.
- **Botão de finalizar dia/evento** desabilitado durante venda em andamento.

### Tela de Finanças
- **Botão "Salvar/Atualizar"** com estado de loading durante o salvamento.
- **Await correto** no `handleSubmit` — antes era `void`, agora é `async/await` com
  tratamento de erros.

---

## ⚠️ AÇÃO NECESSÁRIA: Rodar a migration no Supabase

Você precisa rodar a seguinte migration manualmente no painel do Supabase
(SQL Editor) ou via CLI:

```sql
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS price_regional NUMERIC DEFAULT NULL;
```

Arquivo: `supabase/migrations/20260503000000_add_price_regional_to_products.sql`
