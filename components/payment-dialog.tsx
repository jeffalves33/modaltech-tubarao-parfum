// components/payment-dialog.tsx
'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { supabase } from '@/lib/supabaseClient'

type ReceivableStatus = 'open' | 'partial' | 'overdue' | 'paid'

interface Receivable {
  id: string
  customerId: string | null
  saleId: string | null
  customer: string
  saleDate: string | null
  dueDate: string
  installment: string
  originalAmount: number
  outstanding: number
  status: ReceivableStatus
}

interface PaymentDialogProps {
  receivable: Receivable | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onPaid?: () => void
}

export function PaymentDialog({ receivable, open, onOpenChange, onPaid, }: PaymentDialogProps) {
  const [paymentMode, setPaymentMode] = useState<'total' | 'partial'>('total')
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && receivable) {
      setPaymentMode('total')
      setAmount(receivable.outstanding.toFixed(2))
      setPaymentDate(new Date().toISOString().slice(0, 10))
      setError(null)
    }
  }, [open, receivable])

  if (!receivable) return null

  const handleConfirm = async () => {
    if (!receivable) return

    if (receivable.outstanding <= 0) {
      onOpenChange(false)
      return
    }

    // valor digitado (ou total em aberto, se modo "total")
    const valueStr = paymentMode === 'total' ? receivable.outstanding.toFixed(2) : amount
    const normalized = valueStr.trim().replace(',', '.')
    const value = Number(normalized)

    if (!Number.isFinite(value) || value <= 0) {
      setError('Informe um valor de pagamento válido.')
      return
    }

    // não deixar pagar mais que o saldo em aberto desta parcela
    if (value - receivable.outstanding > 0.01) {
      setError('O valor pago não pode ser maior que o saldo em aberto desta parcela.')
      return
    }

    const dateToUse = paymentDate && paymentDate.length > 0 ? paymentDate : new Date().toISOString().slice(0, 10)

    setLoading(true)
    setError(null)

    try {
      // 1) cria um registro em payments para ESTA parcela
      const { error: payError } = await supabase.from('payments').insert({
        sale_id: receivable.saleId,
        receivable_id: receivable.id,
        customer_id: receivable.customerId,
        amount: value,
        method: 'cash',
        payment_date: dateToUse,
      })

      if (payError) throw payError

      // 2) atualiza status da parcela com base no novo saldo
      const newOutstanding = Math.max(receivable.outstanding - value, 0)
      const newStatus: ReceivableStatus = newOutstanding <= 0 ? 'paid' : 'partial'

      const { error: recError } = await supabase
        .from('receivables')
        .update({ status: newStatus })
        .eq('id', receivable.id)

      if (recError) throw recError

      onPaid?.()
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao registrar pagamento', err)
      setError('Erro ao registrar pagamento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

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
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setError(null)
        }
        onOpenChange(isOpen)
      }}
    >
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Confirmar Pagamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Cliente</p>
            <p className="font-medium">{receivable.customer}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Parcela</p>
              <p className="font-medium">{receivable.installment}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Vencimento</p>
              <p className="font-medium">{formatDate(receivable.dueDate)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Valor original</p>
              <p className="font-medium">
                {formatCurrency(receivable.originalAmount)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Em aberto</p>
              <p className="font-medium">
                {formatCurrency(receivable.outstanding)}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Opção de pagamento</Label>
            <RadioGroup
              value={paymentMode}
              onValueChange={(v) => {
                const mode = v as 'total' | 'partial'
                setPaymentMode(mode)
                if (mode === 'total') {
                  setAmount(receivable.outstanding.toFixed(2))
                } else {
                  setAmount('')
                }
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="total" id="pay-total" />
                <Label htmlFor="pay-total" className="font-normal">
                  Pagar valor total em aberto
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partial" id="pay-partial" />
                <Label htmlFor="pay-partial" className="font-normal">
                  Registrar pagamento parcial
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="payment-amount">
                Valor a pagar
              </Label>
              <Input
                id="payment-amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                disabled={paymentMode === 'total'}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payment-date">
                Data do pagamento
              </Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Registrando...' : 'Confirmar Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
