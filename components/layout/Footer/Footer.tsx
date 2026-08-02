import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/common/Logo";
import { storeConfig, footerSpacing, type SocialLinks } from "@/lib/config";
import { cn, toResponsiveVars } from "@/lib/utils";

const SOCIAL_LABELS: Record<keyof SocialLinks, string> = {
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
  tiktok: "TikTok",
};

export interface FooterProps {
  className?: string;
}

/**
 * Intentionally minimal: store name, copyright, social links — no
 * newsletter, no marketing content (out of scope for this branch). Social
 * links are entirely config-driven (`storeConfig.social`, currently empty
 * — see `lib/config/store.ts`'s TODO) rather than hardcoded placeholder
 * URLs, so the section simply renders nothing until real profiles exist.
 */
export function Footer({ className }: FooterProps) {
  const year = new Date().getFullYear();
  const socialLinks = (
    Object.entries(storeConfig.social) as [keyof SocialLinks, string | undefined][]
  ).filter((entry): entry is [keyof SocialLinks, string] => Boolean(entry[1]));

  return (
    <footer
      data-slot="footer"
      style={toResponsiveVars("footer-spacing", footerSpacing)}
      className={cn(
        "border-t border-border",
        "py-(--footer-spacing-mobile)",
        "md:py-(--footer-spacing-tablet)",
        "lg:py-(--footer-spacing-desktop)",
        "2xl:py-(--footer-spacing-large-desktop)",
        className,
      )}
    >
      <Container className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <Logo size="sm" href={null} />
          <p className="text-sm text-muted-foreground">
            &copy; {year} {storeConfig.identity.name}. All rights reserved.
          </p>
        </div>

        {socialLinks.length > 0 ? (
          <ul className="flex items-center gap-4">
            {socialLinks.map(([platform, url]) => (
              <li key={platform}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-sm text-sm text-muted-foreground underline-offset-4 outline-none transition-colors hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {SOCIAL_LABELS[platform]}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
    </footer>
  );
}
