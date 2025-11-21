// components/expenses-view.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { ExpenseDialog } from '@/components/expense-dialog'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabaseClient'

type ExpenseType = 'fixed' | 'variable'

interface Expense {
  id: string
  date: string          // due_date
  category: string
  description: string
  amount: number
  type: ExpenseType
  isPaid: boolean
}

export function ExpensesView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [filterType, setFilterType] =
    useState<'all' | ExpenseType>('all')
  const [filterStatus, setFilterStatus] =
    useState<'all' | 'paid' | 'open'>('all')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const loadExpenses = async () => {
    setLoading(true)
    setError(null)
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstDayNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const startDate = firstDay.toISOString().slice(0, 10)
    const endDate = firstDayNextMonth.toISOString().slice(0, 10)

    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(
          'id, description, type, category, amount, due_date, status',
        )
        // (mês atual) OU (não pagas), ignorando canceladas
        .or(
          `and(due_date.gte.${startDate},due_date.lt.${endDate}),status.neq.paid`
        )
        .neq('status', 'canceled')
        .order('due_date', { ascending: false })

      if (error) throw error

      const mapped: Expense[] = (data ?? []).map((e: any) => ({
        id: e.id,
        date: e.due_date,
        category: e.category ?? '',
        description: e.description ?? '',
        amount: Number(e.amount ?? 0),
        type: (e.type ?? 'variable') as ExpenseType,
        isPaid: e.status === 'paid',
      }))

      setExpenses(mapped)
    } catch (err: any) {
      console.error('Erro ao carregar despesas', err)
      setError('Erro ao carregar despesas. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExpenses()
  }, [])

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setEditingExpense(null)
    setIsDialogOpen(true)
  }

  const handleMarkAsPaid = async (expense: Expense) => {
    if (expense.isPaid) return

    try {
      const today = new Date().toISOString().slice(0, 10)

      const { error } = await supabase
        .from('expenses')
        .update({
          status: 'paid',
          paid_date: today,
        })
        .eq('id', expense.id)

      if (error) throw error

      await loadExpenses()
    } catch (err: any) {
      console.error('Erro ao marcar despesa como paga', err)
      alert('Erro ao marcar despesa como paga. Tente novamente.')
    }
  }

  const handleDelete = async (expense: Expense) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .update({ status: 'canceled' })
        .eq('id', expense.id)

      if (error) throw error

      await loadExpenses()
    } catch (err: any) {
      console.error('Erro ao cancelar despesa', err)
      alert('Erro ao cancelar despesa. Tente novamente.')
    }
  }

  // ----- AGREGADOS -----
  const totalExpenses = expenses.reduce(
    (sum, e) => sum + e.amount,
    0,
  )
  const fixedExpenses = expenses
    .filter((e) => e.type === 'fixed')
    .reduce((sum, e) => sum + e.amount, 0)
  const variableExpenses = expenses
    .filter((e) => e.type === 'variable')
    .reduce((sum, e) => sum + e.amount, 0)
  const paidExpenses = expenses
    .filter((e) => e.isPaid)
    .reduce((sum, e) => sum + e.amount, 0)
  const pendingExpenses = expenses
    .filter((e) => !e.isPaid)
    .reduce((sum, e) => sum + e.amount, 0)

  // ----- FILTROS -----
  let filteredExpenses = expenses.filter(
    (e) =>
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (filterType !== 'all') {
    filteredExpenses = filteredExpenses.filter(
      (e) => e.type === filterType,
    )
  }

  if (filterStatus !== 'all') {
    filteredExpenses = filteredExpenses.filter((e) =>
      filterStatus === 'paid' ? e.isPaid : !e.isPaid,
    )
  }

  // ----- PAGINAÇÃO -----
  const totalPages = Math.max(
    Math.ceil(filteredExpenses.length / itemsPerPage),
    1,
  )
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedExpenses = filteredExpenses.slice(
    startIndex,
    endIndex,
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Despesas
          </h1>
          <p className="text-muted-foreground">
            Controle suas despesas e custos
          </p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-muted-foreground">
              Total Despesas
            </p>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-muted-foreground">
              Custos Fixos
            </p>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(fixedExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-muted-foreground">
              Custos Variáveis
            </p>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(variableExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-muted-foreground">
              Pagas
            </p>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {formatCurrency(paidExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-muted-foreground">
              Pendentes
            </p>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(pendingExpenses)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista */}
      <Card>
        <CardHeader>
          <div className="space-y-3">
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            {loading && (
              <p className="text-sm text-muted-foreground">
                Carregando despesas...
              </p>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar despesa por descrição ou categoria..."
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
                value={filterType}
                onValueChange={(value) => {
                  setFilterType(value as any)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="fixed">Fixos</SelectItem>
                  <SelectItem value="variable">Variáveis</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filterStatus}
                onValueChange={(value) => {
                  setFilterStatus(value as any)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="open">Pendentes</SelectItem>
                  <SelectItem value="paid">Pagas</SelectItem>
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
                  <th className="pb-3">Data</th>
                  <th className="pb-3">Categoria</th>
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3 text-right pr-4">Valor</th>
                  <th className="pb-3 pl-4">Status</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b last:border-0"
                  >
                    <td className="py-4">
                      {formatDate(expense.date)}
                    </td>
                    <td className="py-4">
                      <div>
                        <p className="font-medium">
                          {expense.category}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {expense.description}
                        </p>
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge
                        variant="outline"
                        className={
                          expense.type === 'fixed'
                            ? 'border-blue-500 text-blue-700'
                            : 'border-purple-500 text-purple-700'
                        }
                      >
                        {expense.type === 'fixed'
                          ? 'Fixo'
                          : 'Variável'}
                      </Badge>
                    </td>
                    <td className="py-4 text-right font-medium pr-4">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="py-4 pl-4">
                      <Badge
                        className={
                          expense.isPaid
                            ? 'bg-emerald-500'
                            : 'bg-amber-500 text-white'
                        }
                      >
                        {expense.isPaid ? 'Pago' : 'Pendente'}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex justify-end gap-2">
                        {!expense.isPaid && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkAsPaid(expense)}
                          >
                            Pagar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(expense)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(expense)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && paginatedExpenses.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      Nenhuma despesa encontrada.
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
                {Math.min(
                  endIndex,
                  filteredExpenses.length,
                )}{' '}
                de {filteredExpenses.length} despesas
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
                            currentPage === page
                              ? 'default'
                              : 'outline'
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
                    setCurrentPage((p) =>
                      Math.min(totalPages, p + 1),
                    )
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

      <ExpenseDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        expense={editingExpense}
        onSaved={loadExpenses}
      />
    </div>
  )
}
