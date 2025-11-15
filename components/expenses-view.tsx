'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Pencil, Trash2, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { ExpenseDialog } from '@/components/expense-dialog'
import { Badge } from '@/components/ui/badge'

interface Expense {
  id: string
  date: string
  category: string
  description: string
  amount: number
  type: 'fixed' | 'variable'
  isPaid: boolean
}

export function ExpensesView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const [expenses] = useState<Expense[]>([
    { id: '1', date: '2024-01-15', category: 'Estoque', description: 'Compra de perfumes importados', amount: 3500.00, type: 'variable', isPaid: true },
    { id: '2', date: '2024-01-10', category: 'Aluguel', description: 'Aluguel da loja - Janeiro', amount: 2000.00, type: 'fixed', isPaid: false },
    { id: '3', date: '2024-01-08', category: 'Transporte', description: 'Entrega de produtos', amount: 150.00, type: 'variable', isPaid: true },
    { id: '4', date: '2024-01-05', category: 'Marketing', description: 'Anúncios Instagram', amount: 300.00, type: 'variable', isPaid: false },
    { id: '5', date: '2024-01-01', category: 'Salários', description: 'Salário funcionário', amount: 2500.00, type: 'fixed', isPaid: false },
  ])

  const filteredExpenses = expenses.filter(e =>
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const fixedExpenses = expenses.filter(e => e.type === 'fixed').reduce((sum, e) => sum + e.amount, 0)
  const variableExpenses = expenses.filter(e => e.type === 'variable').reduce((sum, e) => sum + e.amount, 0)
  const paidExpenses = expenses.filter(e => e.isPaid).reduce((sum, e) => sum + e.amount, 0)
  const pendingExpenses = expenses.filter(e => !e.isPaid).reduce((sum, e) => sum + e.amount, 0)

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setEditingExpense(null)
    setIsDialogOpen(true)
  }

  const handleMarkAsPaid = (id: string) => {
    console.log('[v0] Marking expense as paid:', id)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Despesas</h1>
          <p className="text-muted-foreground">Controle suas despesas e custos</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Despesas</p>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {totalExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-muted-foreground">Custos Fixos</p>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {fixedExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-muted-foreground">Custos Variáveis</p>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {variableExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-muted-foreground">Pagas</p>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">R$ {paidExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">R$ {pendingExpenses.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar despesa..."
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
                  <th className="pb-3">Data</th>
                  <th className="pb-3">Categoria</th>
                  <th className="pb-3">Tipo</th>
                  <th className="pb-3 text-right pr-4">Valor</th>
                  <th className="pb-3 pl-4">Status</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b last:border-0">
                    <td className="py-4">{expense.date}</td>
                    <td className="py-4">
                      <div>
                        <p className="font-medium">{expense.category}</p>
                        <p className="text-sm text-muted-foreground">{expense.description}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <Badge variant="outline" className={expense.type === 'fixed' ? 'border-blue-500 text-blue-700' : 'border-purple-500 text-purple-700'}>
                        {expense.type === 'fixed' ? 'Fixo' : 'Variável'}
                      </Badge>
                    </td>
                    <td className="py-4 text-right font-medium pr-4">R$ {expense.amount.toFixed(2)}</td>
                    <td className="py-4 pl-4">
                      <Badge className={expense.isPaid ? 'bg-emerald-500' : 'bg-amber-500 text-white'}>
                        {expense.isPaid ? 'Pago' : 'Pendente'}
                      </Badge>
                    </td>
                    <td className="py-4">
                      <div className="flex justify-end gap-2">
                        {!expense.isPaid && (
                          <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(expense.id)}>
                            Pagar
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
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

      <ExpenseDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        expense={editingExpense}
      />
    </div>
  )
}
