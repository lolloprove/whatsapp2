import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile } from '../types/chat';
import { apiRequest } from '../services/api';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isRegistered: boolean;
  registerUser: (username: string, fullName?: string) => Promise<void>;
  updateProfile: (fullName: string, statusMessage: string, avatarUrl?: string, username?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'whatsapp2_user_session';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Al mount: ripristina la sessione locale e validala contro il server.
  // Il profilo fresco dal server sovrascrive quello locale (persistenza reale).
  useEffect(() => {
    const restoreSession = async () => {
      let saved: UserProfile | null = null;
      try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          const parsed: UserProfile = JSON.parse(raw);
          if (parsed && parsed.id && parsed.username) saved = parsed;
        }
      } catch (e) {
        console.warn('Error reading user session:', e);
      }

      if (!saved) {
        setIsLoading(false);
        return;
      }

      // Mostra subito la sessione locale (UI reattiva), poi riconcilia col server
      setUser(saved);
      try {
        const res = await apiRequest('/auth/me', {}, saved);
        if (res.data) {
          setUser(res.data);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(res.data));
        }
      } catch (err) {
        const status = (err as Error & { status?: number }).status;
        if (status === 401) {
          // Il server non conosce più questo utente (es. dati resettati): sessione invalida
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setUser(null);
        }
        // Su errore di rete manteniamo la sessione locale: il socket/API riproveranno
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const registerUser = async (username: string, fullName?: string) => {
    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!cleanUsername || cleanUsername.length < 2) {
      throw new Error('Username non valido');
    }

    // Registrazione/login reale sul server: l'username è la credenziale univoca.
    // Il server restituisce un ID stabile che sopravvive ai refresh.
    const res = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: cleanUsername,
        fullName: fullName?.trim() || cleanUsername
      })
    });

    if (!res.data) {
      throw new Error('Risposta del server non valida');
    }

    const registered: UserProfile = res.data;
    setUser(registered);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(registered));
  };

  const updateProfile = async (
    fullName: string,
    statusMessage: string,
    avatarUrl?: string,
    username?: string
  ) => {
    if (!user) return;
    const cleanUsername = username?.trim().toLowerCase().replace(/[^a-z0-9_]/g, '') || user.username;

    const res = await apiRequest('/auth/sync-profile', {
      method: 'POST',
      body: JSON.stringify({
        username: cleanUsername,
        fullName: fullName.trim() || user.fullName,
        statusMessage: statusMessage.trim() || user.statusMessage,
        avatarUrl: avatarUrl || user.avatarUrl
      })
    }, user);

    const updated: UserProfile = res.data || {
      ...user,
      username: cleanUsername,
      fullName: fullName.trim() || user.fullName,
      statusMessage: statusMessage.trim() || user.statusMessage,
      avatarUrl: avatarUrl || user.avatarUrl
    };

    setUser(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  const logout = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setUser(null);
  };

  const isRegistered = Boolean(user && user.username);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isRegistered,
        registerUser,
        updateProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
