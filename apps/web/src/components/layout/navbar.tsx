import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";

export default function Navbar() {
  return (
    <nav className="border-b border-border bg-surface shadow-sm sticky top-0 z-50">
      <div className="flex h-16 lg:h-20 items-center px-4 lg:px-8 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center">
          <Logo variant="light" size="sm" className="hidden sm:block" />
          <Logo variant="light" size="xs" className="sm:hidden" />
        </Link>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeToggle />
          <div className="h-6 w-px bg-border hidden sm:block" />
          <div className="flex items-center space-x-2 lg:space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="lg:text-base text-foreground-secondary hover:text-foreground">
                Login
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm" className="lg:text-base px-5">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
