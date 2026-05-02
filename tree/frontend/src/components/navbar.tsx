"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Menu,
  X,
  Home,
  Boxes,
  Activity,
  Earthquake,
  FileText,
  ChevronDown,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "首页", href: "/", icon: Home },
  { 
    name: "模块", 
    href: "#",
    children: [
      { name: "搭建沙盒", href: "/sandbox", icon: Boxes },
      { name: "受力分析", href: "/stress", icon: Activity },
      { name: "抗震推演", href: "/earthquake", icon: Earthquake },
      { name: "图册导出", href: "/export", icon: FileText },
    ]
  },
]

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false)
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-wood-200 bg-wood-100/95 backdrop-blur supports-[backdrop-filter]:bg-wood-100/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">🏯</span>
              <span className="hidden sm:block text-lg font-bold text-wood-800">
                营造法式
              </span>
            </Link>
          </div>

          <div className="hidden md:flex md:items-center md:gap-1">
            {navigation.map((item) => {
              if (item.children) {
                return (
                  <DropdownMenu key={item.name}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="flex items-center gap-1 text-wood-700 hover:text-wood-900 hover:bg-wood-200"
                      >
                        {item.name}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="center"
                      className="w-48 border-wood-200 bg-wood-100"
                    >
                      {item.children.map((child) => (
                        <DropdownMenuItem key={child.name} asChild>
                          <Link
                            href={child.href}
                            className={cn(
                              "flex w-full cursor-pointer items-center gap-2 px-3 py-2",
                              pathname === child.href
                                ? "text-wood-900"
                                : "text-wood-600 hover:text-wood-900"
                            )}
                          >
                            <child.icon className="h-4 w-4" />
                            {child.name}
                          </Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === item.href
                      ? "bg-wood-200 text-wood-900"
                      : "text-wood-700 hover:bg-wood-200 hover:text-wood-900"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="text-wood-700 hover:text-wood-900 hover:bg-wood-200"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-wood-200 bg-wood-100">
          <div className="space-y-1 px-4 pb-3 pt-2">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <>
                    <div className="px-3 py-2 text-sm font-medium text-wood-500">
                      {item.name}
                    </div>
                    {item.children.map((child) => (
                      <Link
                        key={child.name}
                        href={child.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center rounded-lg px-6 py-2 text-sm",
                          pathname === child.href
                            ? "bg-wood-200 text-wood-900"
                            : "text-wood-600 hover:bg-wood-200 hover:text-wood-900"
                        )}
                      >
                        <child.icon className="mr-3 h-4 w-4" />
                        {child.name}
                      </Link>
                    ))}
                  </>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2 text-sm font-medium",
                      pathname === item.href
                        ? "bg-wood-200 text-wood-900"
                        : "text-wood-600 hover:bg-wood-200 hover:text-wood-900"
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
