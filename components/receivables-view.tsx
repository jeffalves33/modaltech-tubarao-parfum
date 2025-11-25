// components/receivables-view.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { PaymentDialog } from '@/components/payment-dialog'
import { ReceivableDetailsDialog } from '@/components/receivable-details-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

export function ReceivablesView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedReceivable, setSelectedReceivable] =
    useState<Receivable | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  const [filterStatus, setFilterStatus] =
    useState<'all' | ReceivableStatus>('all')
  const [filterDue, setFilterDue] = useState<
    'all' | 'overdue' | 'this-month' | 'next-month'
  >('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadReceivables = async () => {
    setLoading(true)
    setError(null)

    try {
      const [recRes, custRes, salesRes, payRes] = await Promise.all([
        supabase
          .from('receivables')
          .select(
            'id, sale_id, customer_id, amount, due_date, installment_number, status',
          ),
        supabase.from('customers').select('id, name'),
        supabase.from('sales').select('id, sale_date'),
        supabase.from('payments').select('receivable_id, amount'),
      ])

      if (recRes.error) throw recRes.error
      if (custRes.error) throw custRes.error
      if (salesRes.error) throw salesRes.error
      if (payRes.error) throw payRes.error

      const recData = (recRes.data ?? []) as {
        id: string
        sale_id: string | null
        customer_id: string | null
        amount: number | string | null
        due_date: string
        installment_number: number
        status: string
      }[]

      const customers = (custRes.data ?? []) as { id: string; name: string }[]
      const sales = (salesRes.data ?? []) as { id: string; sale_date: string }[]
      const payments = (payRes.data ?? []) as {
        receivable_id: string | null
        amount: number | string | null
      }[]

      const customerMap = customers.reduce<Record<string, string>>((acc, c) => {
        acc[c.id] = c.name
        return acc
      }, {})

      const saleDateMap = sales.reduce<Record<string, string>>((acc, s) => {
        acc[s.id] = s.sale_date
        return acc
      }, {})

      const paymentsByReceivable: Record<string, number> = {}
      for (const p of payments) {
        if (!p.receivable_id) continue
        paymentsByReceivable[p.receivable_id] =
          (paymentsByReceivable[p.receivable_id] ?? 0) +
          Number(p.amount ?? 0)
      }

      const installmentsBySale: Record<string, number> = {}
      for (const r of recData) {
        if (!r.sale_id) continue
        const n = r.installment_number
        installmentsBySale[r.sale_id] = Math.max(
          installmentsBySale[r.sale_id] ?? 0,
          n,
        )
      }

      const todayStr = new Date().toISOString().slice(0, 10)

      const mapped: Receivable[] = recData.map((r) => {
        const originalAmount = Number(r.amount ?? 0)
        const paid = paymentsByReceivable[r.id] ?? 0
        const outstanding = Math.max(originalAmount - paid, 0)

        const totalInstallments = r.sale_id
          ? installmentsBySale[r.sale_id] ?? r.installment_number
          : r.installment_number

        const installmentLabel =
          totalInstallments > 0
            ? `${r.installment_number}/${totalInstallments}`
            : `${r.installment_number}`

        let status: ReceivableStatus
        const isOverdue = r.due_date < todayStr && outstanding > 0

        if (outstanding <= 0) {
          status = 'paid'
        } else if (isOverdue) {
          status = 'overdue'
        } else if (paid > 0) {
          status = 'partial'
        } else {
          status = 'open'
        }

        return {
          id: r.id,
          customerId: r.customer_id,
          saleId: r.sale_id,
          customer: r.customer_id
            ? customerMap[r.customer_id] ?? 'Cliente não identificado'
            : 'Cliente não identificado',
          saleDate: r.sale_id ? saleDateMap[r.sale_id] ?? null : null,
          dueDate: r.due_date,
          installment: installmentLabel,
          originalAmount,
          outstanding,
          status,
        }
      })

      setReceivables(mapped)
    } catch (err: any) {
      console.error('Erro ao carregar contas a receber', err)
      setError('Erro ao carregar contas a receber. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReceivables()
  }, [])

  const totalPending = receivables
    .filter(
      (r) =>
        r.status === 'open' ||
        r.status === 'partial' ||
        r.status === 'overdue',
    )
    .reduce((sum, r) => sum + r.outstanding, 0)

  const totalOverdue = receivables
    .filter((r) => r.status === 'overdue')
    .reduce((sum, r) => sum + r.outstanding, 0)

  let filteredReceivables = receivables.filter((r) =>
    r.customer.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (filterStatus !== 'all') {
    filteredReceivables = filteredReceivables.filter(
      (r) => r.status === filterStatus,
    )
  }

  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const todayStr = now.toISOString().slice(0, 10)

  if (filterDue === 'overdue') {
    filteredReceivables = filteredReceivables.filter(
      (r) => r.dueDate < todayStr && r.outstanding > 0,
    )
  } else if (filterDue === 'this-month') {
    filteredReceivables = filteredReceivables.filter((r) => {
      const d = new Date(r.dueDate)
      return (
        !Number.isNaN(d.getTime()) &&
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear
      )
    })
  } else if (filterDue === 'next-month') {
    const nextMonthDate = new Date(currentYear, currentMonth + 1, 1)
    const nextMonth = nextMonthDate.getMonth()
    const nextYear = nextMonthDate.getFullYear()

    filteredReceivables = filteredReceivables.filter((r) => {
      const d = new Date(r.dueDate)
      return (
        !Number.isNaN(d.getTime()) &&
        d.getMonth() === nextMonth &&
        d.getFullYear() === nextYear
      )
    })
  }

  const totalPages = Math.max(
    Math.ceil(filteredReceivables.length / itemsPerPage),
    1,
  )
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedReceivables = filteredReceivables.slice(startIndex, endIndex)

  const getStatusBadge = (status: ReceivableStatus) => {
    const variants: Record<ReceivableStatus, { label: string; className: string }> = {
      open: {
        label: 'Em aberto',
        className: 'bg-amber-500 hover:bg-amber-600 text-white',
      },
      partial: {
        label: 'Parcial',
        className: 'border-amber-500 text-amber-700',
      },
      overdue: {
        label: 'Vencido',
        className: 'bg-destructive hover:bg-destructive/90 text-white',
      },
      paid: {
        label: 'Pago',
        className: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      },
    }

    const config = variants[status]
    return (
      <Badge className={config.className}>
        {status === 'overdue' && <AlertCircle className="mr-1 h-3 w-3" />}
        {config.label}
      </Badge>
    )
  }

  const handleMarkAsPaid = (receivable: Receivable) => {
    if (receivable.outstanding <= 0) return
    setSelectedReceivable(receivable)
    setIsPaymentDialogOpen(true)
  }

  const handleViewDetails = (receivable: Receivable) => {
    setSelectedReceivable(receivable)
    setIsDetailsOpen(true)
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value || 0)

  const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('pt-BR')
}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contas a Receber</h1>
        <p className="text-muted-foreground">
          Gerencie os recebimentos de vendas parceladas e fiado
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <p className="text-sm font-medium text-muted-foreground">
              Total em Aberto (inclui vencidos)
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatCurrency(totalPending)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <p className="text-sm font-medium text-muted-foreground">
              Total Vencido
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {formatCurrency(totalOverdue)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-3">
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {loading && (
              <p className="text-sm text-muted-foreground">
                Carregando contas a receber...
              </p>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                value={filterStatus}
                onValueChange={(value) => {
                  setFilterStatus(value as any)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="open">Em aberto</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterDue}
                onValueChange={(value) => {
                  setFilterDue(value as any)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Vencimento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os vencimentos</SelectItem>
                  <SelectItem value="overdue">Somente vencidos</SelectItem>
                  <SelectItem value="this-month">Este mês</SelectItem>
                  <SelectItem value="next-month">Próximo mês</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  <th className="pb-3 text-right pr-4">Em aberto</th>
                  <th className="pb-3 pl-4">Status</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedReceivables.map((receivable) => (
                  <tr key={receivable.id} className="border-b last:border-0">
                    <td className="py-4 font-medium">
                      {receivable.customer}
                    </td>
                    <td className="py-4 text-muted-foreground">
                      {receivable.installment}
                    </td>
                    <td className="py-4 text-muted-foreground">
                      {formatDate(receivable.dueDate)}
                    </td>
                    <td className="py-4 text-right font-medium pr-4">
                      {formatCurrency(receivable.outstanding)}
                    </td>
                    <td className="py-4 pl-4">
                      {getStatusBadge(receivable.status)}
                    </td>
                    <td className="py-4">
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetails(receivable)}
                            >
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleMarkAsPaid(receivable)}
                              disabled={receivable.outstanding <= 0}
                            >
                              Marcar como pago
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && paginatedReceivables.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      Nenhuma conta a receber encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t mt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a{' '}
                {Math.min(endIndex, filteredReceivables.length)} de{' '}
                {filteredReceivables.length} parcelas
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(totalPages, 5) },
                    (_, i) => {
                      let page
                      if (totalPages <= 5) {
                        page = i + 1
                      } else if (currentPage <= 3) {
                        page = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        page = totalPages - 4 + i
                      } else {
                        page = currentPage - 2 + i
                      }
                      return (
                        <Button
                          key={page}
                          variant={
                            currentPage === page ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      )
                    },
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentDialog
        receivable={selectedReceivable}
        open={isPaymentDialogOpen}
        onOpenChange={(open) => {
          setIsPaymentDialogOpen(open)
          if (!open) setSelectedReceivable(null)
        }}
        onPaid={loadReceivables}
      />
      <ReceivableDetailsDialog
        receivable={selectedReceivable}
        open={isDetailsOpen}
        onOpenChange={(open) => {
          setIsDetailsOpen(open)
          if (!open) setSelectedReceivable(null)
        }}
      />
    </div>
  )
}
