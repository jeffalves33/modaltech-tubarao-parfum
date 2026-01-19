// components/mobile-nav.tsx
'use client'

import { Menu, Package, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { LayoutDashboard, Users, ShoppingCart, Receipt, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabaseClient'

interface MobileNavProps {
  currentView: string
  onViewChange: (view: 'dashboard' | 'products' | 'customers' | 'sales' | 'receivables' | 'expenses') => void
}

export function MobileNav({ currentView, onViewChange }: MobileNavProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'sales', label: 'Vendas', icon: ShoppingCart },
    { id: 'receivables', label: 'Contas a Receber', icon: Receipt },
    { id: 'expenses', label: 'Despesas', icon: DollarSign },
  ]

  const handleLogout = async () => {
    try {
      // encerra a sessão do Supabase (remove cookie)
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Erro ao deslogar do Supabase', error)
    } finally {
      // se você ainda quiser limpar qualquer lixo antigo no localStorage:
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('userEmail')

      // redireciona para login
      window.location.href = '/login'
    }
  }

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b bg-card px-4 lg:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex h-16 shrink-0 items-center border-b px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">
                <img
                  src="/icon.png"
                  alt="Logo"
                  className="object-cover"
                />
              </div>
              <span className="text-lg font-semibold">Angel Cosméticos</span>
            </div>
          </div>
          <nav className="flex flex-1 flex-col p-6">
            <ul className="flex flex-1 flex-col gap-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onViewChange(item.id as any)}
                      className={cn(
                        'group flex w-full gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 transition-colors',
                        currentView === item.id
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {item.label}
                    </button>
                  </li>
                )
              })}
            </ul>
            <button
              onClick={handleLogout}
              className="flex w-full gap-x-3 rounded-lg p-3 text-sm font-medium leading-6 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-4"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Sair
            </button>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">
          <img
            src="/icon.png"
            alt="Logo"
            className="object-cover"
          />
        </div>
        <span className="text-lg font-semibold">Angel Cosméticos</span>
      </div>
    </div>
  )
}
