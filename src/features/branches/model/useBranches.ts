import { useCallback, useEffect, useState } from 'react'
import { BranchesApiError, fetchBranches } from '@/features/branches/api/branchesApi'
import type { Branch } from '@/features/branches/types'

export type BranchesState =
  { status: 'loading' } | { status: 'success'; branches: Branch[] } | { status: 'error'; message: string }

export type UseBranchesResult = BranchesState & { retry: () => void }

const GENERIC_ERROR = 'Something went wrong while loading branches.'

/** Loads the branch list once, tracks loading and failure, and lets the caller retry. */
export function useBranches(): UseBranchesResult {
  const [state, setState] = useState<BranchesState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    fetchBranches(controller.signal)
      .then((branches) => setState({ status: 'success', branches }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        // Only our own errors carry messages that are safe to show; anything else stays generic.
        const message = error instanceof BranchesApiError ? error.message : GENERIC_ERROR
        setState({ status: 'error', message })
      })

    return () => controller.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((count) => count + 1)
  }, [])

  return { ...state, retry }
}
