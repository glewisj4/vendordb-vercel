import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  setIsMobileMenuOpen: (open: boolean) => void;
}

export default function MobileHeader({ setIsMobileMenuOpen }: MobileHeaderProps) {
  return (
    <div className="md:hidden bg-white shadow-sm p-4 flex items-center justify-between">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsMobileMenuOpen(true)}
        className="p-2 rounded-lg hover:bg-gray-100"
      >
        <Menu className="h-5 w-5 text-gray-600" />
      </Button>
      <h1 className="text-lg font-semibold text-gray-900">LowesPro</h1>
      <div className="w-8"></div>
    </div>
  );
}
