import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shield, Database, Zap, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative">
        <div className="container mx-auto px-4 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Private Data Marketplace
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Contribute to curated datasets without exposing raw data. Powered by Seal encryption, Walrus storage, and Nautilus TEE computing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link to="/datasets">Browse Datasets</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/dashboard">View Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Seal Encryption</h3>
            <p className="text-muted-foreground">
              Your data is encrypted before upload, ensuring complete privacy and security.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center mb-4">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Walrus Storage</h3>
            <p className="text-muted-foreground">
              Decentralized storage on Walrus ensures data availability and immutability.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nautilus TEE</h3>
            <p className="text-muted-foreground">
              Secure computations in Trusted Execution Environments protect data during processing.
            </p>
          </Card>

          <Card className="p-6">
            <div className="w-12 h-12 bg-secondary rounded flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Earn Rewards</h3>
            <p className="text-muted-foreground">
              Contributors earn SUI tokens whenever their data is used in computations.
            </p>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <Card className="p-12 text-center border-2">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join the future of private data sharing. Contribute or compute with confidence.
          </p>
          <Button size="lg">
            Connect Your Wallet
          </Button>
        </Card>
      </section>
    </div>
  );
};

export default Home;
