'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, MoreVertical, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import { SaleDialog } from '@/components/sale-dialog'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SaleDetailsDialog } from '@/components/sale-details-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Sale {
  id: string
  date: string
  customer: string
  product: string
  quantity: number
  totalValue: number
  paymentType: 'cash' | 'credit'
  installments?: number
  paidAmount: number
  status: 'paid' | 'pending' | 'partial'
}

export function SalesView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPayment, setFilterPayment] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [sales] = useState<Sale[]>([
    { id: '4', date: '2024-01-15', customer: 'Maria Silva', product: 'Chanel Nº 5', quantity: 1, totalValue: 450, paymentType: 'cash', paidAmount: 450, status: 'paid' },
    { id: '3', date: '2024-01-14', customer: 'João Santos', product: 'Dior Sauvage', quantity: 1, totalValue: 380, paymentType: 'credit', installments: 3, paidAmount: 0, status: 'pending' },
    { id: '2', date: '2024-01-14', customer: 'Ana Costa', product: 'Carolina Herrera', quantity: 1, totalValue: 320, paymentType: 'cash', paidAmount: 320, status: 'paid' },
    { id: '1', date: '2024-01-13', customer: 'Pedro Lima', product: 'Hugo Boss', quantity: 1, totalValue: 280, paymentType: 'credit', installments: 2, paidAmount: 140, status: 'partial' },
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()))

  let filteredSales = sales.filter(s =>
    s.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.product.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (filterStatus !== 'all') {
    filteredSales = filteredSales.filter(s => s.status === filterStatus)
  }
  if (filterPayment !== 'all') {
    filteredSales = filteredSales.filter(s => s.paymentType === filterPayment)
  }

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSales = filteredSales.slice(startIndex, endIndex)

  const getStatusBadge = (status: Sale['status']) => {
    const variants = {
      paid: { label: 'Pago', variant: 'default' as const, className: 'bg-emerald-500 hover:bg-emerald-600' },
      pending: { label: 'Pendente', variant: 'secondary' as const, className: 'bg-amber-500 hover:bg-amber-600 text-white' },
      partial: { label: 'Parcial', variant: 'outline' as const, className: 'border-amber-500 text-amber-700' },
    }
    const config = variants[status]
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>
  }

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale)
    setIsDetailsOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendas</h1>
          <p className="text-muted-foreground">Registre e acompanhe suas vendas</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Venda
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente ou produto..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={filterStatus} onValueChange={(value) => { setFilterStatus(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="partial">Parcial</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterPayment} onValueChange={(value) => { setFilterPayment(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as formas</SelectItem>
                  <SelectItem value="cash">À vista</SelectItem>
                  <SelectItem value="credit">Parcelado</SelectItem>
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
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3 text-right pr-4">Valor Total</th>
                  <th className="pb-3 pl-4">Status</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedSales.map((sale) => (
                  <tr key={sale.id} className="border-b last:border-0">
                    <td className="py-4">{sale.date}</td>
                    <td className="py-4 font-medium">{sale.customer}</td>
                    <td className="py-4 text-right font-medium pr-4">R$ {sale.totalValue.toFixed(2)}</td>
                    <td className="py-4 pl-4">{getStatusBadge(sale.status)}</td>
                    <td className="py-4">
                      <div className="flex justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetails(sale)}>
                              Ver Detalhes
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredSales.length)} de {filteredSales.length} vendas
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
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
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <SaleDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <SaleDetailsDialog
        sale={selectedSale}
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
      />
    </div>
  )
}
