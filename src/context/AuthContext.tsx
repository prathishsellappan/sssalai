import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile, AppRole } from '@/types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  mustChangePassword: boolean;
  studentAccessBlocked: boolean;
  signInStudent: (password: string) => Promise<{ error: Error | null }>;
  signInTeacher: (email: string, password: string) => Promise<{ error: Error | null; mustChangePassword?: boolean }>;
  signInAdmin: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<Profile | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [studentAccessBlocked, setStudentAccessBlocked] = useState<boolean>(false);

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.error('Error fetching user profile:', error);
        setProfile(null);
        return null;
      }

      const userProfile = data as Profile;
      setProfile(userProfile);

      if (userProfile.role === 'student') {
        const { data: settings } = await supabase
          .from('site_settings')
          .select('student_access_enabled')
          .eq('id', 1)
          .single();

        if (settings && settings.student_access_enabled === false) {
          setStudentAccessBlocked(true);
        } else {
          setStudentAccessBlocked(false);
        }
      } else {
        setStudentAccessBlocked(false);
      }

      return userProfile;
    } catch (err) {
      console.error('Unexpected error fetching profile:', err);
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then((res: any) => {
      const currentSession = res?.data?.session;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchProfile(currentSession.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const subResult = supabase.auth.onAuthStateChange(async (_event: any, newSession: any) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      if (subResult?.data?.subscription?.unsubscribe) {
        subResult.data.subscription.unsubscribe();
      }
    };
  }, []);

  const refreshProfile = async (): Promise<Profile | null> => {
    if (user) {
      return await fetchProfile(user.id);
    }
    const { data } = await supabase.auth.getSession();
    if (data?.session?.user) {
      return await fetchProfile(data.session.user.id);
    }
    return null;
  };

  const signInStudent = async (password: string) => {
    const fixedEmail = import.meta.env.VITE_STUDENT_LOGIN_EMAIL || 'students@school.example';
    const { data, error } = await supabase.auth.signInWithPassword({
      email: fixedEmail,
      password,
    });

    if (error) {
      return { error };
    }

    if (data.user) {
      setUser(data.user as any);
      setSession({ user: data.user, access_token: 'demo-token' } as any);
      const userProfile = await fetchProfile(data.user.id);
      if (userProfile && !userProfile.is_active) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        return { error: new Error('The student portal is currently deactivated.') };
      }
      if (userProfile && userProfile.role !== 'student') {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        return { error: new Error('Invalid account for student portal.') };
      }
    }

    return { error: null };
  };

  const signInTeacher = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return { error };
    }

    if (data.user) {
      setUser(data.user as any);
      setSession({ user: data.user, access_token: 'demo-token' } as any);
      const userProfile = await fetchProfile(data.user.id);
      if (userProfile && !userProfile.is_active) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        return { error: new Error('Your teacher account is deactivated. Please contact your administrator.') };
      }
      if (userProfile && userProfile.role !== 'teacher') {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        return { error: new Error('Unauthorized role for teacher login.') };
      }
      return { error: null, mustChangePassword: userProfile?.must_change_password };
    }

    return { error: null };
  };

  const signInAdmin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      return { error };
    }

    if (data.user) {
      setUser(data.user as any);
      setSession({ user: data.user, access_token: 'demo-token' } as any);
      const userProfile = await fetchProfile(data.user.id);
      if (userProfile && !userProfile.is_active) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        return { error: new Error('Your administrator account is deactivated.') };
      }
      if (userProfile && userProfile.role !== 'admin') {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        return { error: new Error('Unauthorized role for administrator login.') };
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    setStudentAccessBlocked(false);
  };

  const role = profile?.role ?? null;
  const isAdmin = role === 'admin';
  const isTeacher = role === 'teacher';
  const isStudent = role === 'student';
  const mustChangePassword = Boolean(profile?.must_change_password);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        role,
        isAdmin,
        isTeacher,
        isStudent,
        mustChangePassword,
        studentAccessBlocked,
        signInStudent,
        signInTeacher,
        signInAdmin,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
