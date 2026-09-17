import { useState } from "react";

const STORAGE_KEY = "promoFinderIntroHidden";

export default function IntroPanel() {
  const [hidden, setHidden] = useState(() => localStorage.getItem(STORAGE_KEY) === "1");

  if (hidden) return null;

  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // private browsing or storage disabled — fine to just hide for this visit
    }
  };

  return (
    <section className="card intro-panel">
      <h2 className="intro-title">How this works, in plain English</h2>
      <p>
        A discount always <em>looks</em> like a win — more units fly off the shelf. But some of
        those "extra" sales aren't really extra.
      </p>
      <p>
        <strong>Some shoppers would've bought anyway</strong> — they just paid less for it.{" "}
        <strong>Some just bought early</strong> — they stocked up, so next month is quieter.
      </p>
      <p>
        This tool calculates the <strong>true extra profit</strong> a discount makes after
        removing both effects, then shows you the discount that actually earns the most.
      </p>
      <button className="btn btn-quiet" onClick={dismiss}>
        Got it, hide this
      </button>
    </section>
  );
}
