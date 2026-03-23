"use client"

import { useTranslations, useLocale } from "next-intl"
import { Mail, Github, Heart, Book } from "lucide-react"
import Link from "next/link"

export function Footer() {
  const t = useTranslations("common.footer")
  const locale = useLocale()
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                If<span className="text-primary">Mail</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              {t("description")}
            </p>
          </div>

          {/* Links */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t("links")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${locale}`} className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("home")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/login`} className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("login")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/pricing`} className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("pricing")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/docs`} className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5">
                  <Book className="w-3.5 h-3.5" />
                  {t("apiDocs")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/privacy`} className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("privacy")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/terms`} className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("terms")}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/about`} className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("about")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Open Source */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t("openSource")}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("openSourceDesc")}
            </p>
            <a
              href="https://github.com/beilunyang/moemail"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; {year} IfMail. {t("rights")}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {t("madeWith")} <Heart className="w-3 h-3 text-red-500 fill-red-500" />{" "}
            <a
              href="https://github.com/beilunyang/moemail"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors underline underline-offset-2"
            >
              {t("by")}
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
