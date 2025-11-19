import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Database, Zap, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { WalletConnect } from "@/components/WalletConnect";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                Private Data Marketplace
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Contribute encrypted data and earn rewards. Request secure
                computations on sensitive datasets without exposure.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button asChild size="lg" className="font-medium">
                <Link to="/datasets">Explore Datasets</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="font-medium"
              >
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6 p-8 border border-border rounded-lg bg-card">
              <div className="space-y-3">
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Seal Encryption</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Data is encrypted client-side before upload. Only authorized
                  parties with decryption keys can access the content.
                </p>
              </div>
            </div>

            <div className="space-y-6 p-8 border border-border rounded-lg bg-card">
              <div className="space-y-3">
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                  <Database className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Walrus Storage</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Decentralized storage ensures data availability, redundancy,
                  and immutability across a distributed network.
                </p>
              </div>
            </div>

            <div className="space-y-6 p-8 border border-border rounded-lg bg-card">
              <div className="space-y-3">
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Nautilus TEE</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Trusted Execution Environments provide isolated computation
                  spaces where data remains encrypted during processing.
                </p>
              </div>
            </div>

            <div className="space-y-6 p-8 border border-border rounded-lg bg-card">
              <div className="space-y-3">
                <div className="w-10 h-10 bg-primary/10 rounded flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Fair Compensation</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Data contributors earn SUI tokens when their datasets are used
                  in computations. Transparent, on-chain rewards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Ready to Participate?
              </h2>
              <p className="text-muted-foreground text-lg">
                Join a privacy-preserving data marketplace. Contribute, compute,
                and earn rewards securely.
              </p>
            </div>
            <WalletConnect size="lg" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
