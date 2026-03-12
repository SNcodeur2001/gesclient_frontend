import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface PageLayoutProps {
  title: string
  children: React.ReactNode
}

export function PageLayout({ title, children }: PageLayoutProps) {
  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col overflow-hidden pt-5">
      <Sidebar />
      <Header title={title} />
      <main className="ml-[260px] pt-16 flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  )
}