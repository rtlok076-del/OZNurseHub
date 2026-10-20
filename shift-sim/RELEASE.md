# Ward Shift playtest 0.3
Replaces Med Squad Survivors on OzNurseHub, with the old address forwarding to /shift-sim/.
28 tasks, shift planning, patient identity checks, observation/fluid/progress records, distinct time and energy costs, delegation and one covered break. Fictional educational prototype; clinical review pending.
Runtime assets are versioned together to avoid mixed cached releases. Uses shared site appearance preference. Game saves remain local to the browser.
Rollback: revert this release commit. Previous site main: afb317c5edd2c38b8dad0b0d7623e67bf8f8b537. Bump the service-worker cache identifier again when reverting to invalidate caches.
Checks: node --test shift-sim/engine.test.mjs; node tests/service-worker-runtime.cjs; mobile/browser launch and redirect checks.
