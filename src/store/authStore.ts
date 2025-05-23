import { create } from 'zustand';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, username: string, displayName: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  
  login: async (email: string, password: string) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user data returned');

      // Fetch user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      const userData: User = {
        id: authData.user.id,
        email: authData.user.email!,
        username: profileData.nombre_usuario,
        displayName: profileData.nombre_completo,
        avatar: profileData.avatar_url
      };

      set({ isAuthenticated: true, user: userData, isLoading: false });
      toast.success('¡Inicio de sesión exitoso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión');
      throw error;
    }
  },

  loginWithGoogle: async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;

      // Note: The actual user profile creation will happen in checkAuth
      // after the OAuth redirect
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al iniciar sesión con Google');
      throw error;
    }
  },
  
  register: async (email: string, password: string, username: string, displayName: string) => {
    try {
      // Check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from('usuarios')
        .select('nombre_usuario')
        .eq('nombre_usuario', username)
        .single();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      if (existingUser) throw new Error('El nombre de usuario ya está en uso');

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            display_name: displayName
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      // Create user profile
      const { error: profileError } = await supabase
        .from('usuarios')
        .insert({
          id: authData.user.id,
          nombre_usuario: username,
          nombre_completo: displayName,
          avatar_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`
        });

      if (profileError) throw profileError;

      const userData: User = {
        id: authData.user.id,
        email: authData.user.email!,
        username,
        displayName,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`
      };

      set({ isAuthenticated: true, user: userData, isLoading: false });
      toast.success('¡Registro exitoso!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrar usuario');
      throw error;
    }
  },
  
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error al cerrar sesión');
      return;
    }
    
    set({ isAuthenticated: false, user: null });
    toast.info('Has cerrado sesión');
  },
  
  checkAuth: async () => {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError) throw authError;
      
      if (session?.user) {
        // Check if user profile exists
        const { data: profileData, error: profileError } = await supabase
          .from('usuarios')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError && profileError.code === 'PGRST116') {
          // Profile doesn't exist, create it for OAuth users
          const username = session.user.email!.split('@')[0];
          const displayName = session.user.user_metadata.full_name || username;
          
          const { error: createError } = await supabase
            .from('usuarios')
            .insert({
              id: session.user.id,
              nombre_usuario: username,
              nombre_completo: displayName,
              avatar_url: session.user.user_metadata.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`
            });

          if (createError) throw createError;

          const userData: User = {
            id: session.user.id,
            email: session.user.email!,
            username,
            displayName,
            avatar: session.user.user_metadata.avatar_url
          };

          set({ isAuthenticated: true, user: userData, isLoading: false });
        } else if (profileError) {
          throw profileError;
        } else {
          const userData: User = {
            id: session.user.id,
            email: session.user.email!,
            username: profileData.nombre_usuario,
            displayName: profileData.nombre_completo,
            avatar: profileData.avatar_url
          };

          set({ isAuthenticated: true, user: userData, isLoading: false });
        }
      } else {
        set({ isAuthenticated: false, user: null, isLoading: false });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      set({ isAuthenticated: false, user: null, isLoading: false });
    }
  }
}));