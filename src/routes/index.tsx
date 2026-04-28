import { createFileRoute } from "@tanstack/react-router";
import { Check, Minus, Pause, Play, Plus, RotateCcw, Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Børne Dashboard Timer" },
      {
        name: "description",
        content: "Et børnevenligt dashboard med cirkel-timer og sjove mål, der kan krydses af.",
      },
    ],
  }),
  component: KidsDashboard,
});

const starterGoals = [
  "Børst tænder",
  "Pak tasken",
  "Ryd legetøj op",
  "Læs 10 minutter",
];

function KidsDashboard() {
  const [minutes, setMinutes] = useState(15);
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [checkedGoals, setCheckedGoals] = useState<string[]>([]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          setIsRunning(false);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isRunning]);

  const totalSeconds = minutes * 60;
  const progress = totalSeconds === 0 ? 0 : 1 - secondsLeft / totalSeconds;
  const timerAngle = `${Math.max(0, Math.min(360, progress * 360))}deg`;
  const displayTime = useMemo(() => {
    const mins = Math.floor(secondsLeft / 60).toString().padStart(2, "0");
    const secs = (secondsLeft % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }, [secondsLeft]);

  const completedCount = checkedGoals.length;

  function changeMinutes(nextMinutes: number) {
    const safeMinutes = Math.max(1, Math.min(60, nextMinutes));
    setMinutes(safeMinutes);
    setSecondsLeft(safeMinutes * 60);
    setIsRunning(false);
  }

  function resetTimer() {
    setSecondsLeft(minutes * 60);
    setIsRunning(false);
  }

  function toggleGoal(goal: string) {
    setCheckedGoals((current) =>
      current.includes(goal) ? current.filter((item) => item !== goal) : [...current, goal],
    );
  }

  return (
    <main className="dashboard-sky min-h-screen overflow-hidden px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-6xl content-center gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <div className="rounded-[2rem] border bg-panel p-5 shadow-soft backdrop-blur-md sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-primary">Min dag</p>
              <h1 className="mt-1 text-3xl font-black leading-tight text-foreground sm:text-5xl">
                Klar, parat, fokus!
              </h1>
            </div>
            <div className="floaty grid size-16 place-items-center rounded-full bg-accent text-accent-foreground shadow-soft sm:size-20">
              <Sparkles className="size-8 sm:size-10" aria-hidden="true" />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
            <div className="mx-auto grid w-full max-w-[28rem] place-items-center">
              <div
                className="timer-face grid aspect-square w-full place-items-center rounded-full p-4 shadow-soft"
                style={{ "--timer-angle": timerAngle } as React.CSSProperties}
                aria-label={`Timeren er ${Math.round(progress * 100)} procent færdig`}
              >
                <div className="grid size-full place-items-center rounded-full bg-card text-center shadow-soft">
                  <div>
                    <p className="text-base font-extrabold text-muted-foreground">Tid tilbage</p>
                    <div className="mt-2 text-6xl font-black tabular-nums text-foreground sm:text-7xl">
                      {displayTime}
                    </div>
                    <p className="mt-3 text-lg font-bold text-primary">
                      {Math.round(progress * 100)}% klaret
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-5">
              <div className="rounded-3xl border bg-card p-4 shadow-soft">
                <p className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
                  Sæt uret
                </p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Button
                    variant="sunny"
                    size="icon"
                    className="size-14 rounded-full"
                    onClick={() => changeMinutes(minutes - 5)}
                    aria-label="Træk fem minutter fra"
                  >
                    <Minus className="size-6" aria-hidden="true" />
                  </Button>
                  <div className="text-center">
                    <div className="text-5xl font-black tabular-nums text-foreground">{minutes}</div>
                    <div className="text-sm font-extrabold text-muted-foreground">minutter</div>
                  </div>
                  <Button
                    variant="sunny"
                    size="icon"
                    className="size-14 rounded-full"
                    onClick={() => changeMinutes(minutes + 5)}
                    aria-label="Læg fem minutter til"
                  >
                    <Plus className="size-6" aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="kid" size="kid" onClick={() => setIsRunning((value) => !value)}>
                  {isRunning ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                  {isRunning ? "Pause" : "Start"}
                </Button>
                <Button variant="sunny" size="kid" onClick={resetTimer}>
                  <RotateCcw aria-hidden="true" />
                  Igen
                </Button>
              </div>
            </div>
          </div>
        </div>

        <aside className="rounded-[2rem] border bg-panel p-5 shadow-soft backdrop-blur-md sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-primary">Gøremål</p>
              <h2 className="mt-1 text-3xl font-black text-foreground">Mine mål</h2>
            </div>
            <div className="grid size-14 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
              <Star className="size-8" aria-hidden="true" />
            </div>
          </div>

          <div className="mb-5 rounded-3xl bg-secondary p-4 text-secondary-foreground">
            <div className="flex items-end justify-between gap-3">
              <span className="text-lg font-black">Stjerner i dag</span>
              <span className="text-4xl font-black tabular-nums">
                {completedCount}/{starterGoals.length}
              </span>
            </div>
            <div className="mt-3 h-4 overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-grass-pop transition-all duration-500"
                style={{ width: `${(completedCount / starterGoals.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {starterGoals.map((goal) => {
              const isDone = checkedGoals.includes(goal);
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  className="flex w-full items-center gap-4 rounded-3xl border bg-card p-4 text-left shadow-soft transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-pressed={isDone}
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-soft text-primary">
                    {isDone && <Check className="size-7" aria-hidden="true" />}
                  </span>
                  <span className="text-xl font-black text-card-foreground">{goal}</span>
                </button>
              );
            })}
          </div>
        </aside>
      </section>
    </main>
  );
}