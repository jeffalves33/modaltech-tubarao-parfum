import { LayoutDashboard, Package, Users, ShoppingCart, Receipt, DollarSign, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  currentView: string
  onViewChange: (view: 'dashboard' | 'products' | 'customers' | 'sales' | 'receivables' | 'expenses') => void
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Produtos', icon: Package },
    { id: 'customers', label: 'Clientes', icon: Users },
    { id: 'sales', label: 'Vendas', icon: ShoppingCart },
    { id: 'receivables', label: 'Contas a Receber', icon: Receipt },
    { id: 'expenses', label: 'Despesas', icon: DollarSign },
  ]

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userEmail')
    window.location.href = '/login'
  }

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-card px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center border-b">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">
              <img
                src="/icon.jpg"
                alt="Logo"
                className="object-cover"
              />
            </div>
            <span className="text-lg font-semibold">Tubarão Perfum</span>
          </div>
        </div>
        <nav className="flex flex-1 flex-col">
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
      </div>
    </aside>
  )
}
