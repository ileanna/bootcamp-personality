import React, { useMemo, useState } from "react";

/**
 * Bootcamp Personality Test – Simple Web App (React, single-file)
 * ---------------------------------------------------------------
 * How to use:
 * - Drop this file into a React/Vite project, or into any environment that supports React.
 * - It uses Tailwind classes for styling (optional). If you don't use Tailwind, it will still work but look simpler.
 * - No backend required. Results are computed client-side. You can export CSV.
 */

// ----------------------
// Test configuration
// ----------------------
const QUESTIONS = [
  {
    title: "1. In a new project, I naturally want to…",
    a: "A) Step up, set direction, and organize the team",
    b: "B) Support the team, execute tasks, and make sure things get done",
  },
  {
    title: "2. In client meetings, I often…",
    a: "A) Take the lead in presenting or structuring the conversation",
    b: "B) Listen closely, provide inputs, and back up others’ points",
  },
  {
    title: "3. After a long workday, I feel recharged by…",
    a: "A) Social time with colleagues or friends",
    b: "B) Quiet time alone or working on personal projects",
  },
  {
    title: "4. On a team, I usually prefer…",
    a: "A) Brainstorming ideas in a group setting",
    b: "B) Working independently to polish or deepen an idea",
  },
  {
    title: "5. When solving problems, I gravitate toward…",
    a: "A) Applying frameworks, methods, and structured approaches",
    b: "B) Exploring unusual, creative, or “out of the box” solutions",
  },
  {
    title: "6. If given a vague challenge, my first instinct is to…",
    a: "A) Break it down into clear steps and a logical process",
    b: "B) Generate lots of ideas and see what feels promising",
  },
  {
    title: "7. I feel most “in my zone” when…",
    a: "A) Talking with clients, facilitating workshops, or presenting insights",
    b: "B) Diving into data, coding, or building technical solutions",
  },
  {
    title: "8. The part of consulting that excites me most is…",
    a: "A) Advising and guiding people through complex change",
    b: "B) Mastering tools, models, and technical challenges",
  },
  {
    title: "9. In group settings, others might describe me as…",
    a: "A) Outgoing, energetic, and easy to engage with",
    b: "B) Thoughtful, reflective, and a calming presence",
  },
  {
    title: "10. When deadlines are tight, I usually…",
    a: "A) Rally the group, motivate, and drive progress",
    b: "B) Put my head down, focus, and quietly deliver results",
  },
];

// Question indices grouped by dimension (0-based)
const DIMENSIONS = {
  Direction: { code: ["D", "E"], q: [0, 1, 9] }, // Q1,2,10
  Energy: { code: ["C", "O"], q: [2, 3, 8] }, // Q3,4,9
  Thinking: { code: ["A", "X"], q: [4, 5], tiebreak: 5 }, // tie-break prefers Q6
  Work: { code: ["V", "S"], q: [6, 7], tiebreak: 7 }, // tie-break prefers Q8
};

// Fallback archetypes (edit as you like)
const ARCHETYPES = {
  // D = Driver, E = Enabler | C = Connector, O = Concentrator
  // A = Architect, X = Explorer | V = Advisor, S = Specialist

  // Driver (D)
  DCAV: {
    name: "Trailblazer", emoji: "🔥",
    description: "Leads from the front, energizes rooms, structures ambiguity fast."
  },
  DCAS: {
    name: "Bridge", emoji: "🌉",
    description: "Leads with clarity and connects business and tech seamlessly."
  },
  DCXV: {
    name: "Visionary", emoji: "🌟",
    description: "Charismatic idea-starter who rallies people around bold directions."
  },
  DCXS: {
    name: "Showrunner", emoji: "🎬",
    description: "Turns ideas into demos; shines in high-energy showcases."
  },
  DOAV: {
    name: "Strategist", emoji: "🧠",
    description: "Calm, structured leader; converts complexity into clear plays."
  },
  DOAS: {
    name: "Engineer", emoji: "🛠️",
    description: "Hands-on technical leader; sets standards and unblocks delivery."
  },
  DOXV: {
    name: "Pioneer", emoji: "🚀",
    description: "Bold path-finder who pushes into new terrain and experiments."
  },
  DOXS: {
    name: "Maverick", emoji: "⚡️",
    description: "Independent builder who prototypes fast and challenges assumptions."
  },

  // Enabler (E)
  ECAV: {
    name: "Coordinator", emoji: "🗂️",
    description: "Keeps people aligned; facilitates momentum and crisp handoffs."
  },
  ECAS: {
    name: "Integrator", emoji: "🤝",
    description: "The glue—balances relationships with structured, steady delivery."
  },
  ECXV: {
    name: "Evangelist", emoji: "📣",
    description: "Social catalyst who spreads ideas and energizes collaboration."
  },
  ECXS: {
    name: "Prototyper", emoji: "🧪",
    description: "Builds scrappy proofs to learn quickly with the team."
  },
  EOAV: {
    name: "Analyst", emoji: "📊",
    description: "Quietly rigorous; frames decisions with data and logic."
  },
  EOAS: {
    name: "Builder", emoji: "🧱",
    description: "Dependable executor; brings order, detail, and quality control."
  },
  EOXV: {
    name: "Pathfinder", emoji: "🧭",
    description: "Explores options, spots risks early, and guides next steps."
  },
  EOXS: {
    name: "Specialist", emoji: "🔍",
    description: "Deep technical craftsperson; ensures correctness and rigor."
  },
};

function computeLettersFromAnswers(answers) {
  // answers: array of "A" | "B" (or undefined)
  const pick = (idx) => (answers[idx] || "").toUpperCase();

  const countAB = (indices, tiebreakIndex = null) => {
    let a = 0,
      b = 0;
    indices.forEach((i) => {
      const v = pick(i);
      if (v === "A") a += 1;
      else if (v === "B") b += 1;
    });
    if (a === b && tiebreakIndex !== null) {
      const t = pick(tiebreakIndex);
      if (t === "A") a += 1;
      else if (t === "B") b += 1;
    }
    return a >= b ? "A" : "B";
  };

  const dirAB = countAB(DIMENSIONS.Direction.q);
  const engAB = countAB(DIMENSIONS.Energy.q);
  const thinkAB = countAB(DIMENSIONS.Thinking.q, DIMENSIONS.Thinking.tiebreak);
  const workAB = countAB(DIMENSIONS.Work.q, DIMENSIONS.Work.tiebreak);

  return {
    Direction: dirAB === "A" ? DIMENSIONS.Direction.code[0] : DIMENSIONS.Direction.code[1],
    Energy: engAB === "A" ? DIMENSIONS.Energy.code[0] : DIMENSIONS.Energy.code[1],
    Thinking: thinkAB === "A" ? DIMENSIONS.Thinking.code[0] : DIMENSIONS.Thinking.code[1],
    Work: workAB === "A" ? DIMENSIONS.Work.code[0] : DIMENSIONS.Work.code[1],
  };
}

function answersToCode(answers) {
  const letters = computeLettersFromAnswers(answers);
  return {
    letters,
    code: `${letters.Direction}${letters.Energy}${letters.Thinking}${letters.Work}`,
  };
}

function downloadCSV(filename, rows) {
  const process = (row) =>
    row
      .map((v) => {
        if (v == null) return "";
        const s = String(v).replaceAll('"', '""');
        if (s.search(/[",\n]/) >= 0) return `"${s}"`;
        return s;
      })
      .join(",");

  const csv = rows.map(process).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function ProgressBar({ current, total }) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div className="w-full h-2 bg-gray-200 rounded">
      <div
        className="h-2 bg-gray-900 rounded"
        style={{ width: `${pct}%` }}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        role="progressbar"
      />
    </div>
  );
}

function RadioCard({ name, value, onChange, label }) {
  const id = `${name}-${label.startsWith("A") ? "A" : "B"}`;
  return (
    <label
      htmlFor={id}
      className={`block border rounded-2xl p-4 cursor-pointer transition shadow-sm hover:shadow ${value === label[0] ? "border-gray-900" : "border-gray-200"
        }`}
    >
      <input
        id={id}
        type="radio"
        name={name}
        value={label[0]}
        checked={value === label[0]}
        onChange={(e) => onChange(e.target.value)}
        className="mr-3"
      />
      <span className="align-middle">{label}</span>
    </label>
  );
}

function ResultCard({ answers, onReset }) {
  const { letters, code } = useMemo(() => answersToCode(answers), [answers]);
  const arch = ARCHETYPES[code] || {
    name: "Your Blend",
    emoji: "✨",
    description:
      "A unique blend of strengths across leadership, energy, thinking, and orientation.",
  };

  const handleExport = () => {
    const header = [
      "Timestamp",
      "Code",
      "Direction",
      "Energy",
      "Thinking",
      "Work",
      ...QUESTIONS.map((q, i) => `Q${i + 1}`),
    ];

    const row = [
      new Date().toISOString(),
      code,
      letters.Direction,
      letters.Energy,
      letters.Thinking,
      letters.Work,
      ...answers,
    ];

    downloadCSV("bootcamp_personality_result.csv", [header, row]);
  };

  const shareUrl = useMemo(() => {
    try {
      const payload = btoa(JSON.stringify({ a: answers }));
      const url = new URL(window.location.href);
      url.hash = `#r=${payload}`;
      return url.toString();
    } catch {
      return window.location.href;
    }
  }, [answers]);

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard!");
    } catch {
      alert("Could not copy link. You can copy it manually from the textbox.");
    }
  };

  // Mapping to human-readable explanations
  const legend = [
    { key: "Direction", pair: "D/E", val: letters.Direction, map: { D: "Driver", E: "Enabler" } },
    { key: "Energy", pair: "C/O", val: letters.Energy, map: { C: "Connector", O: "Concentrator" } },
    { key: "Thinking", pair: "A/X", val: letters.Thinking, map: { A: "Architect", X: "Explorer" } },
    { key: "Work", pair: "V/S", val: letters.Work, map: { V: "Advisor", S: "Specialist" } },
  ];

  return (
    <div className="rounded-2xl border shadow p-6 bg-white">
      {/* 1) Big, clear code */}
      <div className="text-center">
        <div className="text-sm text-gray-500">Your 4-letter code</div>
        <div className="mt-1 text-4xl sm:text-5xl font-extrabold tracking-widest">{code}</div>
      </div>

      {/* 2) Explain what each letter means */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {legend.map((row) => (
          <div key={row.key} className="rounded-xl border p-4">
            <div className="text-xs uppercase tracking-wide text-gray-500">{row.key}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg font-semibold">{row.val}</span>
              <span className="text-xs text-gray-500">({row.pair})</span>
            </div>
            <div className="text-gray-700">{row.map[row.val]}</div>
          </div>
        ))}
      </div>

      {/* 3) Archetype badge + description */}
      <div className="mt-6 rounded-xl border p-5">
        <div className="text-sm text-gray-500">Archetype</div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-2xl">{arch.emoji}</span>
          <div className="text-xl font-semibold">{arch.name}</div>
        </div>
        <p className="text-gray-700 mt-2">{arch.description}</p>
      </div>

      {/* 4) Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => {
            const header = [
              "Timestamp", "Code", "Direction", "Energy", "Thinking", "Work",
              ...QUESTIONS.map((_, i) => `Q${i + 1}`),
            ];
            const row = [
              new Date().toISOString(),
              code,
              letters.Direction,
              letters.Energy,
              letters.Thinking,
              letters.Work,
              ...answers,
            ];
            downloadCSV("bootcamp_personality_result.csv", [header, row]);
          }}
          className="px-4 py-2 rounded-xl border shadow hover:shadow-md"
        >
          Export CSV
        </button>

        <button
          onClick={() => window.print()}
          className="px-4 py-2 rounded-xl border shadow hover:shadow-md"
        >
          Save as PDF
        </button>

        <button
          onClick={onReset}
          className="px-4 py-2 rounded-xl border shadow hover:shadow-md"
        >
          Take Again
        </button>
      </div>
    </div>
  );
}

function QuizCard({ index, total, question, value, setValue, onPrev, onNext }) {
  return (
    <div className="rounded-2xl border shadow p-6 bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-600">Question {index + 1} of {total}</div>
        <div className="w-48">
          <ProgressBar current={index} total={total} />
        </div>
      </div>

      <h2 className="text-xl font-semibold mb-4">{question.title}</h2>

      <div className="grid gap-3">
        <RadioCard
          name={`q${index}`}
          value={value}
          onChange={(v) => setValue(v)}
          label={question.a}
        />
        <RadioCard
          name={`q${index}`}
          value={value}
          onChange={(v) => setValue(v)}
          label={question.b}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onPrev}
          disabled={index === 0}
          className="px-4 py-2 rounded-xl border shadow hover:shadow-md disabled:opacity-40"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-4 py-2 rounded-xl border shadow hover:shadow-md"
        >
          {index + 1 === total ? "Submit" : "Next"}
        </button>
      </div>
    </div>
  );
}

function CodeExplainer() {
  return (
    <div className="rounded-2xl border shadow p-6 bg-white">
      <h3 className="text-lg font-semibold">What your 4-letter code means</h3>
      <p className="text-gray-600 mt-2">
        Your result combines four dimensions: <strong>Direction</strong>, <strong>Energy</strong>, <strong>Thinking</strong>, and <strong>Work orientation</strong>.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm font-medium text-gray-500">Direction</div>
          <div className="mt-1"><span className="font-semibold">D</span> = Driver</div>
          <div><span className="font-semibold">E</span> = Enabler</div>
          <p className="text-gray-600 text-sm mt-2">
            Do you tend to lead initiatives or support execution to make things happen?
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm font-medium text-gray-500">Energy</div>
          <div className="mt-1"><span className="font-semibold">C</span> = Connector</div>
          <div><span className="font-semibold">O</span> = Concentrator</div>
          <p className="text-gray-600 text-sm mt-2">
            Do you get energy from interaction and facilitation, or from focused deep work?
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm font-medium text-gray-500">Thinking</div>
          <div className="mt-1"><span className="font-semibold">A</span> = Architect</div>
          <div><span className="font-semibold">X</span> = Explorer</div>
          <p className="text-gray-600 text-sm mt-2">
            Do you prefer structured frameworks or creative exploration first?
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <div className="text-sm font-medium text-gray-500">Work orientation</div>
          <div className="mt-1"><span className="font-semibold">V</span> = Advisor</div>
          <div><span className="font-semibold">S</span> = Specialist</div>
          <p className="text-gray-600 text-sm mt-2">
            Do you lean to client/people work or technical/data craft?
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BootcampPersonalityApp() {
  const total = QUESTIONS.length;
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState(Array(total).fill(undefined)); // values "A"|"B"
  const [submitted, setSubmitted] = useState(false);

  // Load answers from share link if available
  React.useEffect(() => {
    try {
      const hash = new URL(window.location.href).hash;
      const m = hash.match(/#r=([A-Za-z0-9+/=\-_]+)/);
      if (m && m[1]) {
        const payload = JSON.parse(atob(m[1]));
        if (Array.isArray(payload.a) && payload.a.length === total) {
          setAnswers(payload.a);
          setSubmitted(true);
        }
      }
    } catch { }
  }, [total]);

  const setValue = (idx, v) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = v;
      return next;
    });
  };

  const next = () => {
    if (page < total - 1) setPage((p) => p + 1);
    else setSubmitted(true);
  };
  const prev = () => setPage((p) => Math.max(0, p - 1));
  const reset = () => {
    setAnswers(Array(total).fill(undefined));
    setPage(0);
    setSubmitted(false);
    // Clean hash if present
    try {
      const url = new URL(window.location.href);
      url.hash = "";
      window.history.replaceState({}, document.title, url.toString());
    } catch { }
  };

  const allAnswered = answers.every((a) => a === "A" || a === "B");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* full width container with generous gutters */}
      <div className="w-full max-w-7xl mx-auto px-6 md:px-10 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Bootcamp Personality Test</h1>
          <p className="text-gray-600 mt-1">
            Discover your consulting superpower. Choose the option that feels most natural – no right or wrong answers.
          </p>
        </header>
        {!submitted ? (
          <QuizCard
            index={page}
            total={total}
            question={QUESTIONS[page]}
            value={answers[page]}
            setValue={(v) => setValue(page, v)}
            onPrev={prev}
            onNext={() => {
              if (!answers[page]) return alert("Please choose A or B to continue.");
              next();
            }}
          />
        ) : !allAnswered ? (
          <div className="rounded-2xl border shadow p-6 bg-white">
            <h2 className="text-xl font-semibold">Almost there</h2>
            <p className="text-gray-600 mt-2">
              You haven't answered all questions. Go back and complete the remaining ones.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setSubmitted(false)}
                className="px-4 py-2 rounded-xl border shadow hover:shadow-md"
              >
                Return to quiz
              </button>
            </div>
          </div>
        ) : (
          <ResultCard answers={answers} onReset={reset} />
        )}

        <footer className="text-sm text-gray-500 mt-10">
          <div>Dimensions: Direction (D/E), Energy (C/O), Thinking (A/X), Work (V/S)</div>
          <div className="mt-1">Use this as a conversation starter, not a definitive assessment.</div>
        </footer>
      </div>
    </div>
  );
}
