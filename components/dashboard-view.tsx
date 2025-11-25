//components/dashboard-view.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TrendingUp, TrendingDown, DollarSign, Users, Package, ShoppingCart } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabaseClient'

type SummaryStats = {
  salesTotal: number
  receivedTotal: number
  receivablesOpen: number
  stockUnits: number
  activeCustomers: number
}

type FinancialMetrics = {
  totalRevenue: number
  totalCosts: number
  grossProfit: number
  marginPercent: number
  breakEven: number
}

type RecentSale = {
  id: string
  customerName: string
  totalAmount: number
  saleDate: string
  paymentType: string
}

type UpcomingReceivable = {
  id: string
  customerName: string
  dueDate: string
  amount: number
  installmentLabel: string
}

// ----------------- helpers -----------------

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatCurrency(value: number) {
  return currencyFormatter.format(value || 0)
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('pt-BR')
}

type DateFilter =
  | 'current-month'
  | 'next-month'
  | 'last-month'
  | 'current-quarter'
  | 'current-year'
  | 'all-time'
  | 'custom'

function getDateRange(filter: DateFilter) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  let start = new Date()
  let end = new Date()

  switch (filter) {
    case 'current-month': {
      start = new Date(year, month, 1)
      end = new Date(year, month + 1, 1)
      break
    }
    case 'last-month': {
      start = new Date(year, month - 1, 1)
      end = new Date(year, month, 1)
      break
    }
    case 'next-month': {
      start = new Date(year, month + 1, 1)
      end = new Date(year, month + 2, 1)
      break
    }
    case 'current-quarter': {
      const quarterStartMonth = Math.floor(month / 3) * 3
      start = new Date(year, quarterStartMonth, 1)
      end = new Date(year, quarterStartMonth + 3, 1)
      break
    }
    case 'current-year': {
      start = new Date(year, 0, 1)
      end = new Date(year + 1, 0, 1)
      break
    }
    case 'all-time':
    default: {
      start = new Date(2000, 0, 1)
      end = new Date(2100, 0, 1)
      break
    }
  }

  return {
    start,
    end,
    // para colunas timestamptz
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    // para colunas date (YYYY-MM-DD)
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

function getCustomDateRange(startStr: string, endStr: string) {
  const start = new Date(startStr + 'T00:00:00')
  const end = new Date(endStr + 'T00:00:00')

  // usamos end exclusivo, então soma 1 dia
  end.setDate(end.getDate() + 1)

  return {
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    startDate: startStr,
    endDate: end.toISOString().slice(0, 10),
  }
}

// ----------------- componente principal -----------------

export function DashboardView() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('current-month')
  const [customStartDate, setCustomStartDate] = useState<string | null>(null)
  const [customEndDate, setCustomEndDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [financialState, setFinancialState] = useState<FinancialMetrics | null>(null)
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])
  const [upcomingReceivables, setUpcomingReceivables] = useState<UpcomingReceivable[]>([])

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      setError(null)

      try {
        let range: {
          startIso: string
          endIso: string
          startDate: string
          endDate: string
        }

        if (dateFilter === 'custom') {
          // se ainda não escolheu as duas datas, não carrega nada
          if (!customStartDate || !customEndDate) {
            setSummary(null)
            setFinancialState(null)
            setRecentSales([])
            setUpcomingReceivables([])
            setLoading(false)
            return
          }

          range = getCustomDateRange(customStartDate, customEndDate)
        } else {
          range = getDateRange(dateFilter)
        }

        const { startIso, endIso, startDate, endDate } = range

        // 1) carrega dados em paralelo
        const [
          salesRes,
          saleItemsRes,
          paymentsRes,
          expensesRes,
          productsRes,
          receivablesRes,
          customersRes,
        ] = await Promise.all([
          // vendas no período
          supabase
            .from('sales')
            .select('id, sale_date, total_amount, customer_id, status')
            .neq('status', 'canceled')
            .gte('sale_date', startIso)
            .lt('sale_date', endIso),

          // itens de venda (para custo/margem)
          supabase
            .from('sale_items')
            .select('sale_id, quantity, unit_price, unit_cost'),

          // pagamentos recebidos no período
          supabase
            .from('payments')
            .select('id, payment_date, amount, receivable_id, sale_id, customer_id')
            .gte('payment_date', startDate)
            .lt('payment_date', endDate),

          // despesas do período
          supabase
            .from('expenses')
            .select('id, amount, due_date, status')
            .gte('due_date', startDate)
            .lt('due_date', endDate)
            .neq('status', 'canceled'),

          // estoque
          supabase
            .from('products')
            .select('stock_quantity, is_active'),

          // recebíveis (parcelas) do período
          supabase
            .from('receivables')
            .select('id, sale_id, customer_id, due_date, amount, installment_number, status')
            .gte('due_date', startDate)
            .lt('due_date', endDate)
            .in('status', ['open', 'partial']),

          // mapa de clientes
          supabase
            .from('customers')
            .select('id, name'),
        ])

        if (cancelled) return

        // trata erros
        if (salesRes.error) throw salesRes.error
        if (saleItemsRes.error) throw saleItemsRes.error
        if (paymentsRes.error) throw paymentsRes.error
        if (expensesRes.error) throw expensesRes.error
        if (productsRes.error) throw productsRes.error
        if (receivablesRes.error) throw receivablesRes.error
        if (customersRes.error) throw customersRes.error

        const sales = (salesRes.data ?? []) as {
          id: string
          sale_date: string
          total_amount: number | null
          customer_id: string | null
          status: string
        }[]

        const saleItems = (saleItemsRes.data ?? []) as {
          sale_id: string
          quantity: number
          unit_price: number
          unit_cost: number
        }[]

        const payments = (paymentsRes.data ?? []) as {
          id: string
          payment_date: string
          amount: number
          receivable_id: string | null
          sale_id: string | null
          customer_id: string | null
        }[]

        const expenses = (expensesRes.data ?? []) as {
          id: string
          amount: number
          due_date: string
          status: string
        }[]

        const products = (productsRes.data ?? []) as {
          stock_quantity: number
          is_active: boolean
        }[]

        const receivables = (receivablesRes.data ?? []) as {
          id: string
          sale_id: string
          customer_id: string | null
          due_date: string
          amount: number
          installment_number: number
          status: string
        }[]

        const customers = (customersRes.data ?? []) as {
          id: string
          name: string
        }[]

        const customerMap = customers.reduce<Record<string, string>>((acc, c) => {
          acc[c.id] = c.name
          return acc
        }, {})

        // ---------- métricas de resumo ----------

        const salesTotal = sales.reduce((sum, s) => sum + (s.total_amount ?? 0), 0)

        const stockUnits = products
          .filter((p) => p.is_active)
          .reduce((sum, p) => sum + (p.stock_quantity ?? 0), 0)

        const activeCustomers = new Set(
          sales
            .map((s) => s.customer_id)
            .filter((id): id is string => !!id),
        ).size

        // pagamentos recebidos no período
        const totalReceived = payments.reduce((sum, p) => sum + (p.amount ?? 0), 0)

        // despesas no período
        const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0)

        // custo dos produtos vendidos (baseado em sale_items das vendas do período)
        const saleIdsSet = new Set(sales.map((s) => s.id))
        const itemsOfPeriod = saleItems.filter((it) => saleIdsSet.has(it.sale_id))

        const totalCost = itemsOfPeriod.reduce(
          (sum, it) => sum + it.unit_cost * it.quantity,
          0,
        )

        const totalRevenue = salesTotal
        const grossProfit = totalRevenue - totalCost
        const marginPercent =
          totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

        // break-even simples: soma das despesas do período
        const breakEven = totalExpenses

        // ---------- A receber (parcelas em aberto/parciais) ----------

        // precisamos considerar pagamentos já feitos contra essas parcelas
        const receivableIds = receivables.map((r) => r.id)

        let outstandingByReceivable: Record<string, number> = {}
        if (receivableIds.length > 0) {
          const paymentsForReceivablesRes = await supabase
            .from('payments')
            .select('receivable_id, amount')
            .in('receivable_id', receivableIds)

          if (paymentsForReceivablesRes.error) {
            throw paymentsForReceivablesRes.error
          }

          const payData = (paymentsForReceivablesRes.data ?? []) as {
            receivable_id: string | null
            amount: number
          }[]

          const paidMap = new Map<string, number>()
          for (const p of payData) {
            if (!p.receivable_id) continue
            paidMap.set(
              p.receivable_id,
              (paidMap.get(p.receivable_id) ?? 0) + (p.amount ?? 0),
            )
          }

          outstandingByReceivable = receivables.reduce((acc, r) => {
            const paid = paidMap.get(r.id) ?? 0
            const outstanding = Math.max((r.amount ?? 0) - paid, 0)
            acc[r.id] = outstanding
            return acc
          }, {} as Record<string, number>)
        }

        const totalReceivablesOpen = receivables.reduce(
          (sum, r) => sum + (outstandingByReceivable[r.id] ?? r.amount ?? 0),
          0,
        )

        // ---------- vendas recentes ----------

        const recentSalesSorted = [...sales].sort(
          (a, b) =>
            new Date(b.sale_date).getTime() - new Date(a.sale_date).getTime(),
        )

        const recentSalesList = recentSalesSorted.slice(0, 5).map((s) => {
          const hasReceivables = receivables.some((r) => r.sale_id === s.id)
          const customerName =
            (s.customer_id && customerMap[s.customer_id]) || 'Cliente não identificado'

          return {
            id: s.id,
            customerName,
            totalAmount: s.total_amount ?? 0,
            saleDate: s.sale_date,
            paymentType: hasReceivables ? 'Parcelado / Fiado' : 'À vista',
          }
        })

        // ---------- próximos recebimentos ----------

        const todayStr = new Date().toISOString().slice(0, 10)

        const receivablesUpcoming = receivables
          .filter((r) => r.due_date >= todayStr)
          .sort((a, b) => a.due_date.localeCompare(b.due_date))

        const upcomingList = receivablesUpcoming.slice(0, 5).map((r) => {
          const customerName =
            (r.customer_id && customerMap[r.customer_id]) || 'Cliente não identificado'

          const totalInstallments = Math.max(
            ...receivables
              .filter((x) => x.sale_id === r.sale_id)
              .map((x) => x.installment_number),
          )

          const outstanding = outstandingByReceivable[r.id] ?? r.amount ?? 0

          return {
            id: r.id,
            customerName,
            dueDate: r.due_date,
            amount: outstanding,
            installmentLabel:
              totalInstallments > 0
                ? `${r.installment_number}/${totalInstallments}`
                : `${r.installment_number}`,
          }
        })

        if (cancelled) return

        setSummary({
          salesTotal,
          receivedTotal: totalReceived,
          receivablesOpen: totalReceivablesOpen,
          stockUnits,
          activeCustomers,
        })

        setFinancialState({
          totalRevenue,
          totalCosts: totalCost,
          grossProfit,
          marginPercent,
          breakEven,
        })

        setRecentSales(recentSalesList)
        setUpcomingReceivables(upcomingList)
      } catch (err: any) {
        console.error('[Dashboard] erro ao carregar:', err)
        if (!cancelled) {
          setError('Erro ao carregar dados do dashboard. Tente novamente.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [dateFilter, customStartDate, customEndDate])

  const stats = summary
    ? [
      {
        title: 'Vendas do Período',
        value: formatCurrency(summary.salesTotal),
        icon: ShoppingCart,
        description: 'Total de vendas',
      },
      {
        title: 'Recebido no Período',
        value: formatCurrency(summary.receivedTotal),
        icon: TrendingUp,
        description: 'Pagamentos recebidos',
      },
      {
        title: 'A Receber no período',
        value: formatCurrency(summary.receivablesOpen),
        icon: DollarSign,
        description: 'Parcelas em aberto',
      },
      {
        title: 'Estoque',
        value: `${summary.stockUnits} unidades`,
        icon: Package,
        description: 'Quantidade total em estoque (ativos)',
      },
      {
        title: 'Clientes Ativos',
        value: `${summary.activeCustomers}`,
        icon: Users,
        description: 'Clientes que realizaram compras no período',
      },
    ]
    : []

  const financial = financialMetricsFallback(financialState)
  const breakEvenStatusLabel =
    financial.breakEven <= 0
      ? 'Sem ponto de equilíbrio definido'
      : financial.grossProfit >= financial.breakEven
        ? 'Acima do Break-even'
        : 'Abaixo do Break-even'

  const breakEvenStatusClass =
    financial.breakEven <= 0
      ? 'text-muted-foreground'
      : financial.grossProfit >= financial.breakEven
        ? 'text-emerald-600'
        : 'text-red-600'


  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>
        <Select
          value={dateFilter}
          onValueChange={(val) => setDateFilter(val as DateFilter)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="current-month">Mês Atual</SelectItem>
            <SelectItem value="next-month">Próximo Mês</SelectItem>
            <SelectItem value="last-month">Mês Anterior</SelectItem>
            <SelectItem value="current-quarter">Trimestre Atual</SelectItem>
            <SelectItem value="current-year">Ano Atual</SelectItem>
            <SelectItem value="all-time">Todo Período</SelectItem>
            <SelectItem value="custom">Período Personalizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {dateFilter === 'custom' && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">De</span>
            <Input
              type="date"
              value={customStartDate ?? ''}
              onChange={(e) => setCustomStartDate(e.target.value || null)}
              className="w-[180px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Até</span>
            <Input
              type="date"
              value={customEndDate ?? ''}
              onChange={(e) => setCustomEndDate(e.target.value || null)}
              className="w-[180px]"
            />
          </div>
        </div>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">Carregando dados do dashboard...</p>
      )}

      {error && !loading && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-base sm:text-2xl font-bold leading-tight break-words">{stat.value}</div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Análise Financeira</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Receita Total</p>
                  <p className="text-xl sm:text-2xl font-bold leading-tight break-words">{formatCurrency(financial.totalRevenue)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Custos Totais</p>
                  <p className="text-xl sm:text-2xl font-bold leading-tight break-words text-red-600">{formatCurrency(financial.totalCosts)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Lucro Bruto</p>
                  <p className="text-xl sm:text-2xl font-bold leading-tight break-words text-emerald-600">{formatCurrency(financial.grossProfit)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                  <p className="text-xl sm:text-2xl font-bold leading-tight break-words text-blue-600">{financial.marginPercent.toFixed(1)}%</p>
                </div>
              </div>
              <div className="mt-6 rounded-lg border bg-muted/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Ponto de Equilíbrio (Break-even)
                    </p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(financial.breakEven)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className={`text-lg font-semibold ${breakEvenStatusClass}`}>
                      {breakEvenStatusLabel}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Vendas Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {recentSales.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma venda registrada no período selecionado.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {recentSales.map((sale) => (
                      <div
                        key={sale.id}
                        className="flex items-center justify-between border-b pb-4 last:border-0"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{sale.customerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(sale.saleDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency(sale.totalAmount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {sale.paymentType}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Próximos Recebimentos</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingReceivables.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum recebimento futuro dentro do período selecionado.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {upcomingReceivables.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between border-b pb-4 last:border-0"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{item.customerName}</p>
                          <p className="text-xs text-muted-foreground">
                            Vencimento: {formatDate(item.dueDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {formatCurrency(item.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Parcela {item.installmentLabel}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

// fallback simples para evitar undefined na primeira renderização
function financialMetricsFallback(f: FinancialMetrics | null): FinancialMetrics {
  if (!f) {
    return {
      totalRevenue: 0,
      totalCosts: 0,
      grossProfit: 0,
      marginPercent: 0,
      breakEven: 0,
    }
  }
  return f
}
