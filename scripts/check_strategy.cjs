const assert = require("node:assert/strict");
const {test} = require("node:test");

global.window = {};
require("../scenario-preview/data.js");
require("../scenario-preview/simulation.js");
require("../scenario-preview/history-data.js");
require("../scenario-preview/strategy.js");
const {start, proposal, advance, finish, policies} = window.haedongStrategy;
const {campaigns, replay} = window.haedongSimulation;

test("manual recommendations, step-by-step auto, and skipping use the same replay", () => {
  for (const seed of [0, 645, 4294967295]) {
    let run = start(seed);
    while (run.turn < 4) {
      const order = proposal(run, "gog").order;
      run = advance(run, {faction:"gog",order});
    }
    assert.deepEqual(run, finish(start(seed)));
    assert.equal(advance(run), run);
    assert.equal(Object.keys(run.frontiers).length, 6);
    assert(Object.values(run.frontiers).every(side => side.policy !== "대기" && side.stock >= 0 && side.autonomy <= 100));
    for (const [id, side] of Object.entries(run.states)) {
      const report = replay(id, side.choices);
      assert(report.finished);
      assert.deepEqual(report.history, run.log.map(events => events.find(event => event.id === id).order));
      assert.equal(run.log.at(-1).find(event => event.id === id).success, report.success);
      assert(side.politics.every(value => value >= 0 && value <= 100));
      assert(side.treasury >= 0 && side.treasury <= 12);
    }
    assert.deepEqual(advance(start(seed), {faction:"invalid",order:"invalid"}), advance(start(seed)));
  }
});

test("simultaneous decisions read the prior turn and player override changes only that turn's order", () => {
  const initial = start(645);
  const alternative = campaigns.gog.orders.find(([key]) => key !== proposal(initial,"gog").order)[0];
  const auto = advance(initial);
  const manual = advance(initial,{faction:"gog",order:alternative});
  assert.equal(manual.states.gog.choices[0], alternative);
  assert.equal(manual.log[0].find(event => event.id === "gog").manual, true);
  for (const id of ["baek","sil","tang","wa"]) assert.deepEqual(manual.states[id],auto.states[id]);
  for (const event of manual.log[0]) assert(policies[event.policy].cost <= initial.states[event.id].treasury);
  assert.equal(initial.turn, 0);
  assert(initial.states.gog.choices.length === 0);
  assert.deepEqual(advance(initial,{faction:"gog",order:"invalid"}),auto);
});
