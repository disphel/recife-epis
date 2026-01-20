import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Edit2, Plus, EyeOff } from "lucide-react";
import { useState } from "react";
import { EditAccountDialog } from "./EditAccountDialog";
import { usePrivacy } from "@/contexts/PrivacyContext";
import { useAuth } from "@/contexts/AuthContext";

interface AccountData {
  name: string;
  saldo_anterior: number;
  entradas: number;
  saidas: number;
  taxas?: number;
  saldo_atual: number;
  nota?: string;
  sensitive_fields?: {
    saldo_anterior?: boolean;
    entradas?: boolean;
    saidas?: boolean;
    saldo_atual?: boolean;
  };
}

interface FinancialTableProps {
  date: string;
  accounts: AccountData[];
  totals: {
    saldo_anterior: number;
    entradas: number;
    saidas: number;
    taxas?: number;
    saldo_atual: number;
  };
  onUpdateAccount: (index: number, account: AccountData) => void;
  onAddAccount: (account: AccountData) => void;
  onDeleteAccount: (index: number) => void;
  readOnly?: boolean;
}

export function FinancialTable({ date, accounts, totals, onUpdateAccount, onAddAccount, onDeleteAccount, readOnly = false }: FinancialTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { isPrivacyMode } = usePrivacy();
  const { user } = useAuth();
  const canEdit = !readOnly && (user?.role === 'admin' || user?.role === 'operator');
  
  const isAccountEditable = (accountName: string) => {
    if (readOnly) return false;
    if (user?.role === 'admin') return true;
    if (user?.role === 'operator') {
      // If no specific accounts listed, allow all (or none? usually none if empty, but let's assume empty means none for safety)
      if (!user.allowedAccounts || user.allowedAccounts.length === 0) return false;
      return user.allowedAccounts.includes(accountName);
    }
    return false;
  };

  const formatCurrency = (val: number, isSensitive?: boolean) => {
    if (isPrivacyMode && isSensitive) return "••••••";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const checkConsistency = (account: AccountData) => {
    // Saldo Anterior já vem ajustado do banco de dados/estado
    const calculated = account.saldo_anterior + account.entradas - account.saidas - (account.taxas || 0);
    const diff = Math.abs(calculated - account.saldo_atual);
    const isConsistent = diff < 0.02; // Tolerância para arredondamento

    return { isConsistent, diff };
  };

  const handleEditClick = (index: number) => {
    if (readOnly) return;
    setEditingIndex(index);
    setIsDialogOpen(true);
  };

  const handleAddClick = () => {
    if (readOnly) return;
    setEditingIndex(null);
    setIsDialogOpen(true);
  };

  const handleSave = (account: AccountData) => {
    if (editingIndex !== null) {
      onUpdateAccount(editingIndex, account);
    } else {
      onAddAccount(account);
    }
  };

  return (
    <>
      <Card className="overflow-hidden border-t-4 border-t-primary shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-lg font-bold text-primary flex flex-wrap items-center gap-2">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-mono whitespace-nowrap">
                {date}
              </span>
              <span className="text-slate-600 font-medium text-base">
                {readOnly ? "Relatório Consolidado" : "Detalhamento de Contas"}
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white text-slate-600 border-slate-200 w-fit">
                {accounts.length} Contas
              </Badge>
              {canEdit && (
                <Button size="sm" onClick={handleAddClick} className="h-7 text-xs gap-1 bg-primary hover:bg-primary/90">
                  <Plus className="w-3 h-3" /> Nova Conta
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="font-bold text-primary w-[200px]">Conta</TableHead>
                <TableHead className="text-right font-semibold text-slate-600">Saldo Anterior</TableHead>
                <TableHead className="text-right font-semibold text-emerald-600">Entradas</TableHead>
                <TableHead className="text-right font-semibold text-rose-600">Saídas</TableHead>
                <TableHead className="text-right font-semibold text-amber-600">Taxas</TableHead>
                <TableHead className="text-right font-bold text-primary">Saldo Atual</TableHead>
                <TableHead className="text-center font-semibold text-slate-600">Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account, index) => {
                const { isConsistent } = checkConsistency(account);
                const hasError = !isConsistent;
                
                    const isEditable = isAccountEditable(account.name);
                    
                    return (
                      <TableRow 
                        key={index} 
                        className={cn(
                          "transition-colors", 
                          isEditable ? "cursor-pointer active:bg-slate-100" : "cursor-default",
                          hasError ? "bg-rose-50/30 hover:bg-rose-50/50" : "hover:bg-slate-50/50",
                          !isEditable && canEdit && "opacity-70 bg-slate-50" // Visual cue for non-editable accounts for operators
                        )}
                        onClick={() => isEditable && handleEditClick(index)}
                      >
                    <TableCell className="font-medium text-slate-700">
                      <div className="flex flex-col">
                        <span>{account.name}</span>
                        {account.nota && <span className="text-xs text-slate-400 font-normal">{account.nota}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-slate-600 font-mono text-sm">
                      <div className="flex flex-col items-end">
                        <span>{formatCurrency(account.saldo_anterior, account.sensitive_fields?.saldo_anterior)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-emerald-600 font-mono text-sm">
                      {account.entradas > 0 ? formatCurrency(account.entradas, account.sensitive_fields?.entradas) : "-"}
                    </TableCell>
                    <TableCell className="text-right text-rose-600 font-mono text-sm">
                      {account.saidas > 0 ? formatCurrency(account.saidas, account.sensitive_fields?.saidas) : "-"}
                    </TableCell>
                    <TableCell className="text-right text-amber-600 font-mono text-sm">
                      {account.taxas && account.taxas > 0 ? formatCurrency(account.taxas, false) : "-"}
                    </TableCell>
                    <TableCell className={cn("text-right font-bold font-mono text-sm", 
                      hasError ? "text-rose-600" : 
                      account.saldo_atual < 0 ? "text-rose-600" : "text-primary"
                    )}>
                      {formatCurrency(account.saldo_atual, account.sensitive_fields?.saldo_atual)}
                    </TableCell>
                    <TableCell className="text-center">
                      {hasError ? (
                        <div className="flex justify-center">
                          <div className="bg-rose-100 text-rose-600 p-1.5 rounded-full" title="Inconsistência detectada">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <div className="bg-emerald-100 text-emerald-600 p-1.5 rounded-full">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {isEditable && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(index);
                          }}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
              
              {/* Totais */}
              <TableRow className="bg-slate-100/80 hover:bg-slate-100 border-t-2 border-slate-200 font-bold">
                <TableCell className="text-primary">TOTAIS</TableCell>
                <TableCell className="text-right text-slate-700 font-mono">
                  <div className="flex flex-col items-end">
                    <span>{formatCurrency(totals.saldo_anterior)}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-emerald-700 font-mono">{formatCurrency(totals.entradas)}</TableCell>
                <TableCell className="text-right text-rose-700 font-mono">{formatCurrency(totals.saidas)}</TableCell>
                <TableCell className="text-right text-amber-700 font-mono">{formatCurrency(totals.taxas || 0)}</TableCell>
                <TableCell className={cn("text-right font-mono text-base", totals.saldo_atual < 0 ? "text-rose-700" : "text-primary")}>
                  {formatCurrency(totals.saldo_atual)}
                </TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <EditAccountDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSave}
        onDelete={editingIndex !== null ? () => onDeleteAccount(editingIndex) : undefined}
        account={editingIndex !== null ? accounts[editingIndex] : null}
      />
    </>
  );
}
