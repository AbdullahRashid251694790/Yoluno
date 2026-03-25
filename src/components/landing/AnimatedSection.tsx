import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function AnimatedSection({ children, className = "", delay = 0 }: AnimatedSectionProps) {
  const ref = useRef(null);
  const [supportsIO, setSupportsIO] = useState(true);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    if (typeof window.IntersectionObserver === "undefined") {
      setSupportsIO(false);
    }
  }, []);

  const visible = !supportsIO || isInView;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, ease: "easeOut", delay: visible && supportsIO ? delay : 0 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
