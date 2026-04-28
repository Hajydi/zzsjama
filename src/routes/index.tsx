import { createFileRoute } from "@tanstack/react-router";
import {
  Apple,
  Backpack,
  Bath,
  Bed,
  BookOpen,
  Car,
  Check,
  ChefHat,
  DoorOpen,
  Droplets,
  HandHelping,
  HandPlatter,
  HandSoap,
  Home,
  Moon,
  Minus,
  Palette,
  Pause,
  Play,
  Plus,
  Shirt,
  RotateCcw,
  Sparkles,
  Star,
  Sun,
  Trash2,
  Users,
  Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { type CSSProperties, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Børne Dashboard Timer" },
      {
        name: "description",
        content: "Et børnevenligt dashboard med cirkel-timer, egne gøremål og krydser for flere børn.",
      },
    ],
  }),
  component: KidsDashboard,
});

type RoutineKey = "morning" | "afterSchool" | "evening";
type Goal = { id: string; title: string; icon: keyof typeof goalIcons };
type Child = { id: string; name: string };
type SavedDashboard = {
  minutes: number;
  activeRoutine: RoutineKey;
  routines: Record<RoutineKey, Goal[]>;
  children: Child[];
  checkedByRoutine: Record<RoutineKey, Record<string, string[]>>;
};

const storageKey = "kids-dashboard-routines-v1";
const goalIcons = {
  apple: Apple,
  backpack: Backpack,
  bath: Bath,
  bed: Bed,
  book: BookOpen,
  car: Car,
  chef: ChefHat,
  door: DoorOpen,
  droplets: Droplets,
  helping: HandHelping,
  plate: HandPlatter,
  soap: HandSoap,
  home: Home,
  moon: Moon,
  palette: Palette,
  shirt: Shirt,
  sparkles: Sparkles,
  sun: Sun,
  utensils: Utensils,
} satisfies Record<string, LucideIcon>;

const routineLabels: Record<RoutineKey, { eyebrow: string; title: string; button: string }> = {
  morning: { eyebrow: "Morgenrutine", title: "Klar til dagen!", button: "Morgen" },
  afterSchool: { eyebrow: "Efter skole", title: "Hjemme igen!", button: "Efter skole" },
  evening: { eyebrow: "Aftenrutine", title: "Klar til natten!", button: "Aften" },
};

const starterRoutines: Record<RoutineKey, Goal[]> = {
  morning: [
    { id: "morning-wake-up", title: "Stå op", icon: "sun" },
    { id: "morning-toilet", title: "Gå på toilettet", icon: "door" },
    { id: "morning-clothes", title: "Tag tøj på", icon: "shirt" },
    { id: "morning-hair", title: "Red hår", icon: "sparkles" },
    { id: "morning-brush-teeth", title: "Børst tænder", icon: "sparkles" },
    { id: "morning-wash-face", title: "Vask ansigt", icon: "droplets" },
    { id: "morning-sunscreen", title: "Tag solcreme på", icon: "sun" },
    { id: "morning-breakfast", title: "Spis morgenmad", icon: "utensils" },
    { id: "morning-plate", title: "Ryd din tallerken op", icon: "plate" },
    { id: "morning-school-bag", title: "Pak skoletaske", icon: "backpack" },
    { id: "morning-lunch", title: "Madpakke og drikkedunk i tasken", icon: "apple" },
    { id: "morning-outerwear", title: "Tag overtøj og sko på", icon: "shirt" },
    { id: "morning-car", title: "Gå ud til bilen", icon: "car" },
  ],
  afterSchool: [
    { id: "after-jacket-bag", title: "Hæng jakke og taske på plads", icon: "home" },
    { id: "after-wash-hands", title: "Vask hænder", icon: "soap" },
    { id: "after-snack", title: "Spis en snack", icon: "apple" },
    { id: "after-empty-bag", title: "Tøm skoletasken", icon: "backpack" },
    { id: "after-homework", title: "Lav lektier", icon: "book" },
    { id: "after-free-play", title: "Fri leg / afslapning", icon: "palette" },
    { id: "after-help", title: "Hjælp med en lille ting", icon: "helping" },
    { id: "after-dinner", title: "Spis aftensmad", icon: "utensils" },
    { id: "after-plate", title: "Ryd din tallerken op", icon: "plate" },
    { id: "after-calm", title: "Rolig aktivitet", icon: "book" },
  ],
  evening: [
    { id: "evening-toilet", title: "Gå på toilettet", icon: "door" },
    { id: "evening-bath", title: "Bad / vask dig", icon: "bath" },
    { id: "evening-pajamas", title: "Tag nattøj på", icon: "moon" },
    { id: "evening-brush-teeth", title: "Børst tænder", icon: "sparkles" },
    { id: "evening-pack-bag", title: "Pak skoletaske", icon: "backpack" },
    { id: "evening-clothes-ready", title: "Læg tøj frem til i morgen", icon: "shirt" },
    { id: "evening-room", title: "Kort oprydning på værelset", icon: "home" },
    { id: "evening-calm", title: "Rolig aktivitet", icon: "book" },
    { id: "evening-bed", title: "I seng", icon: "bed" },
  ],
};
const starterChildren: Child[] = [
  { id: "child-1", name: "Barn 1" },
  { id: "child-2", name: "Barn 2" },
];

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function KidsDashboard() {
  const [minutes, setMinutes] = useState(15);
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [goals, setGoals] = useState<Goal[]>(starterGoals);
  const [children, setChildren] = useState<Child[]>(starterChildren);
  const [checkedByGoal, setCheckedByGoal] = useState<Record<string, string[]>>({});
  const [goalInput, setGoalInput] = useState("");
  const [childInput, setChildInput] = useState("");
  const [childCount, setChildCount] = useState(2);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved) as SavedDashboard;
      setMinutes(parsed.minutes);
      setSecondsLeft(parsed.minutes * 60);
      setGoals(parsed.goals.length ? parsed.goals : starterGoals);
      setChildren(parsed.children.length ? parsed.children : starterChildren);
      setCheckedByGoal(parsed.checkedByGoal ?? {});
      setChildCount(Math.max(1, parsed.children.length));
    }
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    const saved: SavedDashboard = { minutes, goals, children, checkedByGoal };
    window.localStorage.setItem(storageKey, JSON.stringify(saved));
  }, [checkedByGoal, children, goals, hasLoaded, minutes]);

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

  const totalChecks = goals.length * children.length;
  const completedCount = Object.values(checkedByGoal).reduce((sum, childIds) => sum + childIds.length, 0);
  const completedPercent = totalChecks === 0 ? 0 : (completedCount / totalChecks) * 100;

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

  function addGoal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = goalInput.trim().slice(0, 40);
    if (!title) return;
    setGoals((current) => [...current, { id: createId("goal"), title }]);
    setGoalInput("");
  }

  function removeGoal(goalId: string) {
    setGoals((current) => current.filter((goal) => goal.id !== goalId));
    setCheckedByGoal((current) => {
      const next = { ...current };
      delete next[goalId];
      return next;
    });
  }

  function addChild(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = childInput.trim().slice(0, 24);
    if (!name) return;
    setChildren((current) => [...current, { id: createId("child"), name }]);
    setChildInput("");
    setChildCount((current) => current + 1);
  }

  function createChildrenFromCount() {
    const nextChildren = Array.from({ length: childCount }, (_, index) => ({
      id: `child-${index + 1}`,
      name: `Barn ${index + 1}`,
    }));
    setChildren(nextChildren);
    setCheckedByGoal({});
  }

  function removeChild(childId: string) {
    setChildren((current) => current.filter((child) => child.id !== childId));
    setCheckedByGoal((current) =>
      Object.fromEntries(
        Object.entries(current).map(([goalId, childIds]) => [
          goalId,
          childIds.filter((id) => id !== childId),
        ]),
      ),
    );
  }

  function toggleCheck(goalId: string, childId: string) {
    setCheckedByGoal((current) => {
      const childIds = current[goalId] ?? [];
      return {
        ...current,
        [goalId]: childIds.includes(childId)
          ? childIds.filter((id) => id !== childId)
          : [...childIds, childId],
      };
    });
  }

  return (
    <main className="dashboard-sky min-h-screen overflow-hidden px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <section className="mx-auto grid min-h-[calc(100vh-2.5rem)] max-w-7xl content-center gap-6 xl:grid-cols-[0.95fr_1.05fr] lg:gap-8">
        <div className="rounded-[2rem] border bg-panel p-5 shadow-soft backdrop-blur-md sm:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-primary">Morgenrutine</p>
              <h1 className="mt-1 text-3xl font-black leading-tight text-foreground sm:text-5xl">
                Klar til dagen!
              </h1>
            </div>
            <div className="floaty grid size-16 place-items-center rounded-full bg-accent text-accent-foreground shadow-soft sm:size-20">
              <Sparkles className="size-8 sm:size-10" aria-hidden="true" />
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-[25rem] place-items-center">
            <div
              className="timer-face grid aspect-square w-full place-items-center rounded-full p-4 shadow-soft"
              style={{ "--timer-angle": timerAngle } as CSSProperties}
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

          <div className="mt-6 grid gap-5 sm:grid-cols-[0.8fr_1fr]">
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

            <div className="grid grid-cols-2 gap-3 content-center">
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

          <div className="mt-6 rounded-3xl bg-secondary p-4 text-secondary-foreground">
            <div className="flex items-end justify-between gap-3">
              <span className="text-lg font-black">Krydser i alt</span>
              <span className="text-4xl font-black tabular-nums">
                {completedCount}/{totalChecks}
              </span>
            </div>
            <div className="mt-3 h-4 overflow-hidden rounded-full bg-background">
              <div
                className="h-full rounded-full bg-grass-pop transition-all duration-500"
                style={{ width: `${completedPercent}%` }}
              />
            </div>
          </div>
        </div>

        <aside className="rounded-[2rem] border bg-panel p-5 shadow-soft backdrop-blur-md sm:p-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-extrabold uppercase tracking-wide text-primary">Morgen</p>
              <h2 className="mt-1 text-3xl font-black text-foreground">Børnenes rutine</h2>
            </div>
            <div className="grid size-14 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
              <Star className="size-8" aria-hidden="true" />
            </div>
          </div>

          <div className="mb-5 grid gap-3 lg:grid-cols-2">
            <div className="rounded-3xl border bg-card p-4 shadow-soft">
              <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
                <Users className="size-4" aria-hidden="true" />
                Børn
              </div>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={childCount}
                  onChange={(event) => setChildCount(Math.max(1, Number(event.target.value) || 1))}
                  className="h-12 w-20 rounded-2xl border bg-background px-4 text-lg font-black text-foreground outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Antal børn"
                />
                <Button variant="kid" className="h-12 flex-1" onClick={createChildrenFromCount}>
                  Opret
                </Button>
              </div>
              <form className="mt-3 flex gap-2" onSubmit={addChild}>
                <input
                  value={childInput}
                  onChange={(event) => setChildInput(event.target.value)}
                  placeholder="Navn"
                  maxLength={24}
                  className="h-12 min-w-0 flex-1 rounded-2xl border bg-background px-4 font-bold text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  aria-label="Barnets navn"
                />
                <Button variant="sunny" className="h-12" type="submit">
                  <Plus aria-hidden="true" />
                </Button>
              </form>
            </div>

            <form className="rounded-3xl border bg-card p-4 shadow-soft" onSubmit={addGoal}>
              <p className="mb-3 text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
                Nyt gøremål
              </p>
              <div className="flex gap-2">
                <input
                  value={goalInput}
                  onChange={(event) => setGoalInput(event.target.value)}
                  placeholder="Skriv mål"
                  maxLength={40}
                  className="h-12 min-w-0 flex-1 rounded-2xl border bg-background px-4 font-bold text-foreground outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
                  aria-label="Nyt gøremål"
                />
                <Button variant="kid" className="h-12" type="submit">
                  <Plus aria-hidden="true" />
                </Button>
              </div>
            </form>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {children.map((child) => (
              <span
                key={child.id}
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-soft px-3 py-2 text-sm font-black text-primary"
              >
                {child.name}
                <button
                  type="button"
                  onClick={() => removeChild(child.id)}
                  className="rounded-full p-1 hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Fjern ${child.name}`}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>

          <div className="overflow-x-auto rounded-3xl border bg-card shadow-soft">
            <div
              className="grid min-w-[34rem] items-center border-b bg-muted/50 px-4 py-3"
              style={{ gridTemplateColumns: `minmax(13rem, 1fr) repeat(${children.length}, minmax(7rem, 0.55fr)) 3rem` }}
            >
              <span className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">Gøremål</span>
              {children.map((child) => (
                <span key={child.id} className="text-center text-sm font-black text-foreground">
                  {child.name}
                </span>
              ))}
              <span aria-hidden="true" />
            </div>
            {goals.map((goal, index) => (
              <div
                key={goal.id}
                className="grid min-w-[34rem] items-center gap-2 border-b px-4 py-3 last:border-b-0"
                style={{ gridTemplateColumns: `minmax(13rem, 1fr) repeat(${children.length}, minmax(7rem, 0.55fr)) 3rem` }}
              >
                <span className="text-base font-black text-card-foreground sm:text-lg">
                  {index + 1}. {goal.title}
                </span>
                {children.map((child) => {
                  const isDone = checkedByGoal[goal.id]?.includes(child.id) ?? false;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      onClick={() => toggleCheck(goal.id, child.id)}
                      className="mx-auto grid size-12 place-items-center rounded-2xl border bg-background text-primary transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={`${child.name}: ${goal.title}`}
                      aria-pressed={isDone}
                    >
                      {isDone && <Check className="size-7" aria-hidden="true" />}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => removeGoal(goal.id)}
                  className="grid size-10 place-items-center rounded-2xl text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Fjern ${goal.title}`}
                >
                  <Trash2 className="size-5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}