# Mathable

Mathable is a Boggle-style math puzzle game where players trace adjacent tiles on a 4×4 grid to form expressions that evaluate to a target number. This repository contains a React/TypeScript frontend, an Express/TypeScript backend with Socket.IO for realtime multiplayer, and shared logic used by both sides.

## Structure

- `/client` – React + Vite app
- `/server` – Node/Express server
- `/shared` – Pure TypeScript logic and types reused by client/server

## Running the project

Install dependencies for all packages:

```bash
npm run install-all
```

Start server and client (in separate terminals):

```bash
npm run start:server
npm run start:client
```

Client will run on `http://localhost:3000`, server on `http://localhost:4000`.

## Tests

Run all tests:

```bash
npm test
```

## Rules & Scoring

See `docs/rules.md` for full description of game rules, round flow, scoring, and assumptions.

## Assumptions

- The shortest valid expression uses 3 tiles (number-operator-number); base points treat this as "2-tile" in scoring as per spec note.
- Target generation code picks a random solution's value; may not always guarantee 3 distinct solutions but tries.

