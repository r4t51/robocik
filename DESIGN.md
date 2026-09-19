---
name: r4t5
description: A black-and-blue personal shelf for books, films, and games.
colors:
  stock: "#07080c"
  ink: "#1d4ed8"
  ink-deep: "#163a9a"
  edge: "#7eb6ff"
  paper: "#f4f8ff"
  body: "#d7e3f8"
  quiet: "#b7cff6"
typography:
  display:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "clamp(4rem, 8vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "clamp(3.4rem, 7vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "clamp(2.1rem, 4vw, 3.4rem)"
    fontWeight: 800
    lineHeight: 0.9
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Literata, Iowan Old Style, Palatino Linotype, serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0"
rounded:
  gate: "0"
  hole: "0.28rem"
spacing:
  gutter: "6vw"
  gutter-narrow: "1.15rem"
  band: "1.15rem 1rem 1.2rem"
  work: "2.75rem 0 3rem"
components:
  reel-band:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.paper}"
    typography: "{typography.display}"
    rounded: "{rounded.gate}"
    padding: "{spacing.band}"
  reel-band-threaded:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.display}"
    rounded: "{rounded.gate}"
    padding: "{spacing.band}"
  next-reel:
    backgroundColor: "{colors.stock}"
    textColor: "{colors.paper}"
    typography: "{typography.title}"
    rounded: "{rounded.gate}"
    padding: "0"
---

# Design System: r4t5

## Overview

**Creative North Star: "The Night Leader"**

The shelf is a film bench at night. Black stock is the room. Cobalt is the lab lamp, and it owns whole bands, not thin highlights. A visitor threads one reel and reads. The page is a gate, a sprocket, and essays, in that order.

Density is uneven on purpose. The opening gate is one screen. A chapter is long type. A solid cobalt bar sits between chapters so the strip has a cut, not a hairline. Motion is one pull on the frame counter. Everything else is still.

**Key Characteristics:**

- Black ground, one cobalt, no third hue
- Square gates and bands; the only curve is a sprocket hole
- Display type for names, a serif for reading, mono only for frame counts
- The threaded reel is a filled cobalt band
- Frame numbers tell you where you are

## Colors

The palette is film stock under a cobalt lamp. Secondary text is a lighter blue, never a neutral gray.

### Primary

- **Lab cobalt** (#1d4ed8): Filled reel bands, the middle work in each chapter, and the bars between chapters.

### Secondary

- **Edge code** (#7eb6ff): Frame numbers, focus rings, and the current sprocket.

### Tertiary

- **Gate blue** (#163a9a): The line under the sprocket and the rules between works.

### Neutral

- **Film stock** (#07080c): The page ground.
- **Gate white** (#f4f8ff): Display titles and text that sits on cobalt.
- **Reading ink** (#d7e3f8): Essay text on stock.
- **Draft ink** (#b7cff6): The working-shelf note and the colophon.

**The One Lamp Rule.** Cobalt is the only chromatic color. If a passage needs emphasis, it becomes a cobalt field. It does not grow a second accent.

## Typography

**Display Font:** Big Shoulders Display (with Arial Narrow)
**Body Font:** Literata (with Iowan Old Style)
**Label/Mono Font:** Martian Mono, frame counts only

**Character:** Condensed industrial caps for the slate and the work titles. A book serif for the essays. The mono face is a counter, not a costume.

### Hierarchy

- **Display** (800, clamp(4rem, 8vw, 6rem), line-height 0.9): The name on the slate.
- **Headline** (800, clamp(3.4rem, 7vw, 5.5rem), line-height 0.9): Chapter names.
- **Title** (800, clamp(2.1rem, 4vw, 3.4rem), line-height 0.9): Work titles.
- **Body** (400, 1.125rem, line-height 1.6): Essays, held to 68ch.
- **Label** (500, 0.75rem): Frame numbers in the sprocket and on the bands.

**The Counter Rule.** Martian Mono appears only on frame numbers. Credits, notes, and essays stay in Literata.

## Layout

Desktop is a sticky sprocket rail (6.5rem) and a reading column. The opening gate is at least one screen. Chapter padding starts at 4.5rem and grows with the viewport. The reading measure is 68ch. Below 800px the sprocket becomes a sticky top bar and the side gutter drops to 1.15rem. Anchor jumps keep 5.25rem of scroll padding so the bar does not cover a heading.

**The Strip Rule.** Chapters are frames on one page, not separate cards. A cobalt void (7.5rem, 4.5rem on a narrow screen) is the cut between reels.

## Elevation & Depth

The system is flat. Depth is a change of field: stock, then a cobalt plate, then stock again. There is no shadow vocabulary.

**The Flat Gate Rule.** Do not add drop shadows, glows, or blur to make a band feel raised. A filled cobalt rectangle is the raised state.

## Shapes

Gates, bands, and work plates are square (0). Sprocket holes are short rounded punches (0.28rem), because a real sprocket hole is a rounded slot. Registration marks are four L-corners drawn as a stroke, not a frame around a card.

## Components

### Navigation

The sprocket is the navigation. Each item is a hole, a vertical name, and a frame number. The current hole fills with cobalt. On a narrow screen the names turn horizontal and sit in one sticky row. Focus is a 2px edge-code outline, offset 3px.

### Reel bands

The three opening links are full-width rows with a 1px cobalt rule. The threaded row, and any row under hover or focus, fills with lab cobalt and sets its type in gate white. Padding stays put so the label does not jump.

### Work plates

A work is a title, an italic Literata credit in edge code, and essays. The middle work of a chapter is a full-bleed cobalt plate with gate-white type. Plates are not cards: no radius, no shadow, no side stripe.

### Next reel

The end of a chapter is a display-size link naming the next frame, with a 2px cobalt underline. Hover fills the link with cobalt.

## Do's and Don'ts

### Do:

- **Do** keep the ground on film stock and the emphasis on lab cobalt.
- **Do** use Big Shoulders Display for names and Literata for anything a person reads.
- **Do** mark the current frame in the sprocket and in the live counter.

### Don't:

- **Don't** introduce a third hue, a cream ground, or gray secondary text.
- **Don't** put Martian Mono on credits, body, or labels that are not frame counts.
- **Don't** wrap a work in a rounded card, a glass panel, or a glow.
- **Don't** put an eyebrow label above a heading. The heading is the name.
