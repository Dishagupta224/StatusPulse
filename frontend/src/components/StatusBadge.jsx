function StatusBadge({ status, large = false }) {
  const isUp = status === "up";
  const dotSize = large ? "h-3.5 w-3.5" : "h-2.5 w-2.5";
  const color = isUp ? "bg-[#90C67F]" : "bg-[#E491A6]";
  const label = isUp ? "UP" : "DOWN";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 ${
        isUp
          ? "border-[#90C67F]/40 bg-[#90C67F]/20 text-[#3E5A35]"
          : "border-[#E491A6]/50 bg-[#E491A6]/25 text-[#6E3D4D]"
      }`}
    >
      <span className={`${dotSize} rounded-full ${color} shadow-sm`} />
      <span className={`font-semibold tracking-wide ${large ? "text-sm" : "text-xs"}`}>
        {label}
      </span>
    </span>
  );
}

export default StatusBadge;
