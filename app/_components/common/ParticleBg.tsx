"use client";

const STARS = [
  { size: 2.5, x: "10%", y: "14%", delay: "0s", dur: "14s" },
  { size: 2, x: "26%", y: "52%", delay: "3s", dur: "16s" },
  { size: 3, x: "44%", y: "10%", delay: "6s", dur: "13s" },
  { size: 1.5, x: "58%", y: "72%", delay: "2s", dur: "15s" },
  { size: 2.5, x: "74%", y: "20%", delay: "5s", dur: "14s" },
  { size: 1.5, x: "90%", y: "55%", delay: "8s", dur: "17s" },
  { size: 2, x: "16%", y: "82%", delay: "4s", dur: "12s" },
  { size: 3, x: "66%", y: "6%", delay: "9s", dur: "13.5s" },
];

// Large static light blooms (lens flares)
const BLOOMS = [
  { size: 120, x: "82%", y: "12%", opacity: 0.06 },
  { size: 90, x: "15%", y: "75%", opacity: 0.05 },
];

export default function ParticleBg() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[2] overflow-hidden" aria-hidden>
      <style>{`
        @keyframes float {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.2; }
          30% { transform: translateY(-35px) translateX(14px) scale(1.5); opacity: 0.55; }
          60% { transform: translateY(-55px) translateX(-10px) scale(0.85); opacity: 0.3; }
          100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.2; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.65; }
        }
      `}</style>

      {/* Light blooms */}
      {BLOOMS.map((b, i) => (
        <span
          key={`bloom-${i}`}
          style={{
            position: "absolute",
            left: b.x,
            top: b.y,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(200,210,240,0.25) 0%, rgba(170,185,220,0.08) 30%, transparent 70%)",
            boxShadow: `0 0 ${b.size * 1.5}px ${b.size * 0.3}px rgba(180,190,220,0.1)`,
            opacity: b.opacity,
          }}
        />
      ))}

      {/* Floating stars */}
      {STARS.map((s, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: s.x,
            top: s.y,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(225,230,250,0.8) 0%, rgba(180,195,230,0.25) 35%, transparent 65%)",
            boxShadow: `0 0 ${s.size * 9}px ${s.size * 2}px rgba(185,195,225,0.2)`,
            animation: `float ${s.dur} ease-in-out ${s.delay} infinite, pulse ${Number(s.dur) * 0.5}s ease-in-out ${s.delay} infinite`,
          }}
        />
      ))}
    </div>
  );
}
