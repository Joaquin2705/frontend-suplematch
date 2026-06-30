import { useState, useCallback } from 'react'

export default function useAsyncAction(showToast) {
  const [loading, setLoading] = useState(false)

  const run = useCallback(async (fn) => {
    setLoading(true)
    try {
      return await fn()
    } catch (error) {
      showToast?.(error.message ?? 'Error inesperado')
      return null
    } finally {
      setLoading(false)
    }
  }, [showToast])

  return { run, loading }
}
