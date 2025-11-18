import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Database, Wallet } from "lucide-react";

export const Navbar = () => {
  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded flex items-center justify-center">
              <Database className="w-5 h-5 text-background" />
            </div>
            <span className="text-xl font-bold">
              CloakX
            </span>
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link to="/datasets" className="text-muted-foreground hover:text-foreground transition-colors">
              Datasets
            </Link>
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
          </div>

          <Button className="gap-2">
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </Button>
        </div>
      </div>
    </nav>
  );
};
