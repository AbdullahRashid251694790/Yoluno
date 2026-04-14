/**
 * Send Recording Link Dialog
 *
 * Generates a public invite URL that can be shared with family members
 * so they can record voice messages without a Yoluno account.
 */

import { useState } from 'react';
import { apiClient } from '@/integrations/api/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Copy, Check, Send } from 'lucide-react';
import { toast } from 'sonner';

interface SendRecordingLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SendRecordingLinkDialog({ open, onOpenChange }: SendRecordingLinkDialogProps) {
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.post<{ id: string; expires_at: string }>(
        '/voice-vault/invites'
      );
      const url = `${window.location.origin}/record-for-family/${data.id}`;
      setLink(url);
    } catch (err: any) {
      toast.error('Failed to generate link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy — please select and copy manually');
    }
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setLink(null);
      setCopied(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-gold" />
            Send Recording Link
          </DialogTitle>
          <DialogDescription>
            Share this link with grandparents, aunts, uncles, or anyone special. They can record a
            voice message from their phone — no Yoluno account needed.
          </DialogDescription>
        </DialogHeader>

        {!link ? (
          <div className="py-6 flex flex-col items-center gap-4">
            <p className="text-center text-muted-foreground text-body-sm">
              Generate a unique link that expires in 7 days. They can record as many messages as
              they like.
            </p>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-gold text-white hover:bg-gold/90 rounded-full px-8 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Generate Link
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-gold/10 border border-gold/30 p-3 text-caption text-foreground">
              Link created. It expires in 7 days — unlimited recordings until then.
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={link}
                className="flex-1 font-mono text-caption bg-muted/30"
                onFocus={(e) => e.currentTarget.select()}
              />
              <Button
                onClick={handleCopy}
                className="gap-2 bg-gold text-white hover:bg-gold/90 rounded-lg shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <p className="text-caption text-muted-foreground">
              Share this link via text, email, WhatsApp — any way you like.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
