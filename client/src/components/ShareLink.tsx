import { useState } from 'react';
import { Copy, Share2, MessageCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';

interface ShareLinkProps {
  url?: string;
  title?: string;
  message?: string;
}

export function ShareLink({ 
  url = window.location.origin, 
  title = 'Recife EPIs - Controle Financeiro',
  message = 'Acesse o sistema de controle financeiro:'
}: ShareLinkProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar link');
      console.error('Failed to copy:', err);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${message}\n${url}`);
    const whatsappUrl = `https://wa.me/?text=${text}`;
    window.open(whatsappUrl, '_blank');
    setOpen(false);
  };

  const handleShareWhatsAppDirect = (phone?: string) => {
    const text = encodeURIComponent(`${message}\n${url}`);
    const whatsappUrl = phone 
      ? `https://wa.me/${phone}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(whatsappUrl, '_blank');
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <Share2 className="h-4 w-4" />
          Compartilhar Acesso
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="center">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-sm mb-2">Compartilhar Link do Sistema</h4>
            <p className="text-xs text-muted-foreground mb-3">
              Envie este link para permitir que outros usuários acessem o sistema
            </p>
          </div>

          {/* Link Display */}
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <input
              type="text"
              value={url}
              readOnly
              className="flex-1 bg-transparent text-xs outline-none"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyLink}
              className="h-8 w-8 p-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              onClick={handleCopyLink}
              variant="outline"
              className="w-full justify-start gap-2"
              size="sm"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Link Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar Link
                </>
              )}
            </Button>

            <Button
              onClick={handleShareWhatsApp}
              variant="outline"
              className="w-full justify-start gap-2 text-green-600 hover:text-green-700 hover:bg-green-50"
              size="sm"
            >
              <MessageCircle className="h-4 w-4" />
              Compartilhar via WhatsApp
            </Button>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Dica:</strong> Após compartilhar o link, você pode criar um usuário para a pessoa em <strong>Configurações → Usuários</strong>
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
