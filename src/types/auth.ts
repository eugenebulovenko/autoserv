
import { Session, User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: 'admin' | 'client' | 'mechanic';
}

export interface AuthContextProps {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  isMechanic: boolean;
  isClient: boolean;
}
