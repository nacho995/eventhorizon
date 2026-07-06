# 🌌 EventHorizon

**See the JavaScript event loop as a galaxy.** Why does this print `1, 4, 3, 2` and not `1, 2, 3, 4`?

```js
console.log(1)
setTimeout(() => console.log(2))
Promise.resolve().then(() => console.log(3))
console.log(4)
```

EventHorizon replays the answer in space — step by step, so you can *watch* the order happen instead of memorizing a rule.

<!-- TODO: add a screenshot/GIF of the current look here:
![EventHorizon](docs/screenshot.png)
-->

## The idea

Existing event-loop visualizers are flat grey 2D boxes. EventHorizon maps the whole machinery to a space metaphor you can see, where **every element means one exact thing**:

| Event loop | In the galaxy |
|---|---|
| Call stack (what runs *now*) | The **planet** |
| Web APIs (where async waits) | The **orbit** |
| Microtask queue (promises, `await`) | The **VIP lane** — gold, always first |
| Macrotask queue (`setTimeout`) | The **normal lane** — cyan |
| `console.log` | **Stars** that light up |

Async tasks are **ships**: they launch off the planet, orbit, queue up, and land to run. The golden rule made visible — the loop empties **all** microtasks before **one** macrotask — is exactly what produces `1, 4, 3, 2`.

## Run it

```bash
git clone https://github.com/nacho995/eventhorizon.git
cd eventhorizon/frontend
npm install
npm run dev
```

## How it works

Built on a **derived-state** model (event sourcing). A *trace* — an ordered list of events — is replayed step by step, and the world (which stars are lit, which ships are in which queue) is **computed** from the trace up to the current step:

```
trace (events) ──reduce──▶ world state ──▶ 3D scene
```

Because the state is a pure function of the step, stepping **backward is free**: change the number, the world recomputes. No manual undo, no state to keep in sync.

## Stack

- **Vite · React · TypeScript**
- **react-three-fiber** + **drei** — declarative Three.js
- **@react-spring/three** — ships interpolate between zones (they travel, they don't teleport)
- **@react-three/postprocessing** — bloom, for the space glow

## Roadmap

- [x] Frontend with a mock trace of the canonical `1, 4, 3, 2`
- [x] Per-ship animation, space aesthetic, and a narrator panel that explains each step
- [ ] **Simulation engine** (NestJS backend): parse arbitrary JS → AST → interpret the event loop → emit the trace
- [ ] Highlight the running line of code at each step
- [ ] Accounts (JWT) to save your visualizations
- [ ] Community gallery of snippets

## Status

🚧 **Work in progress.** The frontend visualizes a hand-written mock trace of the canonical example. The engine that generates traces from *arbitrary* code is the next big piece — and the real technical challenge.
