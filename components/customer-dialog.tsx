// components/customer-dialog.tsx
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
import { supabase } from '@/lib/supabaseClient'

interface Customer {
  id: string
  name: string
  phone: string
  cpf: string | null
}

interface CustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: Customer | null
  onSaved?: () => void
}

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSaved,
}: CustomerDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    cpf: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone ?? '',
        cpf: customer.cpf ?? '',
      })
    } else {
      setFormData({
        name: '',
        phone: '',
        cpf: '',
      })
    }
    setError(null)
  }, [customer, open])

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

      const payload: any = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        cpf: formData.cpf.trim() || null,
      }

      if (customer) {
        // update
        const { error } = await supabase
          .from('customers')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', customer.id)

        if (error) throw error
      } else {
        // insert
        if (userId) {
          payload.created_by = userId
        }

        const { error } = await supabase.from('customers').insert(payload)

        if (error) throw error
      }

      onSaved?.()
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao salvar cliente', err)
      setError('Erro ao salvar cliente. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {customer ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive mb-2">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                placeholder="(11) 98765-4321"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF (opcional)</Label>
              <Input
                id="cpf"
                placeholder="123.456.789-00"
                value={formData.cpf}
                onChange={(e) =>
                  setFormData({ ...formData, cpf: e.target.value })
                }
              />
            </div>
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
