import { supabase } from "@/lib/supabase";

export const authService = {
  getSession: async () => {
    return await supabase.auth.getSession();
  },
  
  signUp: async (email: string, password: string, firstName: string, lastName: string, phone?: string) => {
    try {
      console.log('Starting signup process with:', { email, firstName, lastName, phone });
      
      // Регистрируем пользователя
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            phone: phone || null
          }
        }
      });

      if (error) {
        console.error('Sign up error:', error);
        throw error;
      }

      if (!data.user) {
        throw new Error('No user data returned from registration');
      }

      console.log('Signup successful:', { userId: data.user.id });

      // Ждем немного, чтобы убедиться, что пользователь создан
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Создаем профиль пользователя
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          first_name: firstName,
          last_name: lastName,
          phone: phone || null,
          role: 'client'
        })
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw profileError;
      }

      console.log('Profile created successfully');
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error };
    }
  },
  
  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error };
    }
  },
  
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  },
  
  resetPassword: async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error };
    }
  },
  
  updatePassword: async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Update password error:', error);
      return { error };
    }
  },
  
  onAuthStateChange: (callback: (event: any, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};
