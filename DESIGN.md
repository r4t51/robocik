---
name: Robocik
description: An orange handheld maze toy on a cutting mat.
colors:
  desk: "#24180f"
  mat: "#2f6f5e"
  shell: "#d85a22"
  plate: "#f0c48a"
  screen: "#0d1c16"
  player: "#2bb8aa"
  red-eye: "#ff2a2a"
  white-eye: "#f7f4ee"
  exit: "#7bed9f"
typography:
  display:
    fontFamily: "Rowdies, Trebuchet MS, sans-serif"
    fontSize: "clamp(2rem, 8vw, 3.4rem)"
    fontWeight: 400
    lineHeight: 0.9
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Atkinson Hyperlegible, Avenir Next, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "normal"
rounded:
  toy: "1.8rem"
  screen: "0.7rem"
  jump: "999px"
spacing:
  toy: "0.85rem"
  deck: "0.8rem"
components:
  jump-button:
    backgroundColor: "{colors.shell}"
    textColor: "#fff4e4"
    typography: "{typography.display}"
    rounded: "{rounded.jump}"
---

# Design System: Robocik

## Overview

**Creative North Star: "The Desk Toy"**

The game is a plastic handheld left on a green cutting mat. Orange shell, cream plate, dark maze screen. Cardboard walls sit on linoleum-green tiles. The player is teal with a yellow antenna. Hunters have red lamps. Sweepers have white lamps.

**Key Characteristics:**

- Orange plastic owns the chrome, not a thin accent
- Maze lives in a recessed screen with a dark inset
- Lives are square pips, jump is a round toy button
- No neon grid, no glass HUD, no scoreboard chrome

## Colors

Night workshop: walnut desk, green mat, orange toy, cream labels.

- **Shell** (#d85a22): The handheld and the jump button
- **Mat** (#2f6f5e): The desk pad under the toy
- **Plate** (#f0c48a): Rule card
- **Screen** (#0d1c16): Maze well
- **Player teal** (#2bb8aa)
- **Red eye** (#ff2a2a)
- **White eye** (#f7f4ee)
- **Exit** (#7bed9f)

## Typography

Rowdies for the toy name and the two big buttons. Atkinson Hyperlegible for rules and meter labels, because a child has to read them on a phone.

## Layout

One column: name and meters, maze, stick and jump. Phone first. On a short screen the title and the buttons shrink before the maze does.

## Elevation

The toy sits on the mat with a hard drop. The screen is inset. The jump button has a thick plastic lip that shortens when pressed.

## Do's and Don'ts

### Do

- Keep the maze readable: cardboard walls, dark floor, bright exit
- Keep red and white eyes the loudest signal on an enemy
- Keep copy in short Polish lines

### Don't

- Don't turn this into a cyber neon board
- Don't hide jump behind a keyboard-only hint on a phone
- Don't spend a life for a wall. Walls reset. Robots cost lives.
