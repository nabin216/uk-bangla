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

export type SiteChrome = {
  menu: NavLink[];
  settings: {
    brand_name: string;
    brand_kicker: string;
    brand_name_bn: string;
    weather_london: string;
    weather_dhaka: string;
    gbp_to_bdt_rate: number;
    home_headings: HomeHeadings;
    header_banner: HeaderBanner;
  };
};

export type Translation = Record<string, string>;
