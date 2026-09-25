import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { Camera, Calendar, MapPin, Sparkles, BookOpen, Share2, Download } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function MemoryBookSharePage({ params }: PageProps) {
  const { token } = await params;

  const memoryBook = await prisma.memoryBook.findUnique({
    where: { shareToken: token },
    include: {
      author: { select: { id: true, name: true, image: true, username: true } },
      itinerary: {
        include: {
          user: { select: { id: true, name: true, image: true } },
          journalEntries: {
            include: { author: { select: { id: true, name: true, image: true } } },
            orderBy: [{ date: "asc" }, { createdAt: "asc" }],
          },
          tripSummaries: { take: 1, orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  if (!memoryBook || memoryBook.visibility === "private") {
    notFound();
  }

  const trip = memoryBook.itinerary;
  const summary = trip.tripSummaries[0];
  const entries = trip.journalEntries;
  const layout = memoryBook.layoutTemplate || "magazine";
  const customCaptions = (memoryBook.customCaptions as any) || {};

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-background text-foreground py-10 px-4 sm:px-8">
      {/* Top Bar */}
      <div className="max-w-5xl mx-auto flex items-center justify-between pb-8 border-b border-amber-900/10 dark:border-border">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-sm">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="font-serif tracking-widest font-black uppercase text-sm sm:text-base">
            Wander.ai Memory Books
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={undefined}
            className="rounded-full text-xs border-amber-500/30 text-amber-700 dark:text-amber-300"
          >
            <Share2 className="w-3.5 h-3.5 mr-1" />
            Share
          </Button>

          <Button
            size="sm"
            asChild
            className="rounded-full text-xs bg-amber-500 text-white hover:bg-amber-600"
          >
            <Link href={`/itinerary/${trip.id}`}>
              View Full Trip
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Memory Book Article */}
      <main className="max-w-4xl mx-auto mt-10 space-y-12">
        {/* Cover Section */}
        <div className="text-center space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            A Journey In Memories
          </span>
          <h1 className="text-4xl sm:text-5xl font-serif font-black tracking-tight text-foreground">
            {memoryBook.title || `${trip.destination} Memoir`}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground italic font-serif max-w-xl mx-auto">
            {memoryBook.subtitle || `Captured moments, quiet alleys, and unforgettable days in ${trip.destination}`}
          </p>

          <div className="flex items-center justify-center gap-3 pt-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <img
                src={memoryBook.author.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=book"}
                alt=""
                className="w-5 h-5 rounded-full border"
              />
              <span className="font-semibold text-foreground">{memoryBook.author.name}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              <span>{trip.destination}</span>
            </div>
            <span>•</span>
            <span>{entries.length} Memories</span>
          </div>
        </div>

        {/* Hero Cover Image if available */}
        {trip.coverImage && (
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-amber-900/10 aspect-[21/9]">
            <img
              src={trip.coverImage}
              alt={trip.destination}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Narrative Summary Spread */}
        {summary?.narrative && (
          <div className="bg-card/70 backdrop-blur-sm p-8 sm:p-10 rounded-3xl border border-amber-500/20 shadow-lg space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>The Story</span>
            </div>
            <p className="text-base sm:text-lg font-serif leading-relaxed text-foreground/90 whitespace-pre-line italic">
              "{summary.narrative}"
            </p>
          </div>
        )}

        {/* Photo and Moment Spreads */}
        <div className="space-y-12">
          {entries.map((entry, idx) => (
            <div
              key={entry.id}
              className="p-6 sm:p-8 rounded-3xl bg-card border border-amber-900/10 dark:border-border shadow-md space-y-4"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b">
                <span className="font-bold text-amber-600 uppercase tracking-wider">
                  Day {entry.dayNumber || 1} {entry.locationName ? `• ${entry.locationName}` : ""}
                </span>
                <span className="italic">
                  {new Date(entry.date).toLocaleDateString([], {
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>

              {entry.photos && entry.photos.length > 0 && (
                <div
                  className={`grid gap-3 ${
                    entry.photos.length === 1
                      ? "grid-cols-1"
                      : entry.photos.length === 2
                      ? "grid-cols-2"
                      : "grid-cols-2 sm:grid-cols-3"
                  }`}
                >
                  {entry.photos.map((ph: string, pIdx: number) => (
                    <div key={pIdx} className="rounded-2xl overflow-hidden aspect-[4/3] shadow-sm border">
                      <img src={ph} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {entry.title && (
                <h3 className="text-lg font-serif font-bold text-foreground">
                  {entry.title}
                </h3>
              )}

              <p className="text-sm text-foreground/80 leading-relaxed font-sans">
                {customCaptions[entry.id] || entry.notes}
              </p>

              <div className="flex items-center gap-2 pt-2 text-[11px] text-muted-foreground">
                <img
                  src={entry.author.image || "https://api.dicebear.com/7.x/avataaars/svg?seed=author"}
                  alt=""
                  className="w-4 h-4 rounded-full border"
                />
                <span>Captured by {entry.author.name}</span>
                {entry.mood && (
                  <>
                    <span>•</span>
                    <span className="capitalize">Mood: {entry.mood}</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center pt-8 pb-12 border-t border-amber-900/10 text-xs text-muted-foreground space-y-2">
          <p>Wander.ai Memory Books — Crafted with love for travelers worldwide.</p>
        </div>
      </main>
    </div>
  );
}
