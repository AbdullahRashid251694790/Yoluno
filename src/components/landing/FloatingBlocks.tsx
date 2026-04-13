import { useEffect, useState } from "react";

interface Block {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  shadow: string;
  rotation: number;
  duration: number;
  delay: number;
}

const COLORS = [
  { bg: "hsl(174, 60%, 51%)", shadow: "hsl(174, 60%, 40%)", highlight: "hsl(174, 60%, 65%)" },  // Luno teal
  { bg: "hsl(270, 60%, 70%)", shadow: "hsl(270, 60%, 55%)", highlight: "hsl(270, 60%, 82%)" },  // Lumi purple
  { bg: "hsl(18, 76%, 60%)", shadow: "hsl(18, 76%, 45%)", highlight: "hsl(18, 76%, 75%)" },     // Lolo coral
  { bg: "hsl(45, 78%, 58%)", shadow: "hsl(45, 78%, 43%)", highlight: "hsl(45, 78%, 72%)" },     // Loti gold
];

function generateBlocks(count: number): Block[] {
  const blocks: Block[] = [];
  for (let i = 0; i < count; i++) {
    const colorSet = COLORS[i % COLORS.length];
    blocks.push({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 24 + Math.random() * 32,
      color: colorSet.bg,
      shadow: colorSet.shadow,
      rotation: Math.random() * 30 - 15,
      duration: 12 + Math.random() * 10,
      delay: Math.random() * -20,
    });
  }
  return blocks;
}

export default function FloatingBlocks() {
  const [blocks] = useState(() => generateBlocks(16));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {blocks.map((block) => {
        const colorSet = COLORS[block.id % COLORS.length];
        return (
          <div
            key={block.id}
            className="absolute animate-block-float"
            style={{
              left: `${block.x}%`,
              top: `${block.y}%`,
              animationDuration: `${block.duration}s`,
              animationDelay: `${block.delay}s`,
            }}
          >
            {/* 3D cube with rounded edges */}
            <div
              style={{
                width: block.size,
                height: block.size,
                transform: `rotate(${block.rotation}deg)`,
                position: "relative",
                imageRendering: "pixelated" as any,
              }}
            >
              {/* Top face */}
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "60%",
                  top: 0,
                  borderRadius: block.size * 0.2,
                  background: colorSet.highlight,
                  opacity: 0.18,
                  transform: "skewX(-8deg)",
                  filter: "blur(0.3px)",
                }}
              />
              {/* Front face */}
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  borderRadius: block.size * 0.22,
                  background: block.color,
                  opacity: 0.14,
                  boxShadow: `
                    inset ${block.size * 0.08}px ${-block.size * 0.08}px 0 ${colorSet.highlight},
                    inset ${-block.size * 0.06}px ${block.size * 0.06}px 0 ${colorSet.shadow},
                    0 ${block.size * 0.15}px ${block.size * 0.4}px rgba(0,0,0,0.06)
                  `,
                  border: `1.5px solid ${block.color}`,
                  backdropFilter: "blur(1px)",
                }}
              />
              {/* Pixel dots for texture */}
              <div
                style={{
                  position: "absolute",
                  width: 3,
                  height: 3,
                  top: "25%",
                  left: "25%",
                  background: colorSet.highlight,
                  opacity: 0.25,
                  borderRadius: 1,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  width: 2,
                  height: 2,
                  top: "55%",
                  left: "60%",
                  background: colorSet.highlight,
                  opacity: 0.2,
                  borderRadius: 1,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
