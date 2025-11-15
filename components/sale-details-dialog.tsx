'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface Sale {
  id: string
  date: string
  customer: string
  product: string
  quantity: number
  totalValue: number
  paymentType: 'cash' | 'credit'
  installments?: number
  paidAmount: number
  status: 'paid' | 'pending' | 'partial'
}

interface SaleDetailsDialogProps {
  sale: Sale | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SaleDetailsDialog({ sale, open, onOpenChange }: SaleDetailsDialogProps) {
  if (!sale) return null

  const getStatusBadge = (status: Sale['status']) => {
    const variants = {
      paid: { label: 'Pago', className: 'bg-emerald-500' },
      pending: { label: 'Pendente', className: 'bg-amber-500 text-white' },
      partial: { label: 'Parcial', className: 'border-amber-500 text-amber-700' },
    }
    const config = variants[status]
    return <Badge className={config.className}>{config.label}</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Detalhes da Venda</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Data</p>
              <p className="font-medium">{sale.date}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-1">{getStatusBadge(sale.status)}</div>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Cliente</p>
            <p className="font-medium">{sale.customer}</p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Produto</p>
            <p className="font-medium">{sale.product}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Quantidade</p>
              <p className="font-medium">{sale.quantity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="font-medium">R$ {sale.totalValue.toFixed(2)}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Forma de Pagamento</p>
            <p className="font-medium">
              {sale.paymentType === 'cash' ? 'À vista' : `Parcelado em ${sale.installments}x`}
            </p>
          </div>

          {sale.paymentType === 'credit' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Valor Pago</p>
                <p className="font-medium text-emerald-600">R$ {sale.paidAmount.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Pendente</p>
                <p className="font-medium text-amber-600">
                  R$ {(sale.totalValue - sale.paidAmount).toFixed(2)}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
