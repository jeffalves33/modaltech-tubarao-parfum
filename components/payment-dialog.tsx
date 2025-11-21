// components/payment-dialog.tsx
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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

export function PaymentDialog({
  receivable,
  open,
  onOpenChange,
  onPaid,
}: PaymentDialogProps) {
  const [paymentOption, setPaymentOption] = useState<'single' | 'multiple'>(
    'single',
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!receivable) return null

  const handleConfirm = async () => {
    if (receivable.outstanding <= 0) {
      onOpenChange(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError

      const userId = user?.id ?? null
      const today = new Date().toISOString().slice(0, 10)
      const amountToPay = receivable.outstanding

      // 1) registra pagamento nessa parcela
      const { error: payError } = await supabase.from('payments').insert({
        receivable_id: receivable.id,
        sale_id: receivable.saleId,
        customer_id: receivable.customerId,
        amount: amountToPay,
        method: 'transfer',
        payment_date: today,
      })

      if (payError) throw payError

      // 2) marca parcela como paga
      const { error: recError } = await supabase
        .from('receivables')
        .update({ status: 'paid' })
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Label>Opção de Pagamento</Label>
            <RadioGroup
              value={paymentOption}
              onValueChange={(v) => setPaymentOption(v as 'single' | 'multiple')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="font-normal">
                  Pagar esta parcela por completo
                </Label>
              </div>
              {/*<div className="flex items-center space-x-2 opacity-60">
                <RadioGroupItem value="multiple" id="multiple" disabled />
                <Label htmlFor="multiple" className="font-normal">
                  Pagar múltiplas parcelas (em breve)
                </Label>
              </div>*/}
            </RadioGroup>
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
