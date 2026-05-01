import React from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Home, Zap, ShoppingCart, User, Dice5 } from "lucide-react";

export function Navigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { path: "/", label: "البيت", icon: Home },
    { path: "/quiz", label: "أسئلة", icon: Zap },
    { path: "/marchi", label: "El Marchi", icon: ShoppingCart },
    { path: "/roue", label: "الحظ", icon: Dice5 },
    { path: "/profile", label: "الملف", icon: User },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-black border-t border-red-600/30 shadow-lg z-40"
    >
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-around items-center h-20">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location === item.path;

            return (
              <motion.button
                key={item.path}
                onClick={() => setLocation(item.path)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? "text-red-500 bg-red-950/30"
                    : "text-gray-400 hover:text-red-500"
                }`}
              >
                <Icon size={24} />
                <span className="text-xs font-semibold">{item.label}</span>

                {isActive && (
                  <motion.div
                  layoutId="activeIndicator"
                  className="absolute bottom-0 h-1 bg-red-600 rounded-t-lg w-12"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
