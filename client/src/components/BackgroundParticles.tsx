import React, { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * A visible background component that renders floating particles 
 * to add life and depth to the dark editorial theme.
 * Increased visibility and count for immediate feedback.
 */
export function BackgroundParticles() {
  const particles = useMemo(() => {
    return [...Array(40)].map((_, i) => ({
      id: i,
      size: Math.random() * 3 + 2, // Larger particles
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: Math.random() * 15 + 10, // Faster movement
      delay: Math.random() * -20,
      opacity: Math.random() * 0.5 + 0.3, // More opaque
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#000]">
      {/* Subtle Noise Texture overlay */}
      <div className="absolute inset-0 opacity-[0.05] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* Radial Gradient to give depth */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(15,15,15,1)_0%,rgba(0,0,0,1)_100%)]" />

      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ 
            left: `${p.x}%`, 
            top: `${p.y}%`, 
            opacity: 0 
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, 50, 0],
            opacity: [p.opacity, p.opacity * 1.5, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
          className="absolute rounded-full bg-[#ED1C24] blur-[2px]"
          style={{
            width: p.size,
            height: p.size,
          }}
        />
      ))}
      
      {/* Visible ambient red glows in corners */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#ED1C24]/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#ED1C24]/10 blur-[150px] rounded-full" />
    </div>
  );
}
