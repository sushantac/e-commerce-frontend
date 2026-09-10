"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Menu,
  Package,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  User as UserIcon,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { useCart } from "@/hooks/use-cart";
import { getInitials } from "@/lib/utils";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();

  const currentYear = new Date().getFullYear();
  const isAdmin = user?.role === "ADMIN";
  const cartLabel = itemCount > 0 ? `Cart, ${itemCount} items` : "Cart";

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label="Shopsphere home"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ShoppingBag className="h-5 w-5" aria-hidden />
            <span>Shopsphere</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            <Button variant="ghost" asChild>
              <Link href="/products">Products</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/cart" aria-label={cartLabel}>
                <ShoppingCart className="h-4 w-4" aria-hidden />
                Cart
                {itemCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1 h-5 min-w-5 justify-center rounded-full px-1.5"
                  >
                    {itemCount}
                  </Badge>
                )}
              </Link>
            </Button>
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden md:block">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {getInitials(user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="max-w-40 truncate">{user.fullName}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="truncate">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/orders">
                        <Package className="h-4 w-4" aria-hidden />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <ShieldCheck className="h-4 w-4" aria-hidden />
                          Admin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        void handleLogout();
                      }}
                    >
                      <LogOut className="h-4 w-4" aria-hidden />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">Register</Link>
                  </Button>
                </div>
              )}
            </div>

            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu">
                    <Menu className="h-5 w-5" aria-hidden />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                    <SheetDescription>
                      Browse Shopsphere and manage your account.
                    </SheetDescription>
                  </SheetHeader>
                  <nav className="mt-6 flex flex-col gap-1" aria-label="Mobile">
                    <SheetClose asChild>
                      <Button variant="ghost" asChild className="justify-start">
                        <Link href="/products">Products</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button variant="ghost" asChild className="justify-start">
                        <Link href="/cart" aria-label={cartLabel}>
                          <ShoppingCart className="h-4 w-4" aria-hidden />
                          Cart
                          {itemCount > 0 && (
                            <Badge variant="destructive">{itemCount}</Badge>
                          )}
                        </Link>
                      </Button>
                    </SheetClose>

                    {user ? (
                      <>
                        <SheetClose asChild>
                          <Button variant="ghost" asChild className="justify-start">
                            <Link href="/orders">
                              <Package className="h-4 w-4" aria-hidden />
                              My Orders
                            </Link>
                          </Button>
                        </SheetClose>
                        {isAdmin && (
                          <SheetClose asChild>
                            <Button variant="ghost" asChild className="justify-start">
                              <Link href="/admin">
                                <ShieldCheck className="h-4 w-4" aria-hidden />
                                Admin
                              </Link>
                            </Button>
                          </SheetClose>
                        )}
                        <Button
                          variant="ghost"
                          className="justify-start"
                          onClick={() => {
                            void handleLogout();
                          }}
                        >
                          <LogOut className="h-4 w-4" aria-hidden />
                          Logout
                        </Button>
                      </>
                    ) : (
                      <>
                        <SheetClose asChild>
                          <Button variant="ghost" asChild className="justify-start">
                            <Link href="/login">
                              <UserIcon className="h-4 w-4" aria-hidden />
                              Login
                            </Link>
                          </Button>
                        </SheetClose>
                        <SheetClose asChild>
                          <Button variant="ghost" asChild className="justify-start">
                            <Link href="/register">Register</Link>
                          </Button>
                        </SheetClose>
                      </>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="border-t py-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          © {currentYear} Shopsphere. All rights reserved.
        </div>
      </footer>
    </div>
  );
}