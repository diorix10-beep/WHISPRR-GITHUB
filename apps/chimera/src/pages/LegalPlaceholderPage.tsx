interface LegalPlaceholderPageProps {
  title: string;
}

/**
 * The real Terms and Privacy Policy still have to be written and reviewed by a
 * lawyer (they must cover age checks and the data a verification provider uses).
 * This page says so plainly instead of pretending to be the final text.
 */
export default function LegalPlaceholderPage({ title }: LegalPlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-2xl px-5 py-20">
      <p className="mb-3 text-sm font-bold tracking-[0.26em] text-chimera-gold">DRAFT</p>
      <h1 className="font-serif text-5xl font-semibold">{title}</h1>
      <p className="mt-5 text-lg leading-relaxed text-violet-100/85">
        This document is being written and has not been published yet. CHIMERA is for adults aged 18 and over. The final text will explain how your data is used, including any age check, before it applies to you.
      </p>
    </div>
  );
}
