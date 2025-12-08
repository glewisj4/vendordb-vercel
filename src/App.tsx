import { Switch, Route } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Vendors from "@/pages/vendors";
import Representatives from "@/pages/representatives";
import Categories from "@/pages/categories";
import Services from "@/pages/services";
import ProCustomers from "@/pages/pro-customers";
import TradeDashboard from "@/pages/trade-dashboard";
import { Brands } from "@/pages/brands";
import Sidebar from "@/components/layout/sidebar";
import MobileHeader from "@/components/layout/mobile-header";
import { useState } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/vendors" component={Vendors} />
      <Route path="/representatives" component={Representatives} />
      <Route path="/categories" component={Categories} />
      <Route path="/services" component={Services} />
      <Route path="/brands" component={Brands} />
      <Route path="/pro-customers" component={ProCustomers} />
      <Route path="/trade-dashboard" component={TradeDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="min-h-screen flex bg-gray-50">
        <Sidebar 
          isMobileMenuOpen={isMobileMenuOpen} 
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
        <div className="flex-1 flex flex-col md:ml-0">
          <MobileHeader setIsMobileMenuOpen={setIsMobileMenuOpen} />
          <main className="flex-1">
            <Router />
          </main>
        </div>
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

export default App;
