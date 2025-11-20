// components/product-dialog.tsx
'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabaseClient'

interface Product {
  id: string
  name: string
  brand: string
  size: string
  costPrice: number
  salePrice: number
  stock: number
}

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSaved?: () => void
}

export function ProductDialog({ open, onOpenChange, product, onSaved }: ProductDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    size: '',
    costPrice: '',
    salePrice: '',
    stock: '',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        brand: product.brand,
        size: product.size,
        costPrice: product.costPrice.toString(),
        salePrice: product.salePrice.toString(),
        stock: product.stock.toString(),
      })
    } else {
      setFormData({
        name: '',
        brand: '',
        size: '',
        costPrice: '',
        salePrice: '',
        stock: '',
      })
    }
    setError(null)
  }, [product, open])

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

      const purchasePrice = Number(formData.costPrice.replace(',', '.')) || 0
      const salePrice = Number(formData.salePrice.replace(',', '.')) || 0
      const stockQuantity = Number(formData.stock) || 0

      const payload: any = {
        name: formData.name.trim(),
        brand: formData.brand.trim(),
        description: formData.size.trim(), // usamos description como "tamanho"
        purchase_price: purchasePrice,
        sale_price: salePrice,
        stock_quantity: stockQuantity,
        is_active: true,
      }

      if (userId) {
        payload.created_by = userId
      }

      if (product) {
        // update
        const { error: updateError } = await supabase
          .from('products')
          .update(payload)
          .eq('id', product.id)

        if (updateError) throw updateError
      } else {
        // insert
        const { error: insertError } = await supabase
          .from('products')
          .insert(payload)

        if (insertError) throw insertError
      }

      onSaved?.()
      onOpenChange(false)
    } catch (err: any) {
      console.error('Erro ao salvar produto', err)
      setError('Erro ao salvar produto. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive mb-2">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="size">Descrição</Label>
              <Input
                id="size"
                placeholder="ex: 100ml"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Estoque</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="costPrice">Preço de Custo</Label>
              <Input
                id="costPrice"
                type="number"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salePrice">Preço de Venda</Label>
              <Input
                id="salePrice"
                type="number"
                step="0.01"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
