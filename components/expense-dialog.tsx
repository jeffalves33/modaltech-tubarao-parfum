// components/expense-dialog.tsx
'use client'

import { useState, useEffect } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { supabase } from '@/lib/supabaseClient'

type ExpenseType = 'fixed' | 'variable'

interface Expense {
  id: string
  date: string
  category: string
  description: string
  amount: number
  type: ExpenseType
  isPaid: boolean
}

interface ExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: Expense | null
  onSaved?: () => void
}

export function ExpenseDialog({
  open,
  onOpenChange,
  expense,
  onSaved,
}: ExpenseDialogProps) {
  const [formData, setFormData] = useState({
    date: '',
    category: '',
    description: '',
    amount: '',
    type: 'variable' as ExpenseType,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (expense) {
      setFormData({
        date: expense.date,
        category: expense.category,
        description: expense.description,
        amount: expense.amount.toString(),
        type: expense.type,
      })
    } else {
      const today = new Date().toISOString().split('T')[0]
      setFormData({
        date: today,
        category: '',
        description: '',
        amount: '',
        type: 'variable',
      })
    }
    setError(null)
  }, [expense, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      const userId = user?.id ?? null

      const amount = Number(
        formData.amount.replace('.', '').replace(',', '.'),
      )

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error('Valor inválido.')
      }

      const payload: any = {
        description: formData.description.trim(),
        category: formData.category || 'Outros',
        type: formData.type,
        amount,
        due_date: formData.date,
      }

      if (expense) {
        const { error } = await supabase
          .from('expenses')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', expense.id)

        if (error) throw error
      } else {
        if (userId) {
          payload.created_by = userId
        }

        const { error } = await supabase.from('expenses').insert(payload)

        if (error) throw error
      }

      onSaved?.()
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao salvar despesa', err)
      setError('Erro ao salvar despesa. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {expense ? 'Editar Despesa' : 'Nova Despesa'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive mb-2">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Data de vencimento</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="estoque">Estoque</SelectItem>
                  <SelectItem value="aluguel">Aluguel</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="servicos">Serviços</SelectItem>
                  <SelectItem value="salarios">Salários</SelectItem>
                  <SelectItem value="infraestrutura">
                    Infraestrutura
                  </SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Despesa</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value: ExpenseType) =>
                setFormData({ ...formData, type: value })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed" className="font-normal">
                  Custo Fixo (recorrente)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="variable" id="variable" />
                <Label htmlFor="variable" className="font-normal">
                  Custo Variável (pontual)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
