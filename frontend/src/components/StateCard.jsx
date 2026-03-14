function StateCard({
  title,
  description,
  actionLabel,
  onAction,
  tone = "neutral",
}) {
  const toneClasses =
    tone === "error"
      ? "border-[#E491A6]/45 bg-[#FFF7F9] text-[#6E3D4D]"
      : "border-slate-200/80 bg-white text-slate-700";

  return (
    <div className={`glass-card rounded-2xl border p-6 ${toneClasses}`}>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-inherit/80">{description}</p>
      {actionLabel && onAction ? (
        <button
          className="mt-4 rounded-full border border-current/20 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
          onClick={onAction}
          type="button"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export default StateCard;
