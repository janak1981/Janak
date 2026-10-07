export type PortfolioEntry = {
  title: string;
  meta: string;
  description: string;
  href: string;
};

export type PortfolioPage = {
  id: string;
  slug: string;
  title: string;
  navLabel: string;
  eyebrow: string;
  description: string;
  kind: "timeline" | "cards" | "prose" | "links";
  entries: PortfolioEntry[];
};

export type PortfolioSettings = {
  name: string;
  role: string;
  location: string;
  email: string;
  introduction: string;
  about: string;
  initials: string;
  availability: string;
  social: { label: string; href: string }[];
};

export type PortfolioContent = {
  settings: PortfolioSettings;
  pages: PortfolioPage[];
};

export const starterContent: PortfolioContent = {
  settings: {
    name: "Janak",
    role: "Educator · Researcher · Writer",
    location: "Kathmandu, Nepal",
    email: "hello@janak.example",
    introduction:
      "I’m interested in the ideas, people, and places that help us understand the world a little better.",
    about:
      "This is a space for teaching, research, reading, and the work that connects them. I believe good scholarship should stay curious, generous, and in conversation with the world beyond the page.",
    initials: "J",
    availability: "Open to thoughtful conversations",
    social: [],
  },
  pages: [
    {
      id: "experience",
      slug: "experience",
      title: "Experience",
      navLabel: "Experience",
      eyebrow: "The work",
      description: "A record of roles, collaborations, and work in progress.",
      kind: "timeline",
      entries: [
        {
          title: "Academic & professional experience",
          meta: "Roles and institutions can be added from the admin dashboard",
          description:
            "Use the portfolio editor to add positions, dates, and a short note about each role.",
          href: "",
        },
      ],
    },
    {
      id: "writing",
      slug: "writing",
      title: "Writing & research",
      navLabel: "Writing",
      eyebrow: "The ideas",
      description: "Research, publications, essays, and notes worth sharing.",
      kind: "cards",
      entries: [
        {
          title: "Research and publications",
          meta: "A growing collection",
          description:
            "Add articles, working papers, conference contributions, or essays here.",
          href: "",
        },
      ],
    },
    {
      id: "books",
      slug: "books",
      title: "Bookshelf",
      navLabel: "Books",
      eyebrow: "The reading",
      description: "Books that have stayed with me, and what they made me think.",
      kind: "cards",
      entries: [
        {
          title: "A reader’s notebook",
          meta: "Books, authors, and annotations",
          description:
            "Share a recommendation, a reading list, or a few words about a book.",
          href: "",
        },
      ],
    },
    {
      id: "media",
      slug: "media",
      title: "In the media",
      navLabel: "Media",
      eyebrow: "The conversation",
      description: "Interviews, talks, lectures, and other public conversations.",
      kind: "links",
      entries: [
        {
          title: "Talks and conversations",
          meta: "Audio · Video · Press",
          description:
            "Add a link to a lecture, interview, podcast, or media appearance.",
          href: "",
        },
      ],
    },
    {
      id: "cv",
      slug: "cv",
      title: "Curriculum vitae",
      navLabel: "CV",
      eyebrow: "The details",
      description:
        "Education, appointments, research interests, and selected work.",
      kind: "timeline",
      entries: [
        {
          title: "Curriculum vitae",
          meta: "Updated from the admin dashboard",
          description:
            "Add education, appointments, awards, and selected publications—or link to a downloadable CV.",
          href: "",
        },
      ],
    },
  ],
};

export function isPortfolioContent(value: unknown): value is PortfolioContent {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PortfolioContent>;
  return (
    !!candidate.settings &&
    typeof candidate.settings.name === "string" &&
    typeof candidate.settings.role === "string" &&
    typeof candidate.settings.location === "string" &&
    typeof candidate.settings.email === "string" &&
    typeof candidate.settings.introduction === "string" &&
    typeof candidate.settings.about === "string" &&
    typeof candidate.settings.initials === "string" &&
    typeof candidate.settings.availability === "string" &&
    Array.isArray(candidate.settings.social) &&
    candidate.settings.social.every(
      (item) => typeof item.label === "string" && typeof item.href === "string",
    ) &&
    Array.isArray(candidate.pages) &&
    candidate.pages.every(
      (page) =>
        typeof page.slug === "string" &&
        typeof page.title === "string" &&
        typeof page.id === "string" &&
        typeof page.navLabel === "string" &&
        typeof page.eyebrow === "string" &&
        typeof page.description === "string" &&
        ["timeline", "cards", "prose", "links"].includes(page.kind) &&
        Array.isArray(page.entries) &&
        page.entries.every(
          (entry) =>
            typeof entry.title === "string" &&
            typeof entry.meta === "string" &&
            typeof entry.description === "string" &&
            typeof entry.href === "string",
        ),
    )
  );
}

export function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
