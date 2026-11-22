"use strict";

const {factions, sources} = window.haedong;
const sites = window.haedong.sites.map(([id, name, faction, x, y, status, leader, links, description]) =>
  ({id, name, faction, x, y, status, leader, links, description}));
const people = window.haedong.people.map(([id, name, faction, role, evidence, site, source, bio, stats, aliases]) =>
  ({id, name, faction, role, evidence, site, source, bio, stats, aliases}));
const bySite = new Map(sites.map(site => [site.id, site]));
const byPerson = new Map(people.map(person => [person.id, person]));
const get = id => document.getElementById(id);

function element(tag, content, className) {
  const node = document.createElement(tag);
  if (content) node.textContent = content;
  if (className) node.className = className;
  return node;
}

function link(label, href, className) {
  const node = element("a", label, className);
  node.href = href;
  return node;
}

function card(item, path, subtitle) {
  const node = link(item.name, path + item.id);
  node.append(element("span", subtitle));
  return node;
}

const map = get("map");
const areas = {
  고구려: "polygon(23% 0,64% 0,61% 38%,63% 56%,50% 64%,46% 52%,33% 54%,32% 31%)",
  백제: "polygon(46% 59%,57% 59%,61% 74%,58% 91%,48% 87%)",
  신라: "polygon(57% 59%,65% 53%,74% 70%,72% 89%,58% 94%,61% 74%)",
  왜: "polygon(73% 86%,81% 69%,91% 65%,99% 49%,100% 76%,89% 86%,80% 94%)",
  당: "polygon(0 0,25% 0,35% 24%,30% 35%,26% 47%,32% 54%,26% 64%,20% 89%,0 100%)"
};

for (const [faction, color] of Object.entries(factions)) {
  const area = element("div", "", "region");
  area.style.setProperty("--shape", areas[faction]);
  area.style.setProperty("--color", color);
  map.append(area);
  for (const [target, label] of [
    ["legend", faction],
    ["counts", faction + " " + people.filter(person => person.faction === faction).length + " / 100명"]
  ]) {
    const badge = element("li", label);
    badge.style.setProperty("--color", color);
    get(target).append(badge);
  }
  get("nation").add(new Option(faction, faction));
}

const drawn = new Set();
const routes = [];
for (const site of sites) {
  for (const id of site.links) {
    const key = [site.id, id].sort().join("/");
    if (drawn.has(key)) continue;
    drawn.add(key);
    const line = element("div", "", "route");
    line.style.left = site.x + "%";
    line.style.top = site.y + "%";
    map.append(line);
    routes.push([line, site, bySite.get(id)]);
  }
  const marker = link(site.name, "#site/" + site.id, site.name.length > 4 ? "pin long" : "pin");
  marker.style.left = site.x + "%";
  marker.style.top = site.y + "%";
  marker.style.setProperty("--color", factions[site.faction]);
  marker.setAttribute("aria-label", site.faction + " " + site.name);
  map.append(marker);
  get("sites").append(card(site, "#site/", site.faction + " · " + site.status));
}

new ResizeObserver(() => {
  for (const [line, from, to] of routes) {
    const x = (to.x - from.x) * map.clientWidth / 100;
    const y = (to.y - from.y) * map.clientHeight / 100;
    line.style.width = Math.hypot(x, y) + "px";
    line.style.transform = "rotate(" + Math.atan2(y, x) + "rad)";
  }
}).observe(map);

for (const role of [...new Set(people.map(person => person.role))].sort((a, b) => a.localeCompare(b, "ko"))) {
  get("role").add(new Option(role, role));
}

function renderRoster() {
  const query = get("query").value.trim().normalize().toLowerCase();
  const nation = get("nation").value;
  const role = get("role").value;
  const assigned = get("assigned").value;
  const matches = people.filter(person =>
    (!nation || person.faction === nation) &&
    (!role || person.role === role) &&
    (!assigned || Boolean(person.site) === (assigned === "yes")) &&
    [person.name, person.aliases ?? ""].some(name => name.normalize().toLowerCase().includes(query)));
  get("count").textContent = matches.length ? matches.length + "명 표시" : "조건에 맞는 인물이 없습니다.";
  get("roster").replaceChildren(...matches.map(person => card(person, "#person/", person.faction + " · " + person.role)));
}

function facts(rows) {
  const list = element("dl", "", "facts");
  for (const [label, value] of rows) {
    const description = element("dd");
    description.append(value);
    list.append(element("dt", label), description);
  }
  return list;
}

function siteDetail(site) {
  const connections = element("div");
  for (const id of site.links) {
    if (connections.childElementCount) connections.append(" · ");
    connections.append(link(bySite.get(id).name, "#site/" + id));
  }
  return [
    element("p", site.description),
    facts([
      ["소속", site.faction], ["상태", site.status],
      ["담당 인물", site.leader ? link(byPerson.get(site.leader).name, "#person/" + site.leader) : "미확인"],
      ["주둔군", "미확인"], ["방어 수치", "미확인"], ["군량", "미확인"], ["연결 거점", connections]
    ])
  ];
}

function personDetail(person) {
  const [sourceName, sourceUrl] = sources[person.source];
  return [
    element("p", person.faction + " · " + person.role + " · " + person.evidence),
    facts([
      ["시나리오 배치", person.site ? link(bySite.get(person.site).name, "#site/" + person.site) : "미배치"],
      ["이명", person.aliases ?? "미등록"]
    ]),
    element("h3", "능력치 · 게임 설계값"),
    facts(["통솔", "무력", "지력", "정치", "외교"].map((label, index) =>
      [label, String(person.stats?.[index] ?? "미확인")])),
    element("h3", "열전"),
    element("p", person.bio),
    link(sourceName, sourceUrl)
  ];
}

function showRoute(moveFocus = false) {
  const [route, id] = location.hash.slice(1).split("/");
  const item = route === "site" ? bySite.get(id) : route === "person" ? byPerson.get(id) : undefined;
  const active = item ? route : ["map", "people", "brief"].includes(route) ? route : "intro";
  const views = {intro:"intro", map:"map-view", people:"people-view", brief:"brief", site:"detail", person:"detail"};
  get("scenario").hidden = active === "intro";
  for (const view of new Set(Object.values(views))) get(view).hidden = view !== views[active];
  for (const anchor of document.querySelectorAll("nav a")) {
    const section = {site:"map", person:"people"}[active] ?? active;
    if (anchor.hash === "#" + section) anchor.setAttribute("aria-current", "page");
    else anchor.removeAttribute("aria-current");
  }
  if (item) {
    const heading = element("h2", item.name);
    heading.tabIndex = -1;
    const back = active === "site" ? ["세력지도로", "#map"] : ["인물 목록으로", "#people"];
    get("detail").replaceChildren(heading, ...(active === "site" ? siteDetail(item) : personDetail(item)), element("hr"), link(...back));
  }
  if (moveFocus) {
    window.scrollTo(0, 0);
    const heading = get(views[active]).querySelector("h1, h2");
    heading.tabIndex = -1;
    heading.focus({preventScroll:true});
  }
}

get("filters").addEventListener("input", renderRoster);
get("filters").addEventListener("submit", event => event.preventDefault());
window.addEventListener("hashchange", () => showRoute(true));
renderRoster();
showRoute();
