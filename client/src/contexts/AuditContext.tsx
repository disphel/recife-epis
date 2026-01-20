import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  action: 'create' | 'update' | 'delete' | 'login';
  target: string; // e.g., "Conta: Caixa Principal"
  details?: string; // e.g., "Saldo alterado de R$ 100 para R$ 200"
}

interface AuditContextType {
  logs: AuditLog[];
  logAction: (action: AuditLog['action'], target: string, details?: string) => void;
  clearLogs: () => void;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export function AuditProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('audit_logs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('audit_logs', JSON.stringify(logs));
  }, [logs]);

  const logAction = useCallback((action: AuditLog['action'], target: string, details?: string) => {
    if (!user) return;

    const newLog: AuditLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      userId: typeof user.id === 'number' ? user.id.toString() : user.id,
      username: user.username,
      action,
      target,
      details
    };

    setLogs(prev => [newLog, ...prev]);
  }, [user]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <AuditContext.Provider value={{ logs, logAction, clearLogs }}>
      {children}
    </AuditContext.Provider>
  );
}

export function useAudit() {
  const context = useContext(AuditContext);
  if (context === undefined) {
    throw new Error('useAudit must be used within an AuditProvider');
  }
  return context;
}
