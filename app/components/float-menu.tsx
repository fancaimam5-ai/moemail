"use client"

import { useTranslations, useLocale } from "next-intl"
import { usePathname } from "next/navigation"
import { Github, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useUserRole } from "@/hooks/use-user-role"
import Link from "next/link"

export function FloatMenu() {
  const t = useTranslations("common")
  const pathname = usePathname()
  const locale = useLocale()
  const { role } = useUserRole()
  
  // 在分享页面隐藏GitHub悬浮框
  if (pathname.includes("/shared/")) {
    return null
  }

  // Hide on admin pages
  if (pathname.includes("/admin")) {
    return null
  }
  
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {role === "emperor" && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="bg-white dark:bg-background rounded-full shadow-lg group relative border-primary/20"
                asChild
              >
                <Link href={`/${locale}/admin`}>
                  <Shield className="w-4 h-4 transition-all duration-300 text-primary group-hover:scale-110" />
                  <span className="sr-only">Admin Panel</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">Admin Panel</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-white dark:bg-background rounded-full shadow-lg group relative border-primary/20"
              onClick={() => window.open("https://github.com/beilunyang/moemail", "_blank")}
            >
              <Github 
                className="w-4 h-4 transition-all duration-300 text-primary group-hover:scale-110"
              />
              <span className="sr-only">{t("github")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p>{t("github")}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
} 