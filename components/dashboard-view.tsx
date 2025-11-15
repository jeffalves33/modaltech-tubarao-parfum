'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, Users, Package, ShoppingCart } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function DashboardView() {
  const [dateFilter, setDateFilter] = useState('current-month')

  // Mock data
  const stats = [
    {
      title: 'Vendas do Mês',
      value: 'R$ 15.450,00',
      change: '+12.5%',
      trend: 'up',
      icon: ShoppingCart,
    },
    {
      title: 'A Receber',
      value: 'R$ 8.320,00',
      change: '-5.2%',
      trend: 'down',
      icon: DollarSign,
    },
    {
      title: 'Estoque',
      value: '234 unidades',
      change: '+8 itens',
      trend: 'up',
      icon: Package,
    },
    {
      title: 'Clientes Ativos',
      value: '47',
      change: '+3',
      trend: 'up',
      icon: Users,
    },
  ]

  const financialMetrics = {
    totalRevenue: 15450.00,
    totalCosts: 8500.00,
    grossProfit: 6950.00,
    marginPercent: 45.0,
    breakEven: 8500.00
  }

  const recentSales = [
    { customer: 'Maria Silva', product: 'Chanel Nº 5', value: 450.00, date: '2024-01-15', payment: 'À vista' },
    { customer: 'João Santos', product: 'Dior Sauvage', value: 380.00, date: '2024-01-14', payment: '3x' },
    { customer: 'Ana Costa', product: 'Carolina Herrera', value: 320.00, date: '2024-01-14', payment: 'À vista' },
    { customer: 'Pedro Lima', product: 'Hugo Boss', value: 280.00, date: '2024-01-13', payment: '2x' },
  ]

  const upcomingReceivables = [
    { customer: 'João Santos', dueDate: '2024-02-14', amount: 126.67, installment: '1/3' },
    { customer: 'Carla Souza', dueDate: '2024-02-15', amount: 150.00, installment: '2/4' },
    { customer: 'Lucas Ferreira', dueDate: '2024-02-20', amount: 200.00, installment: '1/2' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>
        <Select value={dateFilter} onValueChange={setDateFilter}>
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
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span className={stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}>
                    {stat.change}
                  </span>
                  {' '}em relação ao mês anterior
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
              <p className="text-2xl font-bold">R$ {financialMetrics.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Custos Totais</p>
              <p className="text-2xl font-bold text-red-600">R$ {financialMetrics.totalCosts.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Lucro Bruto</p>
              <p className="text-2xl font-bold text-emerald-600">R$ {financialMetrics.grossProfit.toFixed(2)}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Margem de Lucro</p>
              <p className="text-2xl font-bold text-blue-600">{financialMetrics.marginPercent.toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-6 rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ponto de Equilíbrio (Break-even)</p>
                <p className="text-lg font-semibold">R$ {financialMetrics.breakEven.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-semibold text-emerald-600">Acima do Break-even</p>
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
            <div className="space-y-4">
              {recentSales.map((sale, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{sale.customer}</p>
                    <p className="text-xs text-muted-foreground">{sale.product}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">R$ {sale.value.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{sale.payment}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Recebimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingReceivables.map((item, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{item.customer}</p>
                    <p className="text-xs text-muted-foreground">Vencimento: {item.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">R$ {item.amount.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">Parcela {item.installment}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
