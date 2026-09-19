# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML, CSS, and JavaScript. Open `index.html`, or the published GitHub Pages URL on an iPad.

## Users

A child or anyone who wants a short walking shop game on a phone or iPad. They already play Robocik from the same site; that maze stays at `labirynt/`.

## Product Purpose

You are a kitten in a pizza room. You pick fur and marks, walk to the oven, carry mushroom pizza to tables, take coins, and spend those coins on parlor upgrades. Dirty plates stay. The kitten does not take trash.

## Positioning

A messy pizza parlor run by a cat that only delivers pizza. Tables fill with leftover plates. New guests sit anyway. It is not a tidy café sim and not a human lunch window.

## Operating Context

Open the page, set a cat look, tap Biegam z pizzą, walk, drop pizza on a table, upgrade. Progress sits in localStorage (`kot-pizza-save`) on that device. No account.

## Capabilities and Constraints

- Character creator: fur color, marks (plain / patches / stripes), extra (none / bow / bell).
- You walk. The oven is the only pickup. The only food is mushroom pizza (`Pizza z grzybami`).
- There are tables. Walk a pizza to a seated guest and it places itself. After a short eat, they pay and leave trash.
- Trash is not a job. `tryTakeTrash` always fails. Tapping leftover plates says they stay.
- The next guest may sit at a dirty table.
- Money from sales. A shop screen sells a louder sign, faster walk, a fourth table, and bigger slices.
- Polish copy.
- The old maze remains at `labirynt/`.

## Brand Commitments

- Name: Pizza u Kotka.
- You are a kitten, not a person.
- Only mushroom pizza.
- Tables, not a single counter queue.
- Trash stays.

## Evidence on Hand

The player asked, in Polish, to stop being a little human, be a kitten, have tables, sell only mushroom pizza (“kij grzyb pizza”), and not take away trash.

## Product Principles

- One loop: look → walk pizza to a table → guest eats → trash stays → upgrade.
- Big tap targets. A nearby oven or table is obvious.
- Late guests leave with no pay. Wrong jobs (trash) do nothing.
