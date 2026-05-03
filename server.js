import 'dotenv/config';
import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const app = express();
app.use(cors());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🔥 WEBHOOK
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // ⚠️ ATENÇÃO: Se você não configurar STRIPE_WEBHOOK_SECRET no Railway, isso vai falhar.
    // Em modo de desenvolvimento ou se não tiver o secret, use req.body diretamente (apenas para teste!)
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } else {
      event = JSON.parse(req.body.toString());
      console.log('⚠️ AVISO: Processando webhook sem verificação de assinatura (STRIPE_WEBHOOK_SECRET ausente)');
    }
  } catch (err) {
    console.log('❌ ERRO WEBHOOK (ASSINATURA):', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('📦 EVENTO RECEBIDO:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Pegar o email do cliente da sessão do Stripe
    const email = (session.customer_details?.email || session.customer_email || "").trim().toLowerCase();
    const customerId = session.customer;

    if (!email) {
      console.error('❌ ERRO CRÍTICO: Email não encontrado na sessão do Stripe');
      return res.status(400).json({ error: 'Email not found' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    console.log(`🚀 TENTANDO SALVAR TOKEN PARA: ${email}`);

    // 🔥 TENTATIVA 1: UPSERT (ATUALIZA SE JÁ EXISTE, CRIA SE NÃO)
    const { data: upsertData, error: upsertError } = await supabase
      .from('users_app')
      .upsert({
        email: email,
        stripe_customer_id: customerId,
        subscription_status: 'active',
        plan: session.metadata?.plan || 'mensal',
        signup_token: token,
        token_used: false,
        role: 'user'
      }, { onConflict: 'email' })
      .select();

    if (upsertError) {
      console.error('❌ ERRO NO UPSERT SUPABASE:', JSON.stringify(upsertError));
      
      // 🔥 TENTATIVA 2: DELETE + INSERT (CASO O UPSERT ESTEJA BLOQUEADO)
      console.log('🔄 TENTANDO DELETE + INSERT COMO FALLBACK...');
      await supabase.from('users_app').delete().eq('email', email);
      
      const { data: insData, error: insError } = await supabase.from('users_app').insert({
        email: email,
        stripe_customer_id: customerId,
        subscription_status: 'active',
        signup_token: token,
        token_used: false,
        role: 'user'
      }).select();

      if (insError) {
        console.error('❌ ERRO NO FALLBACK INSERT:', JSON.stringify(insError));
      } else {
        console.log('✅ TOKEN SALVO VIA FALLBACK INSERT:', JSON.stringify(insData));
      }
    } else {
      console.log('✅ TOKEN SALVO COM SUCESSO (UPSERT):', JSON.stringify(upsertData));
    }
  }

  res.json({ received: true });
});

// JSON normal
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') return next();
  express.json()(req, res, next);
});

// 🔥 CHECKOUT
app.post('/create-checkout', async (req, res) => {
  try {
    const { plan, email } = req.body;

    const priceId =
      plan === 'anual'
        ? 'price_1TK80NLa5pXx3AYvo0VjJOFj'
        : 'price_1TK7xQLa5pXx3AYvwmnbnaca';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: email,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://www.feirafacilonline.com.br/sucesso?email=${email}`,
      cancel_url: `https://www.feirafacilonline.com.br/planos`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// 🔥 PORTAL DO CLIENTE (GERENCIAR ASSINATURA)
app.post('/create-portal-session', async (req, res) => {
  try {
    const { email } = req.body;

    // Buscar o customer_id no Supabase
    const { data: user, error } = await supabase
      .from('users_app')
      .select('stripe_customer_id')
      .eq('email', email)
      .single();

    if (error || !user?.stripe_customer_id) {
      return res.status(404).json({ error: 'Cliente Stripe não encontrado para este email.' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripe_customer_id,
      return_url: `https://www.feirafacilonline.com.br/dashboard`,
    });

    res.json({ url: portalSession.url });
  } catch (error) {
    console.error('ERRO PORTAL:', error);
    res.status(500).json({ error: error.message });
  }
});

// 🔥 RECUPERAR TOKEN
app.get('/get-token-by-email', async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'Email obrigatório' });

  const normalizedEmail = email.toString().trim().toLowerCase();
  console.log(`🔍 BUSCANDO TOKEN PARA: ${normalizedEmail}`);

  try {
    // 🔥 BUSCA AMPLA PARA DIAGNÓSTICO
    const { data, error } = await supabase
      .from('users_app')
      .select('*')
      .eq('email', normalizedEmail)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ ERRO SUPABASE (SELECT):', JSON.stringify(error));
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      console.log(`⚠️ NENHUM REGISTRO PARA: ${normalizedEmail}`);
      return res.status(404).json({ error: 'Nenhum acesso encontrado.' });
    }

    // Pegar o token mais recente que não foi usado
    const pendingToken = data.find(u => !u.token_used);

    if (!pendingToken) {
      console.log(`ℹ️ TODOS OS TOKENS JÁ USADOS PARA: ${normalizedEmail}`);
      return res.status(400).json({ error: 'Este acesso já foi utilizado.' });
    }

    console.log(`✅ TOKEN ENCONTRADO PARA: ${normalizedEmail}`);
    res.json({ token: pendingToken.signup_token });
  } catch (err) {
    console.error('❌ ERRO INTERNO:', err.message);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// 🔥 VALIDAR TOKEN
app.get('/validate-token', async (req, res) => {
  const { token } = req.query;

  const { data } = await supabase
    .from('users_app')
    .select('*')
    .eq('signup_token', token)
    .eq('token_used', false)
    .maybeSingle();

  if (!data) {
    return res.status(400).json({ error: 'Token inválido' });
  }

  res.json({ email: data.email });
});

// 🔥 USAR TOKEN
app.post('/use-token', async (req, res) => {
  const { token } = req.body;

  await supabase
    .from('users_app')
    .update({ token_used: true })
    .eq('signup_token', token);

  res.json({ success: true });
});

app.post('/create-test-user', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email obrigatório' });
  }

  try {
    const token = crypto.randomBytes(32).toString('hex');

    const { error } = await supabase.from('users_app').upsert({
      email,
      subscription_status: 'active',
      plan: 'mensal',
      signup_token: token,
      token_used: false,
      role: 'user'
    });

    if (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao salvar no banco' });
    }

    res.json({
      success: true,
      token // 🔥 útil pra debug/teste
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

app.listen(3000, () => {
  console.log('🔥 Backend rodando na porta 3000');
});