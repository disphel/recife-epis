import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FinancialCardProps {
  title: string;
  value: number;
  type?: "default" | "success" | "danger" | "warning";
  trend?: number;
  icon?: React.ElementType;
  expandable?: boolean;
  expandedContent?: React.ReactNode;
  onExpand?: (expanded: boolean) => void;
}

export function FinancialCard({ title, value, type = "default", trend, icon: Icon = DollarSign, expandable = false, expandedContent, onExpand }: FinancialCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(val);
  };

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "danger":
        return "text-rose-600 bg-rose-50 border-rose-100";
      case "warning":
        return "text-amber-600 bg-amber-50 border-amber-100";
      default:
        return "text-primary bg-primary/5 border-primary/10";
    }
  };

  return (
    <Card className={cn("border shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative", isExpanded && "z-50")}>
      <div className={cn("absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 transition-transform group-hover:scale-110", 
        type === "success" ? "bg-emerald-500" : 
        type === "danger" ? "bg-rose-500" : 
        type === "warning" ? "bg-amber-500" : "bg-primary"
      )} />
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {expandable && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                const newExpanded = !isExpanded;
                setIsExpanded(newExpanded);
                onExpand?.(newExpanded);
              }}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
          <div className={cn("p-2 rounded-full", getTypeStyles())}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tracking-tight text-slate-900">
          {formatCurrency(value)}
        </div>
        {trend !== undefined && (
          <p className={cn("text-xs flex items-center mt-1 font-medium", 
            trend > 0 ? "text-emerald-600" : trend < 0 ? "text-rose-600" : "text-slate-500"
          )}>
            {trend > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
            {Math.abs(trend)}% em relação ao período anterior
          </p>
        )}
        {expandable && isExpanded && expandedContent && (
          <div className="mt-4 pt-4 border-t border-slate-200 animate-in slide-in-from-top-2">
            {expandedContent}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
