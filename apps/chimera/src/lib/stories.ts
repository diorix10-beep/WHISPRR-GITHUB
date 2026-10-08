import { parseTags, type Visibility } from './characters';

export const GENRES = ['General', 'Fantasy', 'Adventure', 'Mystery', 'Sci-Fi', 'Slice of life', 'Drama', 'Comedy', 'Romance'] as const;

export type StoryStatus = 'ongoing' | 'completed' | 'hiatus';

export const STATUS_LABEL: Record<StoryStatus, string> = {
  ongoing: 'Ongoing',
  completed: 'Completed',
  hiatus: 'On hiatus',
};

export const STORY_LIMITS = {
  title: 120,
  summary: 1000,
  chapterTitle: 120,
  chapterContent: 100_000,
} as const;

export interface StoryForm {
  title: string;
  summary: string;
  genre: string;
  tags: string;
  visibility: Visibility;
  status: StoryStatus;
}

export const EMPTY_STORY: StoryForm = {
  title: '',
  summary: '',
  genre: 'General',
  tags: '',
  visibility: 'private',
  status: 'ongoing',
};

export function validateStory(form: StoryForm): string | null {
  if (!form.title.trim()) return 'Give your story a title.';
  if (form.title.length > STORY_LIMITS.title) return `The title is too long (${form.title.length} of ${STORY_LIMITS.title} characters).`;
  if (form.summary.length > STORY_LIMITS.summary) return `The summary is too long (${form.summary.length} of ${STORY_LIMITS.summary} characters).`;
  return null;
}

/** Row values for the stories table. Visibility is always explicit: the column defaults to public. */
export function storyRow(form: StoryForm) {
  return {
    title: form.title.trim(),
    summary: form.summary.trim(),
    genre: form.genre,
    tags: parseTags(form.tags),
    visibility: form.visibility,
    status: form.status,
  };
}

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

export function splitParagraphs(text: string): string[] {
  return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

/** The database rule is also shown to people in plain words. */
export function saveFailureMessage(error: unknown, fallback: string): string {
  const text = error instanceof Error ? error.message : (error as { message?: string } | null)?.message;
  return /founder|public publishing/i.test(text ?? '')
    ? 'Public publishing is limited to the CHIMERA founder during the beta. Choose private or unlisted.'
    : fallback;
}
