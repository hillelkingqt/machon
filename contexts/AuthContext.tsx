import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient'; // Adjust path as necessary

export interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatarUrl?: string;
  // Add other profile fields if necessary from user_metadata or a profiles table
}

export interface AuthContextType {
  session: Session | null;
  user: SupabaseUser | null;
  profile: UserProfile | null;
  logout: () => Promise<void>;
  loadingInitial: boolean; // Renamed from 'loading' to be more specific
  // Login/Signup are handled by modals directly for now, but can be exposed here if needed
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true); // True on initial load

  useEffect(() => {
    setLoadingInitial(true);
    // Check for existing session on initial load
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        // Extract profile details from signUp metadata or OAuth provider
        const m = currentSession.user.user_metadata || {};
        const firstName = m.first_name || m.given_name || (m.full_name || m.name || '').split(' ')[0];
        const lastName = m.last_name || m.family_name || (m.full_name || m.name || '').split(' ').slice(1).join(' ');
        setProfile({
          id: currentSession.user.id,
          firstName,
          lastName,
          fullName: m.full_name || m.name || `${firstName || ''} ${lastName || ''}`.trim(),
          avatarUrl: m.avatar_url || m.picture,
        });
      } else {
        setProfile(null);
      }
      setLoadingInitial(false);
    }).catch(() => {
        setLoadingInitial(false); // Ensure loading stops on error too
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setLoadingInitial(true); // Set loading true during auth state change processing
        setSession(newSession);
        const currentUser = newSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Extract profile information from user_metadata or OAuth provider
          const m = currentUser.user_metadata || {};
          const firstName = m.first_name || m.given_name || (m.full_name || m.name || '').split(' ')[0];
          const lastName = m.last_name || m.family_name || (m.full_name || m.name || '').split(' ').slice(1).join(' ');
          const userProfile: UserProfile = {
            id: currentUser.id,
            firstName,
            lastName,
            // Supabase often provides 'full_name' or 'name' from OAuth.
            // For email signup, we constructed 'full_name'.
            fullName: m.full_name || m.name || `${firstName || ''} ${lastName || ''}`.trim(),
            avatarUrl: m.avatar_url || m.picture,
          };
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
        setLoadingInitial(false);
      }
    );

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setLoadingInitial(true); // Indicate loading during logout
    await supabase.auth.signOut();
    // onAuthStateChange will handle setting user, session, profile to null
    // setLoadingInitial will be set to false by onAuthStateChange listener
  };

  // Login and Signup functions are currently handled by the modals.
  // If they were to be exposed via context:
  // const login = async (email, password) => supabase.auth.signInWithPassword({ email, password });
  // const signup = async (email, password, firstName, lastName) => supabase.auth.signUp({
  //   email, password, options: { data: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}`}}
  // });

  const value: AuthContextType = {
    session,
    user,
    profile,
    logout,
    loadingInitial,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
