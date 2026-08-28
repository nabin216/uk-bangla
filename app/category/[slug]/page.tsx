import { storiesData } from "@/data/storiesData";
import CategoryClient from "./CategoryClient";
export function generateStaticParams() {
  return Array.from(new Set(storiesData.map((story) => story.category.toLowerCase().replace(/\s+/g, "-")))).map((slug) => ({ slug }));
}
export default function CategoryPage() { return <CategoryClient />; }
