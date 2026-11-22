const assert = require("node:assert/strict");
const {test} = require("node:test");

global.window = {};
require("../scenario-preview/data.js");
require("../scenario-preview/coastline.js");
require("../scenario-preview/simulation.js");
const {factions, sites, people, sources} = window.haedong;
const {campaigns, replay, draft} = window.haedongSimulation;

test("atlas links, tags and coordinates resolve", () => {
  const siteIds = new Set(sites.map(([id]) => id));
  const personIds = new Set(people.map(([id]) => id));
  assert.equal(siteIds.size, sites.length);
  assert.equal(personIds.size, people.length);
  assert.equal(new Set(people.map(([, name]) => name)).size, people.length);
  for (const [id, , nation, lon, lat, , leader, links, , notes, source] of sites) {
    assert(factions[nation] && sources[source] && notes, id);
    assert(lon === null ? lat === null : lon >= 106 && lon <= 143 && lat >= 30 && lat <= 45, id);
    assert(!leader || people.some(row => row[0] === leader && row[5] === id), id);
    assert(links.every(edge => siteIds.has(edge)), id);
  }
  const tags = new Set(["정사", "금석문", "야사·전승", "전승", "창작"]);
  for (const [id, , nation, , evidence, site, source, bio, stats, , tag, year] of people) {
    assert(factions[nation] && sources[source] && bio && tags.has(tag) && year, id);
    assert.equal(evidence === "창작", tag === "창작", id);
    assert(!site || siteIds.has(site), id);
    assert(!stats || stats.length === 5 && stats.every(value => Number.isInteger(value) && value >= 0 && value <= 100), id);
  }
  for (const nation of Object.keys(factions)) {
    assert(people.some(row => row[2] === nation && row[10] !== "창작"), nation);
  }
  assert(window.haedongCoastline.length > 30);
});

test("each campaign accepts distinct decisions, has two outcomes, and produces a traceable draft", () => {
  assert.equal(Object.keys(campaigns).length, 5);
  for (const [id, campaign] of Object.entries(campaigns)) {
    assert(factions[campaign.faction] && sources[campaign.source] && sites.some(site => site[0] === campaign.home), id);
    const [first, second, third] = campaign.orders.map(([key]) => key);
    const paths = [[first, second, third, third], [first, first, first, first]];
    const [win, lose] = paths.map(path => replay(id, path));
    assert(win.finished && win.success, id);
    assert(lose.finished && !lose.success, id);
    assert.deepEqual(replay(id, paths[0]), win, id);
    assert(replay(id, ["invalid"]).history.length === 0, id);
    assert.equal(replay(id, [...paths[0], first]).history.length, 4, id);
    const output = draft("나의 기록", win);
    assert.equal(output.chapters.length, win.history.length, id);
    const markdown = output.lines.join("\n");
    assert(markdown.includes(sources[campaign.source][1]), id);
    assert(win.history.every(event => markdown.includes(event.label) && markdown.includes(event.prose)), id);
    assert(markdown.includes(campaign.success), id);
  }
});
