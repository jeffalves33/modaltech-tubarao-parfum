//app/page.tsx
'use client'

import { useState } from 'react'
import { DashboardView } from '@/components/dashboard-view'
import { ProductsView } from '@/components/products-view'
import { CustomersView } from '@/components/customers-view'
import { SalesView } from '@/components/sales-view'
import { ReceivablesView } from '@/components/receivables-view'
import { ExpensesView } from '@/components/expenses-view'
import { Sidebar } from '@/components/sidebar'
import { MobileNav } from '@/components/mobile-nav'

export default function Page() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'products' | 'customers' | 'sales' | 'receivables' | 'expenses'>('dashboard')

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <div className="flex-1 lg:ml-64">
        <MobileNav currentView={currentView} onViewChange={setCurrentView} />
        <main className="p-4 lg:p-8">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'products' && <ProductsView />}
          {currentView === 'customers' && <CustomersView />}
          {currentView === 'sales' && <SalesView />}
          {currentView === 'receivables' && <ReceivablesView />}
          {currentView === 'expenses' && <ExpensesView />}
        </main>
      </div>
    </div>
  )
}
