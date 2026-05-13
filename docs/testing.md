# laundry-delivery-web — Testing (harness rules)

Audience: AI coding agents. Follow these rules literally. Humans reading this can skim.

## Scope

MVP. The suite intentionally covers only contracts that, if broken, would silently produce wrong real-world behavior. Do **not** expand coverage beyond the categories below without an explicit instruction from the user.

## What is covered (and why)

| Test file | Protects |
|---|---|
| `src/__tests__/utils.test.ts` | Label maps and package state predicates. These drive card badges, screen routing, and toast wording. |
| `src/__tests__/api.test.ts` | The `ApiError` contract: status + server `message` + raw `details`. Every screen's `ErrorNotice` depends on this shape. Also pins GET-vs-POST auto-selection and `Authorization` header. |
| `src/__tests__/HandoffScreen.test.tsx` | The photo-required gate. Handoff must be impossible without a registered photo. This is the single most important business rule in the app. |
| `src/__tests__/WorkListScreen.test.tsx` | Tab → handler routing. The "ready" tab must invoke the outbound flow; the "delivering" tab must invoke the handoff flow. Swapping these would corrupt the item state machine. |

## What is deliberately **not** covered

Do not add tests for these unless the user explicitly asks:

- Zustand store persistence — trusted library, no project-specific logic.
- `App.tsx` step machine and session-restore effect — covered by manual QA; integration test cost is high relative to MVP value.
- `LoginScreen`, `RunSetupScreen`, `WorkDetailScreen`, `RunCloseDialog`, `PackageCard`, `PackageItemList`, `Toast`, `ErrorNotice`, `AppChrome` — thin wrappers over the contracts already pinned above.
- CSS, layout, inline styles, snapshot output.
- 5-second polling (`refetchInterval`) — owned by TanStack Query.
- The OpenAPI generator pipeline (`generate:api`) — not wired into the runtime client yet.

If you believe a new test is needed outside these files, **stop and ask the user first.** Adding tests has a cost: more code to maintain and more failures to diagnose when the API shape evolves.

## Infrastructure facts (do not rediscover)

- Runner: **Vitest** with `jsdom`. Globals are **off** — `describe`/`it`/`expect`/`vi` must be imported from `vitest`.
- jsdom URL is pinned to `http://localhost:3000` (`vitest.config.ts`). The app's `VITE_API_BASE_URL` defaults to `/api`, so all fetches resolve to `http://localhost:3000/api/...`.
- **`baseUrl`** for MSW handlers is exported from `src/test/fixtures.ts` and equals `http://localhost:3000/api`. Always use it; never hard-code a URL.
- Network: **MSW v2** with `setupServer` in `src/test/server.ts`. `onUnhandledRequest: 'error'` is set — any un-mocked request fails the test. Register handlers per-test with `server.use(...)`; they reset automatically in `afterEach`.
- Rendering: import `renderWithProviders` from `src/test/renderWithProviders.tsx`. It wraps in a fresh `QueryClient` with `retry: false` and `staleTime: 0`. Do not create new providers ad hoc.
- Fixtures: factory functions in `src/test/fixtures.ts` (`session`, `run`, `pkg()`, `item()`, `photo()`). Extend via the `overrides` parameter; do not duplicate the literal objects.

## Rules for editing tests

1. **Pin behavior, not implementation.** Query by role/text the way the user sees it (`getByRole('button', { name: '...' })`), never by class name or DOM structure.
2. **No new test file without first checking whether an existing file already covers the surface.** Most additions belong as another `it(...)` in an existing `describe`.
3. **When the API shape changes**, update `src/types.ts` and the fixture factories in `src/test/fixtures.ts` together. Tests should keep passing without per-test edits.
4. **Async waits**: prefer `findBy*` over `waitFor(() => getBy*)`. Use `waitFor` only when asserting on a non-DOM side-effect (e.g. a captured flag).
5. **Do not add `vi.useFakeTimers()`** in any of these tests — none of the covered paths depends on time. If you find yourself needing it, you are testing something outside the MVP scope.
6. **Do not call `act(...)` manually.** `userEvent` and RTL wrap state updates already.
7. **Do not test loading skeletons or transient states.** They are visual; the contracts that matter are the resolved values.

## Running

```powershell
npm test            # one-shot
npm run test:watch  # interactive
```

CI must run `npm test`. A red test is a hard stop; never skip or `.todo` a failing case without user approval.

## When the user adds a new business rule

Treat this as a checklist before declaring the change complete:

- Is the new rule a server-driven contract (status code, response shape)? → extend `api.test.ts`.
- Is it a UI gate that prevents an irreversible action (handoff, run close, etc.)? → add a test in the matching screen file, modeled on the photo-guard test.
- Is it a label or state predicate? → add a case to `utils.test.ts`.
- Otherwise: ask the user whether a test is wanted. Default to **no**.
