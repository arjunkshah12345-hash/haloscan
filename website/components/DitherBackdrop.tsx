/** Subtle full-page dither texture + optional gradient wash (dither-kit inspired, CSS-only). */
export function DitherBackdrop() {
  return (
    <>
      <div className="dither-noise" aria-hidden />
      <div className="dither-wash dither-wash-hero" aria-hidden />
    </>
  );
}
