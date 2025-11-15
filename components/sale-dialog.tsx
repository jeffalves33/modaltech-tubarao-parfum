'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown, Printer, Share2, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Installment {
  number: number
  value: number
  dueDate: string
}

interface ProductItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export function SaleDialog({ open, onOpenChange }: SaleDialogProps) {
  const [openCustomer, setOpenCustomer] = useState(false)
  const [openProduct, setOpenProduct] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [saleData, setSaleData] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    customer: '',
    customerName: '',
    paymentType: 'cash',
    installments: '1',
    discount: '0',
  })

  const [products, setProducts] = useState<ProductItem[]>([])
  const [currentProduct, setCurrentProduct] = useState({
    id: '',
    name: '',
    quantity: '1',
    unitPrice: '',
  })

  const [installmentDates, setInstallmentDates] = useState<Installment[]>([])

  const customers = [
    { id: '1', name: 'Maria Silva', phone: '(11) 98765-4321' },
    { id: '2', name: 'João Santos', phone: '(11) 98765-4322' },
    { id: '3', name: 'Ana Costa', phone: '(11) 98765-4323' },
    { id: '4', name: 'Pedro Lima', phone: '(11) 98765-4324' },
    { id: '5', name: 'Carla Souza', phone: '(11) 98765-4325' },
  ]

  const availableProducts = [
    { id: '1', name: 'Chanel Nº 5', price: 450.00, stock: 15 },
    { id: '2', name: 'Dior Sauvage', price: 380.00, stock: 22 },
    { id: '3', name: 'Carolina Herrera Good Girl', price: 320.00, stock: 18 },
    { id: '4', name: 'Hugo Boss Bottled', price: 280.00, stock: 30 },
    { id: '5', name: 'Paco Rabanne One Million', price: 350.00, stock: 12 },
    { id: '6', name: 'Versace Eros', price: 340.00, stock: 20 },
  ]

  const subtotalValue = products.reduce((sum, p) => sum + p.subtotal, 0)
  const discountValue = subtotalValue * (Number(formData.discount) / 100)
  const totalValue = subtotalValue - discountValue

  const handleAddProduct = () => {
    if (currentProduct.id && currentProduct.quantity && currentProduct.unitPrice) {
      const newProduct: ProductItem = {
        id: currentProduct.id,
        name: currentProduct.name,
        quantity: Number(currentProduct.quantity),
        unitPrice: Number(currentProduct.unitPrice),
        subtotal: Number(currentProduct.quantity) * Number(currentProduct.unitPrice)
      }
      setProducts([...products, newProduct])
      setCurrentProduct({ id: '', name: '', quantity: '1', unitPrice: '' })
    }
  }

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index))
  }

  const handleInstallmentsChange = (value: string) => {
    setFormData({ ...formData, installments: value })
    const numInstallments = Number(value)
    const installmentValue = totalValue / numInstallments
    
    const newInstallments: Installment[] = []
    const today = new Date()
    
    for (let i = 0; i < numInstallments; i++) {
      const dueDate = new Date(today.getFullYear(), today.getMonth() + i + 1, 1)
      newInstallments.push({
        number: i + 1,
        value: installmentValue,
        dueDate: dueDate.toISOString().split('T')[0]
      })
    }
    
    setInstallmentDates(newInstallments)
  }

  const handleInstallmentDateChange = (index: number, date: string) => {
    const updated = [...installmentDates]
    updated[index].dueDate = date
    setInstallmentDates(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (products.length === 0) {
      alert('Adicione pelo menos um produto')
      return
    }
    setSaleData({
      ...formData,
      products,
      subtotalValue,
      discountValue,
      totalValue,
      installmentDates: formData.paymentType === 'credit' ? installmentDates : [],
      date: new Date().toLocaleDateString('pt-BR'),
    })
    setShowSuccess(true)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSendWhatsApp = () => {
    const customer = customers.find(c => c.id === formData.customer)
    const productsText = products.map(p => `${p.name} (${p.quantity}x) - R$ ${p.subtotal.toFixed(2)}`).join('\n')
    const message = `*Comprovante de Venda*\n\nCliente: ${customer?.name}\n\nProdutos:\n${productsText}\n\nSubtotal: R$ ${subtotalValue.toFixed(2)}\nDesconto: R$ ${discountValue.toFixed(2)}\nValor Total: R$ ${totalValue.toFixed(2)}\nForma de Pagamento: ${formData.paymentType === 'cash' ? 'À vista' : `Parcelado ${formData.installments}x`}\n\nObrigado pela preferência!`
    const phone = customer?.phone.replace(/\D/g, '')
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleClose = () => {
    setShowSuccess(false)
    onOpenChange(false)
    setFormData({
      customer: '',
      customerName: '',
      paymentType: 'cash',
      installments: '1',
      discount: '0',
    })
    setProducts([])
    setCurrentProduct({ id: '', name: '', quantity: '1', unitPrice: '' })
    setInstallmentDates([])
  }

  if (showSuccess) {
    return (
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Venda Registrada com Sucesso!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm"><strong>Cliente:</strong> {formData.customerName}</p>
              <p className="text-sm"><strong>Produtos:</strong> {products.length}</p>
              <p className="text-sm"><strong>Valor Total:</strong> R$ {totalValue.toFixed(2)}</p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-2 w-full sm:w-auto">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={handleSendWhatsApp} className="gap-2 w-full sm:w-auto">
              <Share2 className="h-4 w-4" />
              Enviar WhatsApp
            </Button>
            <Button onClick={handleClose} className="w-full sm:w-auto">
              Concluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Venda</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Cliente</Label>
            <Popover open={openCustomer} onOpenChange={setOpenCustomer}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCustomer}
                  className="w-full justify-between"
                >
                  {formData.customer
                    ? customers.find((c) => c.id === formData.customer)?.name
                    : "Buscar cliente..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Buscar cliente..." />
                  <CommandEmpty>Nenhum cliente encontrado.</CommandEmpty>
                  <CommandGroup className="max-h-[200px] overflow-auto">
                    {customers.map((customer) => (
                      <CommandItem
                        key={customer.id}
                        value={customer.name}
                        onSelect={() => {
                          setFormData({ ...formData, customer: customer.id, customerName: customer.name })
                          setOpenCustomer(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            formData.customer === customer.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{customer.name}</span>
                          <span className="text-xs text-muted-foreground">{customer.phone}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
            <Label>Adicionar Produtos</Label>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-2">
                <Popover open={openProduct} onOpenChange={setOpenProduct}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={openProduct}
                      className="w-full justify-between"
                    >
                      {currentProduct.id
                        ? availableProducts.find((p) => p.id === currentProduct.id)?.name
                        : "Buscar produto..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Buscar produto..." />
                      <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                      <CommandGroup className="max-h-[200px] overflow-auto">
                        {availableProducts.map((product) => (
                          <CommandItem
                            key={product.id}
                            value={product.name}
                            onSelect={() => {
                              setCurrentProduct({ 
                                ...currentProduct,
                                id: product.id, 
                                name: product.name,
                                unitPrice: product.price.toString()
                              })
                              setOpenProduct(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                currentProduct.id === product.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col flex-1">
                              <span>{product.name}</span>
                              <div className="flex gap-2 text-xs text-muted-foreground">
                                <span>R$ {product.price.toFixed(2)}</span>
                                <span>• Estoque: {product.stock}</span>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  min="1"
                  placeholder="Qtd"
                  value={currentProduct.quantity}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, quantity: e.target.value })}
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Preço"
                  value={currentProduct.unitPrice}
                  onChange={(e) => setCurrentProduct({ ...currentProduct, unitPrice: e.target.value })}
                />
              </div>
            </div>
            <Button type="button" onClick={handleAddProduct} className="w-full" size="sm">
              Adicionar Produto
            </Button>
          </div>

          {products.length > 0 && (
            <div className="space-y-2">
              <Label>Produtos Adicionados ({products.length})</Label>
              <div className="rounded-lg border divide-y max-h-[200px] overflow-y-auto">
                {products.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-card">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.quantity}x R$ {product.unitPrice.toFixed(2)} = R$ {product.subtotal.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveProduct(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="discount">Desconto (%)</Label>
            <Input
              id="discount"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
            />
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">R$ {subtotalValue.toFixed(2)}</span>
            </div>
            {Number(formData.discount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto ({formData.discount}%)</span>
                <span className="font-medium text-emerald-600">- R$ {discountValue.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Valor Total</span>
              <span className="text-2xl font-bold">R$ {totalValue.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="paymentType">Forma de Pagamento</Label>
              <Select 
                value={formData.paymentType} 
                onValueChange={(value) => {
                  setFormData({ ...formData, paymentType: value })
                  if (value === 'cash') {
                    setInstallmentDates([])
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">À vista</SelectItem>
                  <SelectItem value="credit">Parcelado (Crediário)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.paymentType === 'credit' && (
              <div className="space-y-2">
                <Label htmlFor="installments">Número de Parcelas</Label>
                <Select value={formData.installments} onValueChange={handleInstallmentsChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2x</SelectItem>
                    <SelectItem value="3">3x</SelectItem>
                    <SelectItem value="4">4x</SelectItem>
                    <SelectItem value="5">5x</SelectItem>
                    <SelectItem value="6">6x</SelectItem>
                    <SelectItem value="7">7x</SelectItem>
                    <SelectItem value="8">8x</SelectItem>
                    <SelectItem value="9">9x</SelectItem>
                    <SelectItem value="10">10x</SelectItem>
                    <SelectItem value="11">11x</SelectItem>
                    <SelectItem value="12">12x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {formData.paymentType === 'credit' && installmentDates.length > 0 && (
            <div className="space-y-3">
              <Label>Vencimento das Parcelas</Label>
              <div className="rounded-lg border p-4 space-y-3 max-h-[300px] overflow-y-auto">
                {installmentDates.map((installment, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-sm font-medium min-w-[60px]">
                        {installment.number}ª parcela
                      </span>
                      <Input
                        type="date"
                        value={installment.dueDate}
                        onChange={(e) => handleInstallmentDateChange(index, e.target.value)}
                        className="flex-1"
                        required
                      />
                    </div>
                    <span className="text-sm font-medium min-w-[100px] text-right">
                      R$ {installment.value.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Registrar Venda</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
