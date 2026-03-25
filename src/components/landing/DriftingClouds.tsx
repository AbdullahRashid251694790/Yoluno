export default function DriftingClouds() {
  const clouds = [
    { width: 280, top: '8%', left: '-5%', opacity: 0.25, duration: '45s', delay: '0s' },
    { width: 200, top: '25%', left: '60%', opacity: 0.18, duration: '55s', delay: '-15s' },
    { width: 320, top: '50%', left: '10%', opacity: 0.2, duration: '50s', delay: '-8s' },
    { width: 180, top: '70%', left: '75%', opacity: 0.15, duration: '60s', delay: '-25s' },
    { width: 240, top: '85%', left: '30%', opacity: 0.22, duration: '48s', delay: '-20s' },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {clouds.map((cloud, i) => (
        <div
          key={i}
          className="absolute rounded-full cloud-drift"
          style={{
            width: cloud.width,
            height: cloud.width * 0.4,
            top: cloud.top,
            left: cloud.left,
            opacity: cloud.opacity,
            background: 'radial-gradient(ellipse, rgba(180, 222, 215, 0.6) 0%, rgba(224, 242, 241, 0.3) 50%, transparent 70%)',
            filter: 'blur(20px)',
            animationDuration: cloud.duration,
            animationDelay: cloud.delay,
          }}
        />
      ))}
    </div>
  );
}
