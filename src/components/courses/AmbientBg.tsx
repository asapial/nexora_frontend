export function AmbientBg() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none">
      <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(20,184,166,0.11) 1px,transparent 1px)", backgroundSize: "32px 32px" }} />
      <div className="absolute -top-60 -left-40 w-[600px] h-[600px] rounded-full bg-teal-500/[0.06] blur-[120px]" />
      <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-teal-400/[0.04] blur-[100px]" />
      <div className="absolute -bottom-40 left-1/3 w-[500px] h-[300px] rounded-full bg-amber-500/[0.04] blur-[110px]" />
    </div>
  );
}