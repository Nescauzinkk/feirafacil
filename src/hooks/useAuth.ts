import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { setCurrentUser } from '@/lib/store';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: (User & { role?: string }) | null;
  session: Session | null;
  profileName: string;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<(User & { role?: string }) | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profileName, setProfileName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async (currentSession: Session | null) => {
      const authUser = currentSession?.user ?? null;

      setSession(currentSession);
      setCurrentUser(authUser?.id ?? null);

      if (!authUser) {
        setUser(null);
        setProfileName('');
        setLoading(false);
        return;
      }

      console.log("🔥 BUSCANDO ROLE E PERFIL...");

      try {
        // 🔥 BUSCA ROLE (tabela customizada)
        const { data: userData } = await supabase
          .from('users_app')
          .select('role')
          .eq('email', authUser.email?.toLowerCase())
          .maybeSingle();

        const role = userData?.role || 'user';

        // 🔥 BUSCA NOME (tabela profiles)
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', authUser.id)
          .maybeSingle();

        setUser({
          ...authUser,
          role
        });

        setProfileName(profile?.name || authUser.user_metadata?.name || authUser.email || '');
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
        setUser(authUser);
        setProfileName(authUser.user_metadata?.name || authUser.email || '');
      } finally {
        setLoading(false);
      }
    };

    // Inicialização
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUser(session);
    });

    // Escutar mudanças
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      loadUser(session);
    });

    return () => subscription.unsubscribe();
  }, []);
  
  return { user, session, profileName, loading };
}

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, name: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: window.location.origin,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}
