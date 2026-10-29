import { QueryClientProvider } from '@tanstack/react-query'
import { LucideProvider } from 'lucide-react'
import { RouterProvider } from 'react-router'
import { Toaster } from '@/components/ui/Toaster'
import { queryClient } from './queryClient'
import { router } from './router'

/** App-wide providers. Icon defaults follow the Organic guide: Lucide at stroke 2.75. */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LucideProvider size={16} strokeWidth={2.75}>
        <RouterProvider router={router} />
        <Toaster />
      </LucideProvider>
    </QueryClientProvider>
  )
}
