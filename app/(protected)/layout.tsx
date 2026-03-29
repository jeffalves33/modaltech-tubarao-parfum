import { MobileNav } from '@/components/mobile-nav'
import { Sidebar } from '@/components/sidebar'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <MobileNav />
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
