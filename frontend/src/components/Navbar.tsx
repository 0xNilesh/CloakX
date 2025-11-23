import { Link } from "react-router-dom";
import { Database } from "lucide-react";
import { WalletConnect } from "./WalletConnect";

export const Navbar = () => {
  return (
    <nav className="border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
              <Database className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              CloakX
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link to="/datasets" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200">
              Datasets
            </Link>
            <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-200">
              Dashboard
            </Link>
          </div>

          <WalletConnect size="sm" />
        </div>
      </div>
    </nav>
  );
};
