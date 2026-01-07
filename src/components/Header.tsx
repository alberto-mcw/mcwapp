import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MasterChefLogo } from "./MasterChefLogo";
import { Menu, X, Download } from "lucide-react";
import { Button } from "./ui/button";

const navItems = [
  { label: "Ranking", href: "/ranking" },
  { label: "Calendario", href: "/calendario" },
  { label: "Bases", href: "/bases" },
  { label: "Contacto", href: "/contacto" },
];

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <MasterChefLogo className="w-8 h-8" />
            <span className="font-unbounded font-bold text-sm hidden sm:block">
              EL RETO 2026
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link to="/descarga">
                <Download className="w-4 h-4" />
                Descargar App
              </Link>
            </Button>
            <Button asChild size="sm" className="gap-2">
              <a href="/#registro">
                Apúntate
              </a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-foreground"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <nav className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`text-sm font-medium py-2 transition-colors ${
                    location.pathname === item.href
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-3 border-t border-border mt-2">
                <Button asChild size="sm" variant="outline" className="gap-2 w-full">
                  <Link to="/descarga" onClick={() => setIsMenuOpen(false)}>
                    <Download className="w-4 h-4" />
                    Descargar App
                  </Link>
                </Button>
                <Button asChild size="sm" className="gap-2 w-full">
                  <a href="/#registro" onClick={() => setIsMenuOpen(false)}>
                    Apúntate al Reto
                  </a>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
