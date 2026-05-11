# Sanity Studio — PSD Niemcewicza

The admin panel where teachers manage all website content.

## Setup

```bash
npm install
npm run dev
# Opens at http://localhost:3333
```

## Requirements

- Node.js v22+
- A Sanity account invited to project `7cwqf31k`
  - Ask the project owner to invite your email at sanity.io → project settings → members

## Content types (schemas)

| Type | What it controls |
|------|----------------|
| **Announcement** | News and notices shown on the homepage and announcements page |
| **Event** | Upcoming events shown on the homepage and calendar |
| **Staff Member** | Teacher profiles shown on the staff page |
| **Gallery Image** | Photos shown in the gallery and homepage preview |

## How to publish content

1. Run `npm run dev` and open `http://localhost:3333`
2. Log in with your Sanity account
3. Click the content type on the left (e.g. Announcement)
4. Click **+ New** in the top right
5. Fill in the fields — rich text supports bold, italic, links, and images
6. Click **Publish**

Changes appear on the live website within 30 seconds.

## Pinning announcements

When creating an announcement, toggle **Pin to top** to keep it at the top of the announcements list regardless of date.

## Project details

| Key | Value |
|-----|-------|
| Project ID | `7cwqf31k` |
| Dataset | `production` |
| Sanity version | v3 |
