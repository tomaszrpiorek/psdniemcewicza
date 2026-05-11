# Website — PSD Niemcewicza

The public-facing Next.js website for Polska Szkoła Dokształcająca im. Juliana Ursyna Niemcewicza.

## Setup

```bash
npm install
npm run dev
# Opens at http://localhost:3000
```

## Requirements

- Node.js v22+
- No API keys needed — content is fetched from public Sanity dataset

## Pages

| Route | Description |
|-------|-------------|
| `/` | Homepage — hero, announcements, events, gallery preview |
| `/about` | About the school, mission, class structure |
| `/announcements` | All school announcements |
| `/staff` | Teacher profiles |
| `/gallery` | Photo gallery |
| `/calendar` | Upcoming and past events |
| `/homework/[classId]` | Homework by class (e.g. `/homework/klasa-1`) |
| `/documents` | School documents |
| `/contact` | Contact form and school info |
| `/admin` | Teacher login (Firebase — coming soon) |

## Sanity connection

Content is fetched from Sanity in `lib/sanity.ts`:

```ts
export const client = createClient({
  projectId: '7cwqf31k',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})
```

No `.env` file is needed — the project ID is public and the dataset is set to public read access.

## Revalidation

Each page has `export const revalidate = 30` — content refreshes every 30 seconds after a teacher publishes something in Sanity Studio.

## Tech stack

| Tool | Purpose |
|------|---------|
| Next.js 16 (App Router) | Framework |
| Tailwind CSS v4 | Styling |
| Sanity / next-sanity | Content fetching |
| @sanity/image-url | Image optimization |
| Vercel | Hosting |

## Deployment

Connect this folder to a new Vercel project. No environment variables required for the current setup.

```bash
npm run build   # verify build passes before pushing
```
