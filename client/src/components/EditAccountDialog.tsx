import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { TransactionList } from "./TransactionList";

interface Transaction {
  id: string;
  description: string;
  value: number;
}

interface AccountData {
  name: string;
  saldo_anterior: number;
  entradas: number;
  saidas: number;
  taxas?: number;
  saldo_atual: number;
  nota?: string;
  entradas_detalhadas?: Transaction[];
  saidas_detalhadas?: Transaction[];
  entradas_base?: number; // Base value for entradas (without detailed transactions)
  saidas_base?: number; // Base value for saidas (without detailed transactions)
  sensitive_fields?: {
    saldo_anterior?: boolean;
    entradas?: boolean;
    saidas?: boolean;
    saldo_atual?: boolean;
  };
}

interface EditAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: AccountData) => void;
  onDelete?: () => void;
  account: AccountData | null;
}

export function EditAccountDialog({ isOpen, onClose, onSave, onDelete, account }: EditAccountDialogProps) {
  const [formData, setFormData] = useState<AccountData>({
    name: "",
    saldo_anterior: 0,
    entradas: 0,
    saidas: 0,
    taxas: 0,
    saldo_atual: 0,
    nota: "",
    entradas_detalhadas: [],
    saidas_detalhadas: [],
    entradas_base: 0,
    saidas_base: 0,
    sensitive_fields: {
      saldo_anterior: false,
      entradas: false,
      saidas: false,
      saldo_atual: false
    }
  });

  useEffect(() => {
    if (account) {
      const entradasDetalhadas = account.entradas_detalhadas || [];
      const saidasDetalhadas = account.saidas_detalhadas || [];
      
      // Calculate base values: if there are no detailed transactions, use the current values as base
      // Otherwise, use the stored base values
      const entradasBase = account.entradas_base !== undefined 
        ? account.entradas_base 
        : (entradasDetalhadas.length === 0 ? account.entradas : 0);
      
      const saidasBase = account.saidas_base !== undefined 
        ? account.saidas_base 
        : (saidasDetalhadas.length === 0 ? account.saidas : 0);
      
      setFormData({
        ...account,
        entradas_detalhadas: entradasDetalhadas,
        saidas_detalhadas: saidasDetalhadas,
        entradas_base: entradasBase,
        saidas_base: saidasBase,
        sensitive_fields: account.sensitive_fields || {
          saldo_anterior: false,
          entradas: false,
          saidas: false,
          saldo_atual: false
        }
      });
    } else {
      setFormData({
        name: "",
        saldo_anterior: 0,
        entradas: 0,
        saidas: 0,
        taxas: 0,
        saldo_atual: 0,
        nota: "",
        entradas_detalhadas: [],
        saidas_detalhadas: [],
        entradas_base: 0,
        saidas_base: 0,
        sensitive_fields: {
          saldo_anterior: false,
          entradas: false,
          saidas: false,
          saldo_atual: false
        }
      });
    }
  }, [account, isOpen]);

  const handleChange = (field: keyof AccountData, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-sum transactions if detailed arrays change
      if (field === 'entradas_detalhadas') {
        const transactions = value as Transaction[];
        const totalDetalhadas = transactions.reduce((acc, curr) => acc + curr.value, 0);
        const baseValue = newData.entradas_base || 0;
        newData.entradas = baseValue + totalDetalhadas; // SUM base + detailed
      }
      
      if (field === 'saidas_detalhadas') {
        const transactions = value as Transaction[];
        const totalDetalhadas = transactions.reduce((acc, curr) => acc + curr.value, 0);
        const baseValue = newData.saidas_base || 0;
        newData.saidas = baseValue + totalDetalhadas; // SUM base + detailed
      }

      // Auto-calculate saldo_atual
      if (field !== 'saldo_atual') {
        const anterior = field === 'saldo_anterior' ? Number(value) : newData.saldo_anterior;
        const entradas = newData.entradas;
        const saidas = newData.saidas;
        const taxas = newData.taxas || 0;
        
        // Logic: Saldo Atual = Saldo Anterior + Entradas - Saídas - Taxas
        newData.saldo_atual = anterior + entradas - saidas - taxas;
      }
      
      return newData;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const toggleSensitive = (field: keyof NonNullable<AccountData['sensitive_fields']>) => {
    setFormData(prev => ({
      ...prev,
      sensitive_fields: {
        ...prev.sensitive_fields,
        [field]: !prev.sensitive_fields?.[field]
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{account ? "Editar Conta" : "Nova Conta"}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="geral" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="lancamentos">Lançamentos do Dia</TabsTrigger>
          </TabsList>
          
          <TabsContent value="geral">
            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="saldo_anterior" className="text-right">
                  Saldo Ant.
                </Label>
                <div className="col-span-3 flex gap-2 items-center">
                  <Input
                    id="saldo_anterior"
                    type="number"
                    step="0.01"
                    value={formData.saldo_anterior}
                    onChange={(e) => handleChange("saldo_anterior", Number(e.target.value))}
                    className="flex-1"
                  />
                  <div className="flex items-center space-x-2" title="Ocultar este valor no modo privado">
                    <Checkbox 
                      id="sens_saldo_anterior" 
                      checked={formData.sensitive_fields?.saldo_anterior}
                      onCheckedChange={() => toggleSensitive('saldo_anterior')}
                    />
                    <Label htmlFor="sens_saldo_anterior" className="text-xs text-muted-foreground cursor-pointer">Ocultar</Label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="entradas" className="text-right text-emerald-600">
                  Entradas
                </Label>
                <div className="col-span-3 flex gap-2 items-center">
                  <Input
                    id="entradas"
                    type="number"
                    step="0.01"
                    value={formData.entradas}
                    onChange={(e) => handleChange("entradas", Number(e.target.value))}
                    className="flex-1 border-emerald-200 focus-visible:ring-emerald-500"
                    readOnly={formData.entradas_detalhadas && formData.entradas_detalhadas.length > 0}
                  />
                  <div className="flex items-center space-x-2" title="Ocultar este valor no modo privado">
                    <Checkbox 
                      id="sens_entradas" 
                      checked={formData.sensitive_fields?.entradas}
                      onCheckedChange={() => toggleSensitive('entradas')}
                    />
                    <Label htmlFor="sens_entradas" className="text-xs text-muted-foreground cursor-pointer">Ocultar</Label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="saidas" className="text-right text-rose-600">
                  Saídas
                </Label>
                <div className="col-span-3 flex gap-2 items-center">
                  <Input
                    id="saidas"
                    type="number"
                    step="0.01"
                    value={formData.saidas}
                    onChange={(e) => handleChange("saidas", Number(e.target.value))}
                    className="flex-1 border-rose-200 focus-visible:ring-rose-500"
                    readOnly={formData.saidas_detalhadas && formData.saidas_detalhadas.length > 0}
                  />
                  <div className="flex items-center space-x-2" title="Ocultar este valor no modo privado">
                    <Checkbox 
                      id="sens_saidas" 
                      checked={formData.sensitive_fields?.saidas}
                      onCheckedChange={() => toggleSensitive('saidas')}
                    />
                    <Label htmlFor="sens_saidas" className="text-xs text-muted-foreground cursor-pointer">Ocultar</Label>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="taxas" className="text-right text-amber-600">
                  Taxas
                </Label>
                <div className="col-span-3 flex gap-2 items-center">
                  <Input
                    id="taxas"
                    type="number"
                    step="0.01"
                    value={formData.taxas || 0}
                    onChange={(e) => handleChange("taxas", Number(e.target.value))}
                    className="flex-1 border-amber-200 focus-visible:ring-amber-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="saldo_atual" className="text-right font-bold">
                  Saldo Atual
                </Label>
                <div className="col-span-3 relative flex gap-2 items-center">
                  <div className="flex-1 relative">
                    <Input
                      id="saldo_atual"
                      type="number"
                      step="0.01"
                      value={formData.saldo_atual}
                      onChange={(e) => handleChange("saldo_atual", Number(e.target.value))}
                      className="font-bold border-primary/50 focus-visible:ring-primary w-full"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 absolute right-1 -bottom-5">
                      *Editável manualmente
                    </p>
                  </div>
                  <div className="flex items-center space-x-2" title="Ocultar este valor no modo privado">
                    <Checkbox 
                      id="sens_saldo_atual" 
                      checked={formData.sensitive_fields?.saldo_atual}
                      onCheckedChange={() => toggleSensitive('saldo_atual')}
                    />
                    <Label htmlFor="sens_saldo_atual" className="text-xs text-muted-foreground cursor-pointer">Ocultar</Label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4 mt-4">
                <Label htmlFor="nota" className="text-right text-slate-500">
                  Nota
                </Label>
                <Input
                  id="nota"
                  value={formData.nota || ""}
                  onChange={(e) => handleChange("nota", e.target.value)}
                  className="col-span-3"
                />
              </div>

              <DialogFooter>
                {onDelete && (
                  <Button type="button" variant="destructive" onClick={onDelete}>
                    Excluir
                  </Button>
                )}
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="lancamentos" className="space-y-4 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2 text-emerald-600">Entradas Detalhadas</h3>
                <TransactionList 
                  transactions={formData.entradas_detalhadas || []}
                  onChange={(transactions) => handleChange('entradas_detalhadas', transactions)}
                  type="entrada"
                />
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2 text-rose-600">Saídas Detalhadas</h3>
                <TransactionList 
                  transactions={formData.saidas_detalhadas || []}
                  onChange={(transactions) => handleChange('saidas_detalhadas', transactions)}
                  type="saida"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
