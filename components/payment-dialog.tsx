'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface Receivable {
  id: string
  customer: string
  saleDate: string
  dueDate: string
  installment: string
  amount: number
  status: 'pending' | 'overdue'
}

interface PaymentDialogProps {
  receivable: Receivable | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PaymentDialog({ receivable, open, onOpenChange }: PaymentDialogProps) {
  const [paymentOption, setPaymentOption] = useState('single')

  if (!receivable) return null

  const handleConfirm = () => {
    console.log('[v0] Payment confirmed:', { receivable, paymentOption })
    onOpenChange(false)
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Parcela</p>
              <p className="font-medium">{receivable.installment}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor</p>
              <p className="font-medium">R$ {receivable.amount.toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Opção de Pagamento</Label>
            <RadioGroup value={paymentOption} onValueChange={setPaymentOption}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="font-normal">
                  Pagar apenas esta parcela
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multiple" id="multiple" />
                <Label htmlFor="multiple" className="font-normal">
                  Pagar múltiplas parcelas
                </Label>
              </div>
            </RadioGroup>
          </div>

          {paymentOption === 'multiple' && (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm text-muted-foreground">
                Esta funcionalidade permitirá selecionar múltiplas parcelas para pagamento em lote.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Confirmar Pagamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
