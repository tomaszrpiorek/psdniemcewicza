# Polska Szkoła Dokształcająca im. Juliana Ursyna Niemcewicza
### Plainfield, New Jersey — psdniemcewicz.org

This repository contains two projects that together make up the school website.

```
psdniemcewicza/
├── sanity-studio/   ← Admin panel (teachers manage content here)
└── web/             ← Public-facing Next.js website
```

---

## How it works

Teachers log into Sanity Studio to publish announcements, events, gallery images, and staff profiles. The Next.js website fetches that content and displays it to visitors automatically — no rebuild needed.

```
[Sanity Studio] → publishes → [Sanity Cloud] ← fetches ← [Next.js site]
```

---

## Requirements

- Node.js v22+ — install via [nvm](https://github.com/nvm-sh/nvm)
- A Sanity account with access to project `7cwqf31k`
- npm

---

## Quick start

### 1. Install Node 22
```bash
nvm install 22 && nvm use 22
```

### 2. Start the Sanity Studio (admin panel)
```bash
cd sanity-studio
npm install
npm run dev
# Opens at http://localhost:3333
```

### 3. Start the website (in a separate terminal)
```bash
cd web
npm install
npm run dev
# Opens at http://localhost:3000
```

---

## Deployments

| Project | Platform | URL |
|---------|----------|-----|
| Website | Vercel | psdniemcewicz.org |
| Studio | Vercel / Sanity cloud | studio.psdniemcewicz.org |

---

## Contact

For access to the Sanity project, contact the repository owner.
