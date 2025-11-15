'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PaymentDialog } from '@/components/payment-dialog'

interface Receivable {
  id: string
  customer: string
  saleDate: string
  dueDate: string
  installment: string
  amount: number
  status: 'pending' | 'overdue'
}

export function ReceivablesView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)

  const [receivables] = useState<Receivable[]>([
    { id: '1', customer: 'João Santos', saleDate: '2024-01-14', dueDate: '2024-02-14', installment: '1/3', amount: 126.67, status: 'pending' },
    { id: '2', customer: 'Carla Souza', saleDate: '2024-01-10', dueDate: '2024-01-10', installment: '2/4', amount: 150.00, status: 'overdue' },
    { id: '3', customer: 'Lucas Ferreira', saleDate: '2024-01-08', dueDate: '2024-02-08', installment: '1/2', amount: 200.00, status: 'pending' },
    { id: '5', customer: 'Marina Costa', saleDate: '2023-12-20', dueDate: '2024-01-05', installment: '3/3', amount: 100.00, status: 'overdue' },
  ])

  const filteredReceivables = receivables.filter(r =>
    r.customer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: Receivable['status']) => {
    const variants = {
      pending: { label: 'Pendente', icon: null, className: 'bg-amber-500 hover:bg-amber-600 text-white' },
      overdue: { label: 'Vencido', icon: AlertCircle, className: 'bg-destructive hover:bg-destructive/90' },
    }
    const config = variants[status]
    return (
      <Badge className={config.className}>
        {config.icon && <config.icon className="mr-1 h-3 w-3" />}
        {config.label}
      </Badge>
    )
  }

  const handleMarkAsPaid = (receivable: Receivable) => {
    setSelectedReceivable(receivable)
    setIsPaymentDialogOpen(true)
  }

  const totalPending = receivables
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.amount, 0)

  const totalOverdue = receivables
    .filter(r => r.status === 'overdue')
    .reduce((sum, r) => sum + r.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contas a Receber</h1>
        <p className="text-muted-foreground">Gerencie os recebimentos de vendas parceladas</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <p className="text-sm font-medium text-muted-foreground">Total Pendente</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">R$ {totalPending.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <p className="text-sm font-medium text-muted-foreground">Total Vencido</p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">R$ {totalOverdue.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Parcela</th>
                  <th className="pb-3">Vencimento</th>
                  <th className="pb-3 text-right pr-4">Valor</th>
                  <th className="pb-3 pl-4">Status</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredReceivables.map((receivable) => (
                  <tr key={receivable.id} className="border-b last:border-0">
                    <td className="py-4 font-medium">{receivable.customer}</td>
                    <td className="py-4 text-muted-foreground">{receivable.installment}</td>
                    <td className="py-4 text-muted-foreground">{receivable.dueDate}</td>
                    <td className="py-4 text-right font-medium pr-4">R$ {receivable.amount.toFixed(2)}</td>
                    <td className="py-4 pl-4">{getStatusBadge(receivable.status)}</td>
                    <td className="py-4">
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsPaid(receivable)}
                        >
                          Marcar como Pago
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <PaymentDialog
        receivable={selectedReceivable}
        open={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
      />
    </div>
  )
}
