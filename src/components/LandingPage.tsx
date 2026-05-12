import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Clock,
  Trophy,
  Smile,
  HeartHandshake,
  ShieldCheck,
  Check,
  Star,
} from "lucide-react";
import zzsLogo from "@/assets/zzs-logo.png";
import jamaLogo from "@/assets/jama-consulting-logo.png";

const features = [
  {
    icon: Clock,
    title: "Sjove rutiner",
    text: "Visuelle timere og børnevenlige ikoner gør morgen, eftermiddag og aften til en leg.",
  },
  {
    icon: HeartHandshake,
    title: "Gør hverdagen lettere",
    text: "Slut med at skændes om tandbørstning og skoletaske – børnene kan selv følge med.",
  },
  {
    icon: Trophy,
    title: "Belønninger til børnene",
    text: "Krydser, point og hurra-animationer giver motivation hele vejen igennem dagen.",
  },
  {
    icon: Smile,
    title: "Lavet til børn",
    text: "Stort, farverigt design så selv de mindste kan bruge appen helt selv.",
  },
  {
    icon: ShieldCheck,
    title: "Sikker & privat",
    text: "Dine data er gemt sikkert. Ingen reklamer, ingen tracking af børnene.",
  },
  {
    icon: Sparkles,
    title: "Følger med på alle enheder",
    text: "Log ind på telefonen, tabletten eller computeren – alt er altid opdateret.",
  },
];

const benefits = [
  "Ubegrænset antal børn",
  "Ubegrænsede mål og aktiviteter",
  "Belønningssystem med point",
  "Hurra-animationer der motiverer",
  "Adgang fra alle enheder",
  "Ingen reklamer – nogensinde",
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <img src={zzsLogo} alt="ZZS" className="h-10 w-auto" />
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Log ind</Link>
            </Button>
            <Button asChild variant="kid" size="sm">
              <Link to="/login">Kom i gang</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="dashboard-sky relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="size-3.5" /> Den nemme rutine-app for hele familien
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl">
              Roligere morgener.<br />
              <span className="text-primary">Gladere børn.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              ZZS gør hverdagens rutiner til sjove, visuelle opgaver, som børnene kan
              klare selv – med timere, ikoner og hurra når de lykkes.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild variant="kid" size="kid" className="w-full sm:w-auto">
                <Link to="/login">Kom i gang nu – 39 kr/md</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="w-full sm:w-auto">
                <a href="#fordele">Se hvad du får →</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Fuld adgang fra dag 1. Opsig når som helst.
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fordele" className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Alt du har brug for til en god dag
          </h2>
          <p className="mt-3 text-muted-foreground">
            Lavet sammen med forældre og børn – så det rent faktisk virker derhjemme.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-3xl border bg-card p-6 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-soft"
            >
              <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <f.icon className="size-6" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof / quote */}
      <section className="bg-secondary/40 py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="mb-3 flex justify-center gap-1 text-accent">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="size-5 fill-current" />
            ))}
          </div>
          <p className="text-xl font-medium leading-relaxed text-foreground sm:text-2xl">
            “Vores morgener er gået fra kaos til hyggelige. Børnene løber selv hen til
            tablettens ZZS og krydser af – uden vi behøver at sige noget.”
          </p>
          <p className="mt-4 text-sm font-bold text-muted-foreground">
            – En glad forælder
          </p>
        </div>
      </section>

      {/* Pricing / CTA */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
        <div className="rounded-3xl border bg-card p-8 shadow-soft sm:p-10">
          <div className="text-center">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles className="size-3.5" /> Fuld adgang fra dag 1
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Kun 39 kr/md
            </h2>
            <p className="mt-2 text-muted-foreground">
              Én pris. Hele familien. Ingen skjulte gebyrer.
            </p>
          </div>
          <ul className="mx-auto mt-6 grid max-w-md gap-2.5">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
                  <Check className="size-3.5" />
                </span>
                <span className="text-foreground">{b}</span>
              </li>
            ))}
          </ul>
          <Button asChild variant="kid" size="kid" className="mt-8 w-full">
            <Link to="/login">Start abonnement nu</Link>
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Sikker betaling via Stripe. Opsig når som helst.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-background py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4">
          <img src={zzsLogo} alt="ZZS" className="h-10 w-auto" />
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ZZS – Rutine-app for børn
          </p>
          <img src={jamaLogo} alt="Jama Consulting" className="mt-4 h-8 w-auto opacity-70" />
        </div>
      </footer>
    </div>
  );
}