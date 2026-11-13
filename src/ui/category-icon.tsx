import { Accessibility, Baby, Music, Sparkles, UtensilsCrossed, type LucideProps } from "lucide-react";

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  infantil: Baby,
  musica: Music,
  gastronomia: UtensilsCrossed,
  inclusivo: Accessibility,
};

/** Decorative icon for an event category; unknown categories get a generic one. */
export function CategoryIcon({ slug, size = 18 }: { slug: string; size?: number }) {
  const Icon = ICONS[slug] ?? Sparkles;
  return <Icon size={size} aria-hidden="true" />;
}
