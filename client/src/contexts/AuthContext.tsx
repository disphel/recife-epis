import React, { createContext, useContext, useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';

export type UserRole = 'admin' | 'viewer' | 'operator';

export interface User {
  id: number | string;
  username: string;
  role: UserRole;
  name: string;
  allowedAccounts?: string[]; // Lista de nomes de contas permitidas para edição
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  users: User[]; // For admin management
  addUser: (user: Omit<User, 'id'> & { password: string, allowedAccounts?: string[] }) => void;
  deleteUser: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fetch all users from server
  const { data: serverUsers, refetch: refetchUsers } = trpc.auth.getAllUsers.useQuery(undefined, {
    enabled: false, // Don't auto-fetch, we'll call manually when needed
  });

  // Login mutation
  const loginMutation = trpc.auth.login.useMutation();

  // Add user mutation
  const addUserMutation = trpc.auth.createUser.useMutation();

  // Delete user mutation
  const deleteUserMutation = trpc.auth.deleteUser.useMutation();

  useEffect(() => {
    // Don't restore session if we're logging out
    if (isLoggingOut) return;
    
    // Check for active session
    const session = localStorage.getItem('auth_session');
    if (session) {
      try {
        const parsedUser = JSON.parse(session);
        setUser(parsedUser);
        // Fetch users if admin
        if (parsedUser.role === 'admin') {
          refetchUsers();
        }
      } catch (e) {
        localStorage.removeItem('auth_session');
      }
    }
  }, [refetchUsers, isLoggingOut]);

  useEffect(() => {
    if (serverUsers) {
      setAllUsers(serverUsers);
    }
  }, [serverUsers]);

  const login = async (username: string, password: string) => {
    console.log('Tentativa de login:', { username });
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    
    try {
      const result = await loginMutation.mutateAsync({
        username: cleanUsername,
        password: cleanPassword,
      });

      if (result.success && result.user) {
        console.log('Login bem-sucedido para:', cleanUsername);
        setUser(result.user);
        localStorage.setItem('auth_session', JSON.stringify(result.user));
        
        // Fetch users if admin
        if (result.user.role === 'admin') {
          refetchUsers();
        }
        
        return true;
      }
    } catch (error) {
      console.error('Erro no login:', error);
    }
    
    console.log('Falha no login');
    return false;
  };

  const logout = () => {
    setIsLoggingOut(true);
    setUser(null);
    // Clear ALL localStorage to ensure clean state
    localStorage.clear();
    // Force immediate redirect with full page reload
    window.location.href = window.location.origin + '/login';
  };

  const addUser = async (newUser: Omit<User, 'id'> & { password: string, allowedAccounts?: string[] }) => {
    try {
      const result = await addUserMutation.mutateAsync(newUser);
      if (result.success) {
        // Refetch users to update the list
        refetchUsers();
      }
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error);
    }
  };

  const deleteUser = async (id: string | number) => {
    try {
      const result = await deleteUserMutation.mutateAsync({ id: typeof id === 'string' ? parseInt(id) : id });
      if (result.success) {
        // Refetch users to update the list
        refetchUsers();
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      login, 
      logout,
      users: allUsers.map(({ password, ...u }: any) => u),
      addUser,
      deleteUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
