"use client"

import { useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"

interface UseCopyOptions {
  successMessage?: string
  errorMessage?: string
}

export function useCopy(options: UseCopyOptions = {}) {
  const { toast } = useToast()
  const {
    successMessage = "Copied to clipboard",
    errorMessage = "Copy failed"
  } = options

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Success",
        description: successMessage
      })
      return true
    } catch {
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      return false
    }
  }, [successMessage, errorMessage, toast])

  return {
    copyToClipboard
  }
}