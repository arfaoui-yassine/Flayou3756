import React from "react";
import { useLocation } from "wouter";
import { Home, MessageCircle, ShoppingBag, User } from "lucide-react";

export function Navigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", label: "البيت", icon: Home },
    { path: "/quiz", label: "أسئلة", icon: MessageCircle },
    { path: "/marchi", label: "السوق", icon: ShoppingBag },
    { path: "/profile", label: "حسابي", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#222] bg-black/95 backdrop-blur-sm">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-around items-center h-16">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location === item.path;

            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className="flex flex-col items-center justify-center gap-0.5 px-4 py-2 transition-colors relative"
              >
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className={`transition-colors ${
                    isActive ? "text-[#ED1C24]" : "text-[#666]"
                  }`}
                />
                <span
                  className={`text-[10px] font-medium tracking-wide transition-colors ${
                    isActive ? "text-white" : "text-[#666]"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
