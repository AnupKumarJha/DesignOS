---
title: We built our own design canvas. Here's why every Indian studio should care.
slug: design-os-launch
date: 2026-05-08
author: Anup Jha
audience: interior-designers
status: published
---

# We built our own design canvas. Here's why every Indian studio should care.

For the last two years at Namaste Design, every project we shipped quietly carried a tax — the SaaS rent we paid to design software built in California, priced in dollars, charged per seat per month.

Today we're launching **Design OS** — our own 2D + 3D interior design canvas. Built in Mumbai, in millimetres, owned by us.

---

## Why we stopped renting

If you run a studio in India, you already know the math. Three designers on Infurnia or Snaptrude is a recurring bill in the tens of thousands a year. Add another seat, the number jumps. Want to download your own project file in a format you control? You can't. Your work lives inside their walls.

For a Mumbai studio billing ₹1–2L projects, every rupee of overhead lands on the client's quotation. SaaS rent is the most invisible margin-killer in our industry — and the one nobody talks about because "everyone uses it."

We did the spreadsheet. Three years of seats, training time, and the export-lock-in cost — it was cheaper to build our own.

So we did.

## What Design OS actually is

A single canvas with two synchronised viewports.

- Draw a wall on the 2D floor plan. Watch it extrude into 3D as you draw — same data, same instant.
- Switch between top view, front view, and 3D orbit with one click.
- Drop in furniture from a catalog. Move it in 2D, it moves in 3D.
- Import a reference floor plan as a background image and trace over it.
- Generate a client quotation from the canvas itself — the BOQ comes out of the same data the design lives in.

One source of truth. Two views of it. No round-tripping between three different files.

## What's live in v1

- **Wall drafting** with snap-to-grid and snap-to-90° — the way every Indian site sheet is drawn anyway.
- **Multi-room support.** Bedroom, kitchen, living — all in one project.
- **Doors and windows** as openings in 2D.
- **Furniture catalog** with 2D plan symbols and 3D models that stay synced.
- **Material drawer** for assigning finishes.
- **Floor plan import** so you can start from a builder's drawing or a hand sketch.
- **Project hub** to manage every studio project in one place.
- **Properties panel** for editing dimensions, heights, materials per object.
- **Quotation export** — the bill of quantities flows out of the canvas.
- **Save/load** as JSON. Your project file lives on your machine. No cloud lock-in.

Built on React, Konva, React Three Fiber, Zustand — which means it runs in any browser and we can ship a desktop version when we're ready.

## What we left out, on purpose

We didn't build photoreal rendering. We didn't build cloud collaboration. We didn't build AI-generated mood boards.

Every studio software pitch in 2026 leads with one of those three. None of them close projects in Thane. What closes projects is: a designer who can sit with a client, sketch a layout in front of them, walk them through it in 3D, and hand them a quotation by Friday.

That's the loop Design OS is built around. Everything else can come later.

## What's coming next

- **Door and window cutouts in 3D** (CSG drilling — the geometry is wired, the UI is not yet).
- **Texture and material library** — laminates, tiles, hardware, with Indian-vendor pricing baked in.
- **Tauri desktop app** so it runs offline in a meeting where the wifi dies.
- **Multi-floor support** for duplex and villa projects.
- **Direct PDF export** of plans, elevations, and quotations.

## Who this is for

Design OS is being used in production at Namaste Design today. It's not a research project — it's the tool we use to draft and quote real client work.

If you run a studio in Mumbai, Pune, Bangalore, or anywhere in India, and you're tired of paying foreign software rent on Indian-margin projects — we'd like to talk.

We're opening early access to a small group of studios this quarter. No subscription. No per-seat trap. Built for how Indian studios actually work.

**Want in?** Email us at hello@namastedesign.in or message Anup directly.

---

*Design OS is a Namaste Ventures product. Built in Mumbai. Owned by the studios that use it.*
