import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';

type Choice = { label: string; reply: string; ending: string };

const choices: Choice[] = [
  {
    label: 'I’m looking for a place I’ve only seen in dreams.',
    reply: 'Lyra raises her lantern. Inside its glass, a tiny sea rolls beneath a violet sky. “Then you already know the way. Dreams are maps that haven’t learned their own names.”',
    ending: 'The gate opens onto a moonlit shore. A ship with no captain waits for you. Lyra holds out a compass. “Shall we find out who sent it?”',
  },
  {
    label: 'I’m leaving something behind.',
    reply: 'Lyra steps aside, making room beside the lantern. “You don’t have to tell me what it is. But you do get to choose what comes with you.” She offers you a small, empty notebook.',
    ending: 'Beyond the gate, a city hangs among the stars. The notebook opens to its first page, where a single sentence appears: Your story starts here. “What will you write?” Lyra asks.',
  },
  {
    label: 'First, tell me what’s on the other side.',
    reply: 'Lyra smiles. “A sensible question. Yesterday it was a forest. This morning, a library. The gate has a habit of listening.” She places her hand against the stone. From within, you hear a distant bell.',
    ending: 'The gate reveals a library with trees growing between its shelves. One book is ringing softly. Lyra lifts an eyebrow. “I think someone has been waiting for your question.”',
  },
];

export default function SampleStoryPage() {
  const [choice, setChoice] = useState<Choice | null>(null);
  const [finished, setFinished] = useState(false);

  function restart() {
    setChoice(null);
    setFinished(false);
  }

  return (
    <main className="min-h-screen bg-[#07080c] px-4 py-8 text-white sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 rounded-lg py-2 text-sm text-[#f8d796] underline-offset-4 hover:underline"><ArrowLeft size={16} /> Back to CHIMERA</Link>
        <section aria-labelledby="sample-title" className="mt-6 rounded-3xl border border-[#f5d18c]/25 bg-[#101018] p-5 sm:p-8">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#f8d796]"><Sparkles size={16} /> Sample story</p>
          <h1 id="sample-title" className="mt-3 font-serif text-3xl font-black text-white sm:text-5xl">Lyra and the forgotten gate</h1>
          <p className="mt-4 text-sm leading-6 text-white/70">A short, scripted preview with an original fictional character. Choose a reply to explore the scene. No account or Shards required; these responses are prewritten.</p>
          <p className="mt-7 text-base leading-7 text-white/80">At the end of a rain-soaked street, a stone doorway glows with warm light. Its keeper turns toward you, a lantern in her hand.</p>
          <div role="log" aria-label="Your scene with Lyra" aria-live="polite" aria-relevant="additions" className="mt-5 space-y-5">
            <div className="rounded-2xl border border-[#f5d18c]/20 bg-[#f5d18c]/5 p-5">
              <h2 className="text-sm font-bold text-[#f8d796]">Lyra</h2>
              <p className="mt-2 font-serif text-lg leading-7">“You found the gate. Most people walk right past it. Tell me—are you looking for something, or leaving something behind?”</p>
            </div>
            {choice && <>
              <div className="rounded-2xl border border-white/15 bg-white/5 p-5"><h2 className="text-sm font-bold text-white/70">You</h2><p className="mt-2 leading-7">{choice.label}</p></div>
              <div className="rounded-2xl border border-[#f5d18c]/20 bg-[#f5d18c]/5 p-5"><h2 className="text-sm font-bold text-[#f8d796]">Lyra</h2><p className="mt-2 font-serif text-lg leading-7">{choice.reply}</p></div>
            </>}
            {finished && choice && <div className="rounded-2xl border border-[#f5d18c]/20 bg-[#f5d18c]/5 p-5"><h2 className="text-sm font-bold text-[#f8d796]">Beyond the gate</h2><p className="mt-2 font-serif text-lg leading-7">{choice.ending}</p></div>}
          </div>
          {!choice ? <fieldset className="mt-6 space-y-3">
            <legend className="mb-3 text-sm font-bold text-white/80">What do you say?</legend>
            {choices.map((option) => <button key={option.label} onClick={() => setChoice(option)} className="block w-full rounded-2xl border border-[#f5d18c]/35 px-4 py-4 text-left text-sm leading-6 text-[#f8d796] transition hover:bg-[#f5d18c]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f5d18c]">{option.label}</button>)}
          </fieldset> : !finished ? <button onClick={() => setFinished(true)} className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#f5d18c] px-5 py-3 font-bold text-[#171006] hover:bg-[#ffe0a3]">Step through the gate <ArrowRight size={16} /></button> : <div className="mt-7 rounded-2xl border border-white/15 p-5">
            <h2 className="font-serif text-2xl font-bold text-white">What story will you create?</h2>
            <p className="mt-3 text-sm leading-6 text-white/75">That’s the end of this sample. Create your own character to start an AI roleplay conversation. You’ll need an account; AI chats use Shards.</p>
            <Link to="/characters/new" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[#f5d18c] px-5 py-3 font-bold text-[#171006] hover:bg-[#ffe0a3]">Create your own character <ArrowRight size={16} /></Link>
          </div>}
          {choice && <button onClick={restart} className="mt-5 inline-flex items-center gap-2 rounded-lg py-2 text-sm text-white/75 underline-offset-4 hover:underline"><RotateCcw size={15} /> Try another path</button>}
        </section>
      </div>
    </main>
  );
}
