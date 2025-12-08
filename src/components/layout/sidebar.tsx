import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { HardHat, ChartPie, Building, Users, Tags, User, Settings, Briefcase, Activity, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Vendor, type Representative, type Category, type Service, type ProCustomer } from "@shared/schema";

interface SidebarProps {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export default function Sidebar({ isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
  const [location] = useLocation();

  // Get actual counts from API
  const { data: vendors = [] } = useQuery<Vendor[]>({
    queryKey: ["/api/vendors"],
  });

  const { data: representatives = [] } = useQuery<Representative[]>({
    queryKey: ["/api/representatives"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: services = [] } = useQuery<Service[]>({
    queryKey: ["/api/services"],
  });

  const { data: proCustomers = [] } = useQuery<ProCustomer[]>({
    queryKey: ["/api/pro-customers"],
  });

  const { data: brands = [] } = useQuery<any[]>({
    queryKey: ["/api/brands"],
  });

  const menuItems = [
    { href: "/", label: "Dashboard", icon: ChartPie, badge: null },
    { href: "/trade-dashboard", label: "Trade Dashboard", icon: Activity, badge: null },
    { href: "/vendors", label: "Vendors", icon: Building, badge: vendors.length > 0 ? vendors.length.toString() : null },
    { href: "/representatives", label: "Sales Reps", icon: Users, badge: representatives.length > 0 ? representatives.length.toString() : null },
    { href: "/brands", label: "Brands", icon: Package, badge: brands.length > 0 ? brands.length.toString() : null },
    { href: "/pro-customers", label: "Pro Customers", icon: Briefcase, badge: proCustomers.length > 0 ? proCustomers.length.toString() : null },
    { href: "/categories", label: "Categories", icon: Tags, badge: categories.length > 0 ? categories.length.toString() : null },
    { href: "/services", label: "Services", icon: Settings, badge: services.length > 0 ? services.length.toString() : null },
  ];

  const isActive = (href: string) => {
    if (href === "/" && (location === "/" || location === "/dashboard")) return true;
    return location === href;
  };

  return (
    <div 
      className={cn(
        "w-64 bg-white construction-shadow-lg flex flex-col fixed h-full z-30 md:relative md:translate-x-0 transform transition-transform duration-300 ease-in-out",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <HardHat className="text-white h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">LowesPro</h1>
            <p className="text-sm text-gray-500">Vendor Management</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
            >
              <div
                className={cn(
                  "flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-colors cursor-pointer",
                  isActive(item.href)
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span 
                    className={cn(
                      "ml-auto text-xs px-2 py-1 rounded-full",
                      isActive(item.href)
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-700"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Admin User</p>
            <p className="text-xs text-gray-500">System Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}
