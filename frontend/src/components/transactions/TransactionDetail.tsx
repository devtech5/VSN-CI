'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  transaction: any;
  open: boolean;
  onClose: () => void;
}

export default function TransactionDetail({ transaction, open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Détail transaction</DialogTitle>
          <DialogDescription>
            Référence : {transaction?.reference ?? '—'}
          </DialogDescription>
        </DialogHeader>
        <pre className="text-xs overflow-auto max-h-96 bg-muted p-3 rounded">
          {JSON.stringify(transaction, null, 2)}
        </pre>
      </DialogContent>
    </Dialog>
  );
}
