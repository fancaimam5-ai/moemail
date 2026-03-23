import Link from "next/link"
import { Mail, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 px-4">
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 dark:from-primary/20 dark:to-purple-500/20 flex items-center justify-center shadow-lg shadow-primary/10">
          <Mail className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
          404
        </h1>
        <h2 className="text-2xl font-semibold text-foreground">
          Page Not Found
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-medium hover:from-primary/90 hover:to-purple-600/90 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  )
}
