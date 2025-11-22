// components/products-view.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Filter,
  Package,
  DollarSign,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProductDialog } from '@/components/product-dialog'
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

export function ProductsView() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [filterStock, setFilterStock] = useState<
    'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
  >('all')

  const [sortBy, setSortBy] = useState<
    'name' | 'brand' | 'stock' | 'salePrice'
  >('name')


  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, brand, description, purchase_price, sale_price, stock_quantity, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true })

      if (error) throw error

      const mapped: Product[] = (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        brand: p.brand ?? '',
        size: p.description ?? '',
        costPrice: Number(p.purchase_price ?? 0),
        salePrice: Number(p.sale_price ?? 0),
        stock: Number(p.stock_quantity ?? 0),
      }))

      setProducts(mapped)
    } catch (err: any) {
      console.error('Erro ao carregar produtos', err)
      setError('Erro ao carregar produtos. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // busca por nome ou marca
  let filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // filtro por estoque
  if (filterStock !== 'all') {
    filteredProducts = filteredProducts.filter((p) => {
      if (filterStock === 'in_stock') return p.stock > 0
      if (filterStock === 'low_stock') return p.stock > 0 && p.stock <= 5
      if (filterStock === 'out_of_stock') return p.stock === 0
      return true
    })
  }

  // ordenação
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'brand':
        return a.brand.localeCompare(b.brand)
      case 'stock':
        return b.stock - a.stock
      case 'salePrice':
        return b.salePrice - a.salePrice
      default:
        return 0
    }
  })

  const totalStock = products.reduce((sum, p) => sum + p.stock, 0)
  const totalStockValue = products.reduce(
    (sum, p) => sum + p.salePrice * p.stock,
    0,
  )
  const totalInvestedValue = products.reduce(
    (sum, p) => sum + p.costPrice * p.stock,
    0,
  )
  const potentialProfit = totalStockValue - totalInvestedValue

  const totalPages = Math.max(
    Math.ceil(sortedProducts.length / itemsPerPage),
    1,
  )
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex)

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsDialogOpen(true)
  }

  const handleNew = () => {
    setEditingProduct(null)
    setIsDialogOpen(true)
  }

  const handleDelete = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', product.id)

      if (error) throw error

      await loadProducts()
    } catch (err: any) {
      console.error('Erro ao desativar produto', err)
      alert('Erro ao desativar produto. Tente novamente.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">Gerencie seu estoque de perfumes</p>
        </div>
        <Button onClick={handleNew} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-muted-foreground">
              Total de Produtos
            </p>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-muted-foreground">
              Quantidade em Estoque
            </p>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-muted-foreground">
              Valor Total em Estoque
            </p>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {totalInvestedValue.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <p className="text-sm font-medium text-muted-foreground">
              Lucro Potencial
            </p>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              R$ {potentialProfit.toFixed(2)}
            </div>
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
                Carregando produtos...
              </p>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
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
                value={filterStock}
                onValueChange={(value) => {
                  setFilterStock(value as any)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os produtos</SelectItem>
                  <SelectItem value="in_stock">Com estoque</SelectItem>
                  <SelectItem value="low_stock">Estoque baixo (≤ 5)</SelectItem>
                  <SelectItem value="out_of_stock">Sem estoque</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value as any)
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome (A–Z)</SelectItem>
                  <SelectItem value="brand">Marca (A–Z)</SelectItem>
                  <SelectItem value="stock">Estoque (maior → menor)</SelectItem>
                  <SelectItem value="salePrice">
                    Preço venda (maior → menor)
                  </SelectItem>
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
                  <th className="pb-3">Produto</th>
                  <th className="pb-3">Marca</th>
                  <th className="pb-3 text-right">Custo</th>
                  <th className="pb-3 text-right">Venda</th>
                  <th className="pb-3 text-right">Estoque</th>
                  <th className="pb-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="py-4 font-medium max-w-[250px] truncate">{product.name}</td>
                    <td className="py-4 text-muted-foreground max-w-[150px] truncate">{product.brand}</td>
                    <td className="py-4 text-right">
                      R$ {product.costPrice.toFixed(2)}
                    </td>
                    <td className="py-4 text-right">
                      R$ {product.salePrice.toFixed(2)}
                    </td>
                    <td className="py-4 text-right">
                      <span
                        className={
                          product.stock <= 5
                            ? 'text-destructive font-medium'
                            : ''
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && paginatedProducts.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-6 text-center text-sm text-muted-foreground"
                    >
                      Nenhum produto encontrado.
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
                {Math.min(endIndex, sortedProducts.length)} de{' '}
                {sortedProducts.length} produtos
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    ),
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

      <ProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={editingProduct}
        onSaved={loadProducts}
      />
    </div>
  )
}
