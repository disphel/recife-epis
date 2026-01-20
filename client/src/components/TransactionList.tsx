import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { useState } from "react";

interface Transaction {
  id: string;
  description: string;
  value: number;
}

interface TransactionListProps {
  transactions: Transaction[];
  onChange: (transactions: Transaction[]) => void;
  type: "entrada" | "saida";
}

export function TransactionList({ transactions, onChange, type }: TransactionListProps) {
  const [newDescription, setNewDescription] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    if (!newDescription || !newValue) return;

    const newTransaction: Transaction = {
      id: nanoid(),
      description: newDescription,
      value: Number(newValue)
    };

    onChange([...transactions, newTransaction]);
    setNewDescription("");
    setNewValue("");
  };

  const handleDelete = (id: string) => {
    onChange(transactions.filter(t => t.id !== id));
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const total = transactions.reduce((acc, curr) => acc + curr.value, 0);
  const colorClass = type === "entrada" ? "text-emerald-600" : "text-rose-600";
  const bgClass = type === "entrada" ? "bg-emerald-50" : "bg-rose-50";

  return (
    <div className={`space-y-3 p-4 rounded-lg border ${bgClass}`}>
      <div className="flex items-center justify-between">
        <h4 className={`font-semibold ${colorClass}`}>
          Lançamentos de {type === "entrada" ? "Entrada" : "Saída"}
        </h4>
        <span className={`font-bold ${colorClass}`}>
          Total: {formatCurrency(total)}
        </span>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Descrição (ex: Venda A)"
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          className="flex-1 bg-white"
        />
        <Input
          type="number"
          step="0.01"
          placeholder="Valor"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          className="w-24 bg-white"
        />
        <Button onClick={handleAdd} size="icon" className={type === "entrada" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {transactions.length > 0 && (
        <div className="bg-white rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="h-8">
                <TableHead className="h-8 text-xs">Descrição</TableHead>
                <TableHead className="h-8 text-xs text-right">Valor</TableHead>
                <TableHead className="h-8 w-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((t) => (
                <TableRow key={t.id} className="h-8">
                  <TableCell className="py-1 text-sm">{t.description}</TableCell>
                  <TableCell className="py-1 text-sm text-right font-mono">
                    {formatCurrency(t.value)}
                  </TableCell>
                  <TableCell className="py-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-rose-600"
                      onClick={() => handleDelete(t.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
