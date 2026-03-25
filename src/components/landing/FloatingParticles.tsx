export default function FloatingParticles() {
  const particles = [
    { left: '10%', delay: '0s', duration: '8s', color: 'hsl(var(--gold))' },
    { left: '25%', delay: '2s', duration: '10s', color: 'hsl(var(--luno))' },
    { left: '45%', delay: '1s', duration: '9s', color: 'hsl(var(--gold))' },
    { left: '65%', delay: '3s', duration: '11s', color: 'hsl(var(--luno))' },
    { left: '80%', delay: '0.5s', duration: '8.5s', color: 'hsl(var(--gold))' },
    { left: '90%', delay: '4s', duration: '10s', color: 'hsl(var(--luno))' },
  ];

  return (
    <>
      {particles.map((p, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: p.left,
            bottom: '0',
            animationDelay: p.delay,
            animationDuration: p.duration,
            backgroundColor: p.color,
            opacity: 0.5,
          }}
        />
      ))}
    </>
  );
}
