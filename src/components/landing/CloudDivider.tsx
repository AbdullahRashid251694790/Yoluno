interface CloudDividerProps {
  flip?: boolean;
}

export default function CloudDivider({ flip = false }: CloudDividerProps) {
  return (
    <div
      className={`w-full overflow-hidden leading-[0] pointer-events-none ${flip ? "rotate-180" : ""}`}
      style={{ marginTop: "-1px", marginBottom: "-1px" }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className="w-full h-[60px] md:h-[100px]"
      >
        <path
          d="M0,60 C120,100 240,20 480,60 C600,80 720,30 960,70 C1080,90 1200,40 1440,60 L1440,120 L0,120 Z"
          fill="rgba(180, 222, 215, 0.15)"
        />
        <path
          d="M0,80 C180,50 360,100 600,70 C780,50 960,90 1200,60 C1320,50 1400,75 1440,80 L1440,120 L0,120 Z"
          fill="rgba(180, 222, 215, 0.1)"
        />
      </svg>
    </div>
  );
}
