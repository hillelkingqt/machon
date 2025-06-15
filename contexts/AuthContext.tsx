import React, { createContext, useState, useEffect, useContext, ReactNode, useRef } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient'; // Adjust path as necessary

const LOGIN_NOTIFY_URL = 'https://machon.hillelben14.workers.dev/login-notify';

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
  isLearningSpaceAuthorized?: boolean;
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
  const [isLearningSpaceAuthorized, setIsLearningSpaceAuthorized] = useState<boolean>(false);
  const loginNotifiedRef = useRef(false); // Track if login notification was sent for current session

  // Function to log user activity
  const logActivity = async (event: string, userId?: string, email?: string) => {
    try {
      let ipAddress: string | null = null;
      try {
        const { data } = await supabase.functions.invoke('get-my-ip');
        if (data && typeof data.ip === 'string') {
          ipAddress = data.ip;
        }
      } catch (err) {
        try {
          const res = await fetch('https://api.ipify.org?format=json');
          const json = await res.json();
          ipAddress = json.ip;
        } catch (_) {
          ipAddress = null;
        }
      }

      const { error } = await supabase.from('user_activity_log').insert([
        {
          event,
          user_id: userId || null,
          email: email || null,
          ip_address: ipAddress,
          is_admin_activity: false,
        },
      ]);

      if (error) {
        console.error(`Error logging activity for ${event}:`, error);
      }
    } catch (error) {
      console.error(`Error logging activity for ${event}:`, error);
    }
  };

  const notifyLogin = async (supabaseUser: SupabaseUser) => {
    try {
      await fetch(LOGIN_NOTIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || undefined,
        }),
      });
    } catch (error) {
      console.error('Failed to send login notification', error);
    }
  };

  const checkLearningSpaceAuthorization = async (supabaseUser: SupabaseUser | null): Promise<boolean> => {
    if (!supabaseUser || !supabaseUser.email) {
      return false;
    }
    const userEmail = supabaseUser.email;

    try {
      // Admin Check
      const { data: adminData, error: adminError } = await supabase
        .from('admin')
        .select('id, expires_at')
        .eq('gmail', userEmail)
        .maybeSingle(); // Use maybeSingle to handle null and single row

      if (adminError && adminError.code !== 'PGRST116') { // PGRST116: No rows found, not an error for this check
        console.error('Error checking admin table for learning space auth:', adminError);
        // Optionally, you might want to return false or throw, depending on desired behavior for DB errors
      }
      if (adminData) {
        if (adminData.expires_at) {
          if (new Date(adminData.expires_at) > new Date()) return true; // Valid temporary admin
        } else {
          return true; // Permanent admin
        }
      }

      // Authorized User Check
      const { data: learningUserData, error: learningUserError } = await supabase
        .from('authorized_learning_space_users')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      if (learningUserError && learningUserError.code !== 'PGRST116') {
        console.error('Error checking authorized_learning_space_users table:', learningUserError);
      }
      if (learningUserData) return true;

    } catch (error) {
      console.error('Exception during checkLearningSpaceAuthorization:', error);
    }
    return false;
  };

  useEffect(() => {
    setLoadingInitial(true);
    // Check for existing session on initial load
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      setSession(currentSession);
      const currentUser = currentSession?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        loginNotifiedRef.current = true; // Assume notification already sent for existing session
        const m = currentUser.user_metadata || {};
        const firstName = m.first_name || m.given_name || (m.full_name || m.name || '').split(' ')[0];
        const lastName = m.last_name || m.family_name || (m.full_name || m.name || '').split(' ').slice(1).join(' ');
        setProfile({
          id: currentUser.id,
          firstName,
          lastName,
          fullName: m.full_name || m.name || `${firstName || ''} ${lastName || ''}`.trim(),
          avatarUrl: m.avatar_url || m.picture,
        });
        const isAuthorized = await checkLearningSpaceAuthorization(currentUser);
        setIsLearningSpaceAuthorized(isAuthorized);
      } else {
        setProfile(null);
        setIsLearningSpaceAuthorized(false);
      }
      setLoadingInitial(false);
    }).catch(() => {
        setProfile(null);
        setIsLearningSpaceAuthorized(false);
        setLoadingInitial(false); // Ensure loading stops on error too
    });

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setLoadingInitial(true); // Set loading true during auth state change processing
        setSession(newSession);
        const currentUser = newSession?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const m = currentUser.user_metadata || {};
          const firstName = m.first_name || m.given_name || (m.full_name || m.name || '').split(' ')[0];
          const lastName = m.last_name || m.family_name || (m.full_name || m.name || '').split(' ').slice(1).join(' ');
          const userProfile: UserProfile = {
            id: currentUser.id,
            firstName,
            lastName,
            fullName: m.full_name || m.name || `${firstName || ''} ${lastName || ''}`.trim(),
            avatarUrl: m.avatar_url || m.picture,
          };
          setProfile(userProfile);

          const isAuthorized = await checkLearningSpaceAuthorization(currentUser);
          setIsLearningSpaceAuthorized(isAuthorized);

          if (event === 'SIGNED_IN' && !loginNotifiedRef.current) {
            loginNotifiedRef.current = true;
            notifyLogin(currentUser);
            logActivity('SIGNED_IN', currentUser.id, currentUser.email);
          }
        } else {
          setProfile(null);
          setIsLearningSpaceAuthorized(false);
          if (event === 'SIGNED_OUT' || !newSession) {
             loginNotifiedRef.current = false;
             logActivity('SIGNED_OUT');
          }
        }
        setLoadingInitial(false);
      }
    );

    return () => {
      authListener.unsubscribe();
    };
  }, []);

  const logout = async () => {
    setLoadingInitial(true); // Indicate loading during logout
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error logging out:", error);
      setLoadingInitial(false);
      throw error;
    } else {
      setSession(null);
      setUser(null);
      setProfile(null);
      loginNotifiedRef.current = false;
      logActivity('SIGNED_OUT');
      setLoadingInitial(false);
    }
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
    isLearningSpaceAuthorized,
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
