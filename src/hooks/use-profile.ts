import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Profile } from "@/types/auth";

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching profile for user:', userId);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setError(error);
        return;
      }

      if (!data) {
        console.log('No profile found for user:', userId);
        return;
      }

      console.log('Profile fetched successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  return {
    profile,
    setProfile,
    fetchProfile,
    loading,
    error
  };
};
