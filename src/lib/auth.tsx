import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  ClerkProvider as RealClerkProvider, 
  SignedIn as RealSignedIn, 
  SignedOut as RealSignedOut, 
  useUser as useRealUser, 
  useClerk as useRealClerk,
  useSignIn as useRealSignIn,
  useSignUp as useRealSignUp
} from '@clerk/clerk-react';
import { ptBR } from '@clerk/localizations';
import SupabaseAuthBridge from '@/components/SupabaseAuthBridge';
import { getUserStorageItem } from '@/lib/userStorage';

// Usa a chave do ambiente ou a chave que você forneceu como fallback para o preview
const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_d29uZHJvdXMtbG9jdXN0LTg1LmNsZXJrLmFjY291bnRzLmRldiQ";
export const isClerkConfigured = !!CLERK_KEY;

interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  imageUrl: string | null;
  emailAddresses: { emailAddress: string }[];
}

interface AuthContextType {
  user: MockUser | null;
  isSignedIn: boolean;
  isLoaded: boolean;
  signIn: (email: string) => Promise<void>;
  signUp: (email: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const HybridAuthProvider = ({ children }: { children: React.ReactNode }) => {
  if (isClerkConfigured) {
    return (
      <RealClerkProvider publishableKey={CLERK_KEY} localization={ptBR}>
        <SupabaseAuthBridge />
        {children}
      </RealClerkProvider>
    );
  }

  // Mock Auth State (Fallback de segurança local)
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('elha_mock_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoaded(true);
  }, []);

  const signIn = async (email: string) => {
    const mockUser: MockUser = {
      id: 'mock-user-id',
      firstName: 'Especialista',
      lastName: 'Elha',
      fullName: 'Especialista Elha',
      imageUrl: getUserStorageItem('mock-user-id', 'avatar'),
      emailAddresses: [{ emailAddress: email }]
    };
    setUser(mockUser);
    localStorage.setItem('elha_mock_user', JSON.stringify(mockUser));
  };

  const signUp = async (email: string, firstName: string, lastName: string) => {
    const mockUser: MockUser = {
      id: 'mock-user-id',
      firstName: firstName,
      lastName: lastName,
      fullName: `${firstName} ${lastName}`,
      imageUrl: getUserStorageItem('mock-user-id', 'avatar'),
      emailAddresses: [{ emailAddress: email }]
    };
    setUser(mockUser);
    localStorage.setItem('elha_mock_user', JSON.stringify(mockUser));
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('elha_mock_user');
  };

  return (
    <AuthContext.Provider value={{ user, isSignedIn: !!user, isLoaded, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Mock Hooks & Components
export const useUser = () => {
  if (isClerkConfigured) {
    const real = useRealUser();
    return { user: real.user, isSignedIn: real.isSignedIn, isLoaded: real.isLoaded };
  }
  const context = useContext(AuthContext);
  return { user: context?.user || null, isSignedIn: !!context?.user, isLoaded: context?.isLoaded || false };
};

export const useClerk = () => {
  if (isClerkConfigured) {
    return useRealClerk();
  }
  const context = useContext(AuthContext);
  return {
    signOut: () => context?.signOut() || Promise.resolve(),
  };
};

export const useSignIn = () => {
  if (isClerkConfigured) {
    const { isLoaded, signIn, setActive } = useRealSignIn();
    return { isLoaded, signIn, setActive, isMock: false };
  }
  const context = useContext(AuthContext);
  return {
    isLoaded: true,
    isMock: true,
    signIn: {
      create: async ({ identifier, strategy }: { identifier: string, strategy?: string }) => {
        await context?.signIn(identifier);
        return { status: 'complete', createdSessionId: 'mock-session' };
      },
      attemptFirstFactor: async ({ strategy, code, password }: any) => {
        return { status: 'complete', createdSessionId: 'mock-session' };
      }
    },
    setActive: async () => {}
  };
};

export const useSignUp = () => {
  if (isClerkConfigured) {
    const { isLoaded, signUp, setActive } = useRealSignUp();
    return { isLoaded, signUp, setActive, isMock: false };
  }
  const context = useContext(AuthContext);
  return {
    isLoaded: true,
    isMock: true,
    signUp: {
      create: async ({ emailAddress, firstName, lastName }: { emailAddress: string, firstName: string, lastName?: string }) => {
        await context?.signUp(emailAddress, firstName, lastName || '');
        return { status: 'complete', createdSessionId: 'mock-session' };
      }
    },
    setActive: async () => {}
  };
};

export const SignedIn = ({ children }: { children: React.ReactNode }) => {
  if (isClerkConfigured) {
    return <RealSignedIn>{children}</RealSignedIn>;
  }
  const { isSignedIn, isLoaded } = useUser();
  return isLoaded && isSignedIn ? <>{children}</> : null;
};

export const SignedOut = ({ children }: { children: React.ReactNode }) => {
  if (isClerkConfigured) {
    return <RealSignedOut>{children}</RealSignedOut>;
  }
  const { isSignedIn, isLoaded } = useUser();
  return isLoaded && !isSignedIn ? <>{children}</> : null;
};

export const RedirectToSignIn = () => {
  useEffect(() => {
    window.location.href = '/login';
  }, []);
  return null;
};