import { storiesData } from "@/data/storiesData";
import ArticleClient from "./ArticleClient";

export function generateStaticParams() {
  return storiesData.map((story) => ({ slug: story.id }));
}

export default function ArticlePage() { return <ArticleClient />; }
