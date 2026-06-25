export interface Story {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: number;
  body: string[];
  whatItRepresents: string;
  whyItsImportant: string;
  keyTakeaways: string[];
  reflectionQuestion: string;
}
