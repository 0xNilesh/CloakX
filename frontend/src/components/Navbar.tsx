import { Link } from "react-router-dom";
import { Database } from "lucide-react";
import { WalletConnect } from "./WalletConnect";

export const Navbar = () => {
  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center group-hover:shadow-md transition-shadow">
              <Database className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              CloakX
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/datasets" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Datasets
            </Link>
            <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </div>

          <WalletConnect size="sm" />
        </div>
      </div>
    </nav>
  );
};
