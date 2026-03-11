import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRouter } from './router'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})
function App() {
  console.log('API URL:', import.meta.env.VITE_API_URL)

  return (
    <QueryClientProvider client={queryClient}>
      <AppRouter />
    </QueryClientProvider>
  )
}

export default App