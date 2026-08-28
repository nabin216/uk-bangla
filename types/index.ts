export type Language = "en" | "bn";

export type LocalizedText = Record<Language, string>;

export type Story = {
  id: string;
  category: string;
  author: string;
  date: string;
  image: string;
  sourceUrl?: string;
  title: LocalizedText;
  body: LocalizedText;
  section?: string;
};

export type Poll = {
  id: string;
  question: LocalizedText;
  options: LocalizedText[];
};

export type Translation = Record<string, string>;
