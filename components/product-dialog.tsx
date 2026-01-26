// components/product-dialog.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { Barcode } from 'lucide-react'
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
  barcode?: string
}

interface ProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onSaved?: () => void
}

export function ProductDialog({ open, onOpenChange, product, onSaved }: ProductDialogProps) {
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    expirationDate: '',
    brand: '',
    size: '',
    costPrice: '',
    salePrice: '',
    stock: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoPrintBarcode, setAutoPrintBarcode] = useState(false)

  useEffect(() => {
    if (product) {
      setFormData({
        barcode: product.barcode ?? '',
        name: product.name,
        expirationDate: product.expiration_date ? product.expiration_date : '',
        brand: product.brand,
        size: product.size,
        costPrice: product.costPrice.toString(),
        salePrice: product.salePrice.toString(),
        stock: product.stock.toString(),
      })
    } else {
      setFormData({
        barcode: '',
        name: '',
        expirationDate: '',
        brand: '',
        size: '',
        costPrice: '',
        salePrice: '',
        stock: '',
      })
    }
    setError(null)
    setAutoPrintBarcode(false)
  }, [product, open])

  const barcodeRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => barcodeRef.current?.focus(), 50)
    return () => clearTimeout(t)
  }, [open])

  const generateEan13 = () => {
    // 12 dígitos base (começa com 2 só por “namespace” interno)
    let base = '2'
    for (let i = 0; i < 11; i += 1) base += Math.floor(Math.random() * 10).toString()

    // calcula dígito verificador EAN-13
    let sum = 0
    for (let i = 0; i < 12; i += 1) {
      const n = Number(base[i])
      sum += i % 2 === 0 ? n : n * 3
    }
    const check = (10 - (sum % 10)) % 10
    return base + String(check)
  }

  const handleGenerateBarcode = () => {
    setFormData((prev) => ({ ...prev, barcode: generateEan13() }))
    setTimeout(() => barcodeRef.current?.focus(), 0)
  }

  const printBarcode = (code: string, name?: string) => {
    const w = window.open('', '_blank', 'width=420,height=320')
    if (!w) return

    const safeName = (name ?? '').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    w.document.open()
    w.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title></title>

          <style>
            /* AJUSTE AQUI o tamanho da etiqueta */
            :root {
              --w: 50mm;
              --h: 30mm;
            }

            @page {
              size: var(--w) var(--h);
              margin: 0;
            }

            html, body {
              width: var(--w);
              height: var(--h);
              margin: 0;
              padding: 0;
              overflow: hidden;
              background: #fff;
            }

            .wrap {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
            }

            /* O SVG do JsBarcode vai ter o texto (número) embutido embaixo */
            svg {
              width: calc(var(--w) - 4mm);
              height: calc(var(--h) - 4mm);
            }
          </style>
        </head>

        <body>
          <div class="wrap">
            <svg id="barcode"></svg>
          </div>

          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"></script>
          <script>
            try {
              JsBarcode("#barcode", "${code}", {
                format: "EAN13",
                displayValue: true,        // <-- número embaixo (padrão)
                font: "OCRB, monospace",   // tenta OCR-B; se não tiver, cai no monospace
                fontSize: 14,
                textMargin: 2,
                margin: 0,
                height: 80
              });

              // dá um tempo mínimo pro SVG renderizar antes de imprimir
              setTimeout(() => {
                window.focus();
                window.print();
                window.close();
              }, 60);

            } catch(e) {
              document.body.innerHTML = "";
            }
          </script>
        </body>
      </html>
    `)
    w.document.close()
  }

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
        expiration_date: formData.expirationDate || null,
        brand: formData.brand.trim(),
        description: formData.size.trim(), // usamos description como "tamanho"
        purchase_price: purchasePrice,
        sale_price: salePrice,
        stock_quantity: stockQuantity,
        is_active: true,
      }

      const barcode = formData.barcode.trim()
      payload.barcode = barcode.length ? barcode : null

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

      const finalBarcode = payload.barcode as string | null
      onSaved?.()
      if (autoPrintBarcode && finalBarcode) printBarcode(finalBarcode, payload.name)
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
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive mb-2">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="barcode">Código de barras</Label>
              <div className="flex gap-2">
                <Input
                  id="barcode"
                  ref={barcodeRef}
                  placeholder="Abrir e escanear..."
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.preventDefault() // scanner costuma enviar Enter no final
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title="Gerar código de barras"
                  onClick={handleGenerateBarcode}
                  disabled={loading}
                >
                  <Barcode className="h-4 w-4" />
                </Button>
              </div>

              <label className="flex items-center gap-2 text-sm text-muted-foreground select-none">
                <input
                  type="checkbox"
                  checked={autoPrintBarcode}
                  onChange={(e) => setAutoPrintBarcode(e.target.checked)}
                />
                Imprimir automaticamente ao salvar
              </label>
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
              <Label htmlFor="name">Nome do Produto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiration">Validade</Label>
              <Input
                id="expiration"
                type="date"
                value={formData.expirationDate}
                onChange={(e) =>
                  setFormData({ ...formData, expirationDate: e.target.value })
                }
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
