interface WaveDividerProps {
  fromColor?: string;
  toColor?: string;
  flip?: boolean;
}

export default function WaveDivider({ fromColor = "#FFFDF7", toColor = "#F5F0E5", flip = false }: WaveDividerProps) {
  return (
    <div className={`w-full overflow-hidden leading-[0] ${flip ? 'rotate-180' : ''}`} style={{ marginTop: '-1px', marginBottom: '-1px' }}>
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="w-full h-[60px] md:h-[80px]"
      >
        <path
          d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,30 1440,40 L1440,80 L0,80 Z"
          fill={toColor}
        />
        <rect width="1440" height="40" fill={fromColor} />
      </svg>
    </div>
  );
}
