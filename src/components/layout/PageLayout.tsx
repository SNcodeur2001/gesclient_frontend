import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface PageLayoutProps {
  title: string
  children: React.ReactNode
}

export function PageLayout({ title, children }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <Header title={title} />
      <main className="ml-[260px] pt-16 p-6 min-h-screen">
        {children}
      </main>
    </div>
  )
}