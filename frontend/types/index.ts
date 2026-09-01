export type Language = "en" | "bn";

export type LocalizedText = Record<Language, string>;

export type Story = {
  id: string;
  category: string;
  categoryBn?: string;
  author: string;
  authorBn?: string;
  authorRole?: LocalizedText;
  authorBio?: LocalizedText;
  date: string;
  image: string;
  imageCaption?: LocalizedText;
  imageCredit?: string;
  sourceUrl?: string;
  readMinutes?: number;
  readCount?: number;
  commentCount?: number;
  featured?: boolean;
  sponsored?: boolean;
  title: LocalizedText;
  body: LocalizedText;
  excerpt?: LocalizedText;
  pullQuote?: LocalizedText;
  section?: string;
};

export type Poll = {
  id: string;
  question: LocalizedText;
  options: LocalizedText[];
};

export type ArticleComment = { id: number; name: string; body: string; date: string };

export type NavLink = { label: LocalizedText; url: string };

export type HomeHeadings = {
  lead: LocalizedText;
  across: LocalizedText;
  more: LocalizedText;
  opinion: LocalizedText;
};

export type HeaderBanner = {
  enabled: boolean;
  image: string | null;
  link: string;
  alt: string;
};

export type SocialLink = { label: string; url: string; glyph: string };
export type FooterLink = { column: string; label: LocalizedText; url: string };
export type SiteSection = { id: number; name: string; name_bn: string; slug: string };
export type MastheadMember = { role: LocalizedText; name: LocalizedText };

export type SiteChrome = {
  menu: NavLink[];
  social: SocialLink[];
  footer_links: FooterLink[];
  sections: SiteSection[];
  masthead: MastheadMember[];
  settings: {
    brand_name: string;
    brand_kicker: string;
    brand_name_bn: string;
    tagline: LocalizedText;
    weather_london: string;
    weather_dhaka: string;
    gbp_to_bdt_rate: number;
    fx_trend_note: LocalizedText;
    footer_blurb: LocalizedText;
    footer_badge: LocalizedText;
    copyright: LocalizedText;
    newsletter_footnote: LocalizedText;
    contact: {
      heading: LocalizedText;
      address: string[];
      emails: string[];
      phones: string[];
    };
    home_headings: HomeHeadings;
    header_banner: HeaderBanner;
  };
};

export type Translation = Record<string, string>;
