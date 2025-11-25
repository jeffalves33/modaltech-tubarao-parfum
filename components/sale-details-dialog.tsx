// components/sale-details-dialog.tsx
'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabaseClient'

interface Sale {
  id: string
  date: string
  customer: string
  productsSummary: string
  totalValue: number
  paymentType: 'cash' | 'credit'
  installments?: number
  paidAmount: number
  status: 'paid' | 'pending' | 'partial' | 'canceled'
}

interface SaleDetailsDialogProps {
  sale: Sale | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SaleItemDetail {
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

interface ReceivableDetail {
  installmentNumber: number
  amount: number
  dueDate: string
  status: string
}

interface PaymentDetail {
  amount: number
  paymentDate: string
  method: string | null
}

export function SaleDetailsDialog({ sale, open, onOpenChange }: SaleDetailsDialogProps) {
  const [items, setItems] = useState<SaleItemDetail[]>([])
  const [receivables, setReceivables] = useState<ReceivableDetail[]>([])
  const [payments, setPayments] = useState<PaymentDetail[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !sale) return

    let cancelled = false

    async function loadDetails() {
      setLoading(true)
      setError(null)
      try {
        const [itemsRes, recsRes, paysRes] = await Promise.all([
          supabase
            .from('sale_items')
            .select('quantity, unit_price, subtotal, products(name)')
            .eq('sale_id', sale.id),
          supabase
            .from('receivables')
            .select('installment_number, amount, due_date, status')
            .eq('sale_id', sale.id),
          supabase
            .from('payments')
            .select('amount, payment_date, method')
            .eq('sale_id', sale.id),
        ])

        if (itemsRes.error) throw itemsRes.error
        if (recsRes.error) throw recsRes.error
        if (paysRes.error) throw paysRes.error

        if (cancelled) return

        const itemsData = (itemsRes.data ?? []) as any[]
        const recsData = (recsRes.data ?? []) as any[]
        const paysData = (paysRes.data ?? []) as any[]

        const mappedItems: SaleItemDetail[] = itemsData.map((it) => ({
          productName: it.products?.name ?? 'Produto',
          quantity: it.quantity,
          unitPrice: Number(it.unit_price ?? 0),
          subtotal: Number(it.subtotal ?? 0),
        }))

        const mappedRecs: ReceivableDetail[] = recsData
          .sort(
            (a, b) => a.installment_number - b.installment_number,
          )
          .map((r) => ({
            installmentNumber: r.installment_number,
            amount: Number(r.amount ?? 0),
            dueDate: r.due_date,
            status: r.status,
          }))

        const mappedPays: PaymentDetail[] = paysData.map((p) => ({
          amount: Number(p.amount ?? 0),
          paymentDate: p.payment_date,
          method: p.method,
        }))

        setItems(mappedItems)
        setReceivables(mappedRecs)
        setPayments(mappedPays)
      } catch (err: any) {
        console.error('Erro ao carregar detalhes da venda', err)
        if (!cancelled) setError('Erro ao carregar detalhes da venda.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDetails()

    return () => {
      cancelled = true
    }
  }, [open, sale?.id])

  if (!sale) return null

  const getStatusBadge = (status: Sale['status']) => {
    const variants = {
      paid: { label: 'Pago', className: 'bg-emerald-500 text-white' },
      pending: { label: 'Pendente', className: 'bg-amber-500 text-white' },
      partial: { label: 'Parcial', className: 'border-amber-500 text-amber-700' },
      canceled: {
        label: 'Cancelado',
        className: 'border-destructive text-destructive',
      },
    }
    const config = variants[status]
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const pendingAmount = Math.max(
    sale.totalValue - (sale.paidAmount ?? 0),
    0,
  )

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0)

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('pt-BR')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Venda</DialogTitle>
        </DialogHeader>

        {loading && (
          <p className="text-sm text-muted-foreground mb-3">
            Carregando detalhes da venda...
          </p>
        )}
        {error && (
          <p className="text-sm text-destructive mb-3">
            {error}
          </p>
        )}

        <div className="space-y-6">
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
            <p className="text-sm text-muted-foreground">Resumo dos Produtos</p>
            <p className="font-medium">{sale.productsSummary}</p>
          </div>

          {items.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Itens da venda
              </p>
              <div className="border rounded-lg divide-y">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">{item.quantity}x {item.productName}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)}</p>
                    </div>
                    <p className="font-medium">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="font-medium">
                {formatCurrency(sale.totalValue)}
              </p>
            </div>
            {sale.paymentType === 'credit' && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Valor Pago
                  </p>
                  <p className="font-medium text-emerald-600">
                    {formatCurrency(sale.paidAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Valor Pendente
                  </p>
                  <p className="font-medium text-amber-600">
                    {formatCurrency(pendingAmount)}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Forma de Pagamento:
            </p>
            <p className="font-medium">
              {sale.paymentType === 'cash'
                ? 'À vista'
                : `parcelado${sale.installments ? ` em ${sale.installments}x` : ''}`}
            </p>
          </div>

          {receivables.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Parcelas (a receber)
              </p>
              <div className="border rounded-lg divide-y">
                {receivables.map((r, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        Parcela {r.installmentNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Vencimento: {formatDate(r.dueDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(r.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Status: {r.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {payments.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Pagamentos registrados
              </p>
              <div className="border rounded-lg divide-y">
                {payments.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {formatCurrency(p.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(p.paymentDate)}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {p.method || '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
