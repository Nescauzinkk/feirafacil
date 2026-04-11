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
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.log('❌ ERRO WEBHOOK:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('✅ Evento:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const customer = await stripe.customers.retrieve(session.customer);
    const email = customer.email;

    const token = crypto.randomBytes(32).toString('hex');

    await supabase.from('users_app').upsert({
      email,
      stripe_customer_id: customer.id,
      subscription_status: 'active',
      plan: 'mensal',
      signup_token: token,
      token_used: false,
      role: 'user' // 🔥 já define padrão
    });

    console.log('🔥 TOKEN GERADO:', token);
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
        : 'price_1TKYDaLa5pXx3AYvqOWtNO0k';

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

// 🔥 RECUPERAR TOKEN
app.get('/get-token-by-email', async (req, res) => {
  const { email } = req.query;

  const { data } = await supabase
    .from('users_app')
    .select('*')
    .eq('email', email)
    .eq('token_used', false)
    .single();

  if (!data) {
    return res.status(404).json({ error: 'Token não encontrado' });
  }

  res.json({ token: data.signup_token });
});

// 🔥 VALIDAR TOKEN
app.get('/validate-token', async (req, res) => {
  const { token } = req.query;

  const { data } = await supabase
    .from('users_app')
    .select('*')
    .eq('signup_token', token)
    .eq('token_used', false)
    .single();

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