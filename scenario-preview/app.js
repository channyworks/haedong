"use strict";

const {factions, sources} = window.haedong;
const sites = window.haedong.sites.map(([id, name, faction, lon, lat, status, leader, links, description, location, source, region]) =>
  ({id, name, faction, lon, lat, status, leader, links, description, location, source, region}));
const people = window.haedong.people.map(([id, name, faction, role, evidence, site, source, bio, stats, aliases, tag, year]) =>
  ({id, name, faction, role, evidence, site, source, bio, stats, aliases, tag, year}));
const bySite = new Map(sites.map(site => [site.id, site]));
const byPerson = new Map(people.map(person => [person.id, person]));
const legacySites = new Map([["front", "daeya"], ["sea", "naniwa"]]);
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
  const node = link(item.name, path + encodeURIComponent(item.id));
  node.append(element("span", subtitle));
  return node;
}

const map = get("map");
const regions = {
  world: ["전체",107,141,32,44],
  liao: ["요동·압록강",119.4,127,38.3,42.6],
  korea: ["한반도",124.7,130.1,34.5,39.7],
  wa: ["아스카·난바",134.7,136.65,34.12,35.45],
  tang: ["당의 후방",107,122.2,33,40]
};
let region = "world";

function control(label, handler, className) {
  const node = element("button", label, className);
  node.type = "button";
  node.addEventListener("click", handler);
  return node;
}

for (const [faction, color] of Object.entries(factions)) {
  for (const [target, label] of [
    ["legend", faction],
    ["counts", faction + " " + people.filter(person => person.faction === faction && person.tag !== "창작").length + " / 100명"]
  ]) {
    const badge = element("li", label);
    badge.style.setProperty("--color", color);
    get(target).append(badge);
  }
  get("nation").add(new Option(faction, faction));
}

const labels = new Set(["ansi","pyongyang","sabi","seorabeol","naniwa","changan"]);
const mapButtons = new Map();
for (const [id, [label]] of Object.entries(regions)) {
  const button = control(label, () => { region = id; renderMap(); });
  get("map-controls").append(button);
  mapButtons.set(id, button);
}

function drawMap() {
  const canvas = get("coastline");
  const width = map.clientWidth;
  const height = map.clientHeight;
  if (!width || !height) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(ratio, ratio);
  const [, west, east, south, north] = regions[region];
  const x = lon => (lon - west) / (east - west);
  const y = lat => (north - lat) / (north - south);
  ctx.beginPath();
  for (const ring of window.haedongCoastline) {
    ring.forEach(([lon, lat], index) => {
      if (index === 0) ctx.moveTo(x(lon) * width, y(lat) * height);
      else ctx.lineTo(x(lon) * width, y(lat) * height);
    });
    ctx.closePath();
  }
  ctx.fillStyle = "#314336";
  ctx.fill("evenodd");
  ctx.strokeStyle = "#718470";
  ctx.lineWidth = .8;
  ctx.stroke();
  const markers = [];
  const routes = new Set();
  for (const site of sites) {
    if (site.lon === null || x(site.lon) < .02 || x(site.lon) > .98 || y(site.lat) < .02 || y(site.lat) > .98) continue;
    for (const id of site.links) {
      const other = bySite.get(id);
      const key = [site.id, id].sort().join("/");
      if (other.lon === null || routes.has(key)) continue;
      routes.add(key);
      ctx.beginPath();
      ctx.moveTo(x(site.lon) * width, y(site.lat) * height);
      ctx.lineTo(x(other.lon) * width, y(other.lat) * height);
      ctx.strokeStyle = "#bfd0c187";
      ctx.setLineDash([3, 4]);
      ctx.stroke();
    }
    const showName = labels.has(site.id) && (width >= 500 || site.id === "ansi" || site.id === "changan");
    const marker = link(showName ? site.name : "•", "#site/" + site.id, showName ? "pin" : "pin dot");
    marker.style.left = x(site.lon) * 100 + "%";
    marker.style.top = y(site.lat) * 100 + "%";
    marker.style.setProperty("--color", factions[site.faction]);
    marker.setAttribute("aria-label", site.faction + " " + site.name);
    marker.title = site.name;
    markers.push(marker);
  }
  get("markers").replaceChildren(...markers);
}

function renderMap() {
  for (const [id, button] of mapButtons) button.setAttribute("aria-pressed", String(id === region));
  const shown = sites.filter(site => region === "world" || site.region === region);
  get("sites").replaceChildren(...shown.map(site => card(site, "#site/", site.faction + " · " + site.status)));
  drawMap();
}

new ResizeObserver(drawMap).observe(map);

for (const role of [...new Set(people.map(person => person.role))].sort((a, b) => a.localeCompare(b, "ko"))) {
  get("role").add(new Option(role, role));
}

function renderRoster() {
  const query = get("query").value.trim().normalize().toLowerCase();
  const nation = get("nation").value;
  const role = get("role").value;
  const assigned = get("assigned").value;
  const evidence = get("evidence").value;
  const matches = people.filter(person =>
    (!nation || person.faction === nation) &&
    (!role || person.role === role) &&
    (!evidence || (evidence === "historical" ? person.tag !== "창작" : person.tag === evidence)) &&
    (!assigned || Boolean(person.site) === (assigned === "yes")) &&
    [person.name, person.aliases ?? ""].some(name => name.normalize().toLowerCase().includes(query)));
  get("count").textContent = matches.length ? matches.length + "명 표시" : "조건에 맞는 인물이 없습니다.";
  get("roster").replaceChildren(...matches.map(person => card(person, "#person/", person.faction + " · " + person.tag)));
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
      ["시연 담당 인물", site.leader ? link(byPerson.get(site.leader).name, "#person/" + encodeURIComponent(site.leader)) : "미확인"],
      ["위치 근거", site.location], ["주둔군", "미확인"], ["방어 수치", "미확인"], ["군량", "미확인"], ["시연 연결 거점", connections]
    ]),
    link(...sources[site.source])
  ];
}

function personDetail(person) {
  const [sourceName, sourceUrl] = sources[person.source];
  return [
    element("p", person.faction + " · " + person.role + " · " + person.evidence + " · " + person.tag),
    facts([
      ["시연 배치 · 설계", person.site ? link(bySite.get(person.site).name, "#site/" + person.site) : "미배치"],
      ["이명", person.aliases ?? "미등록"],
      ["기록 시기", String(person.year)],
      ["출처 유형", person.tag]
    ]),
    element("h3", "능력치 · 게임 설계값"),
    facts(["통솔", "무력", "지력", "정치", "외교"].map((label, index) =>
      [label, String(person.stats?.[index] ?? "미확인")])),
    element("h3", "열전"),
    element("p", person.bio),
    link(sourceName, sourceUrl)
  ];
}

const simulator = window.haedongSimulation;
let selectedCampaign = "gog";
const cachedChoices = new Map();
let localSaveAvailable = true;

for (const [id, campaign] of Object.entries(simulator.campaigns)) {
  const choice = link(campaign.faction, "#play/" + id, "campaign");
  choice.style.setProperty("--color", factions[campaign.faction]);
  choice.append(element("strong", campaign.title), element("small", campaign.year));
  get("campaigns").append(choice);
}

function storedChoices(id) {
  if (cachedChoices.has(id)) return cachedChoices.get(id);
  let choices = [];
  try {
    const saved = JSON.parse(localStorage.getItem("haedong-preview-v1:" + id));
    if (Array.isArray(saved)) choices = simulator.replay(id, saved).history.map(event => event.id);
  } catch {
    localSaveAvailable = false;
  }
  cachedChoices.set(id, choices);
  return choices;
}

function saveChoices(id, choices) {
  cachedChoices.set(id, choices);
  try {
    localStorage.setItem("haedong-preview-v1:" + id, JSON.stringify(choices));
  } catch {
    localSaveAvailable = false;
  }
}

function renderPlay(id, moveFocus = false) {
  const choices = storedChoices(id);
  const run = simulator.replay(id, choices);
  const {campaign, values, history, finished, success} = run;
  const heading = element("h2", campaign.title);
  heading.tabIndex = -1;
  const scope = element("p", campaign.faction + " · " + campaign.year);
  const context = element("p", campaign.historical);
  context.append(" ", link(...sources[campaign.source]));
  const metrics = facts(campaign.meters.map((name, index) =>
    [name, String(values[index]) + " · 목표 " + campaign.target[index]]));
  const historyList = element("ol", "", "history");
  for (const event of history) {
    historyList.append(element("li", event.label + " · " + campaign.meters.map((name, index) =>
      name + " " + event.before[index] + " → " + event.after[index]).join(" / ") +
      (event.repeated ? " · 연속 명령 효과 감소" : "")));
  }
  const children = [heading, scope, context, link("시작 거점 · " + bySite.get(campaign.home).name, "#site/" + campaign.home)];
  if (id === "gog" && history.length === 0) {
    children.push(element("p", "초보자 안내 · 네 차례 군령을 내립니다. 성벽 보수로 수비를 높이고, 오골성 군량과 구원군 연락을 함께 챙겨 보세요.", "notice"));
  }
  if (history.length === 0) children.push(element("small", "군령 이력은 현재 브라우저에 저장됩니다."));
  children.push(element("h3", "플레이 지표 · 시연값"), metrics);
  if (finished) {
    children.push(element("h3", success ? "목표 달성" : "목표 일부 미달"), element("p", success ? campaign.success : campaign.failure),
      link("플레이로 쓴 소설 보기", "#story/" + id, "action"));
  } else {
    const phase = campaign.phases[history.length];
    children.push(element("h3", (history.length + 1) + " / " + campaign.phases.length + "턴 · " + phase[0]),
      element("p", phase[1]));
    const orders = element("div", "", "orders");
    for (const [key, label, effect] of campaign.orders) {
      const button = control(label, () => {
        if (storedChoices(id) !== choices) return;
        saveChoices(id, [...choices, key]);
        renderPlay(id, true);
      });
      const changes = campaign.meters.map((name, index) => effect[index] === 0 ? "" :
        name + " " + (effect[index] > 0 ? "+" : "") + effect[index]).filter(Boolean);
      button.append(element("small", changes.join(" · ")));
      orders.append(button);
    }
    children.push(orders);
  }
  if (history.length) {
    children.push(element("h3", "군령 이력"), historyList);
    if (!finished) children.push(link("지금까지 쓴 소설 보기", "#story/" + id));
    children.push(control("이 세력 다시 시작", () => {
      if (!window.confirm("이 세력의 현재 군령 이력을 초기화하시겠습니까?")) return;
      saveChoices(id, []);
      renderPlay(id, true);
    }, "quiet-button"));
  }
  if (!localSaveAvailable) children.push(element("p", "이 브라우저에서 저장을 사용할 수 없습니다. 새로고침하면 이력이 사라질 수 있습니다."));
  get("play").replaceChildren(...children);
  if (moveFocus) heading.focus({preventScroll:true});
}

function renderStory(id) {
  const run = simulator.replay(id, storedChoices(id));
  const heading = element("h2", "나만의 역사소설");
  heading.tabIndex = -1;
  if (!run.history.length) {
    get("story").replaceChildren(heading, element("p", "군령을 한 번 내리면 선택과 결과가 소설 초안에 반영됩니다."),
      link("플레이로 돌아가기", "#play/" + id));
    return;
  }
  const titleLabel = element("label", "소설 제목");
  const title = element("input");
  title.value = run.campaign.title;
  title.maxLength = 100;
  titleLabel.append(title);
  const outputLabel = element("label", "편집 가능한 Markdown 초안");
  const output = element("textarea");
  output.rows = 16;
  const generated = simulator.draft(run.campaign.title, run);
  output.value = generated.lines.join("\n");
  const reading = element("article", "", "story-reading");
  reading.setAttribute("aria-label", "생성된 소설 읽기");
  reading.append(element("small", "플레이에서 나온 창작 장면"), element("h3", run.campaign.title),
    element("p", run.campaign.opening), ...generated.chapters.map(chapter => element("p", chapter.prose)),
    element("p", generated.ending));
  outputLabel.append(output);
  const buttons = element("div", "", "map-controls");
  buttons.append(control("제목을 초안에 반영", () => {
    const headingEnd = output.value.indexOf("\n");
    const revisedTitle = title.value.trim() || run.campaign.title;
    reading.querySelector("h3").textContent = revisedTitle;
    output.value = "# " + revisedTitle +
      (headingEnd === -1 ? "\n" : output.value.slice(headingEnd));
  }));
  buttons.append(control("소설 Markdown 저장", () => {
    const url = URL.createObjectURL(new Blob([output.value], {type:"text/markdown;charset=utf-8"}));
    const download = link("소설 다운로드", url);
    download.download = "haedong-" + id + "-story.md";
    download.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }));
  const context = element("p", run.campaign.historical);
  context.append(" ", link(...sources[run.campaign.source]));
  get("story").replaceChildren(heading, context, element("p", "초안에는 창작 장면과 선택별 지표 변화가 담깁니다. 편집한 문장은 파일로 저장해 보관하세요."),
    reading, titleLabel, outputLabel, buttons, link("플레이로 돌아가기", "#play/" + id));
}

function showRoute(moveFocus = false) {
  const [route, rawId] = location.hash.slice(1).split("/");
  let id = rawId;
  try {
    if (rawId) id = decodeURIComponent(rawId);
  } catch {
    id = null;
  }
  const item = route === "site" ? bySite.get(legacySites.get(id) ?? id) : route === "person" ? byPerson.get(id) : undefined;
  const campaignRoute = ["play", "story"].includes(route) && Object.hasOwn(simulator.campaigns, id);
  if (campaignRoute) selectedCampaign = id;
  const active = item || campaignRoute || ["map", "people", "brief", "concept"].includes(route) ? route : "intro";
  const views = {intro:"intro", map:"map-view", people:"people-view", brief:"brief", site:"detail", person:"detail",
    play:"play", story:"story", concept:"concept"};
  get("choose").hidden = active !== "intro";
  get("scenario").hidden = active === "intro";
  get("scenario-title").textContent = simulator.campaigns[selectedCampaign].faction + " · 해동삼국지";
  get("play-nav").href = "#play/" + selectedCampaign;
  get("story-nav").href = "#story/" + selectedCampaign;
  for (const view of new Set(Object.values(views))) get(view).hidden = view !== views[active];
  for (const anchor of document.querySelectorAll("nav a")) {
    const section = {site:"map", person:"people"}[active] ?? active;
    if (anchor.hash.split("/")[0] === "#" + section) anchor.setAttribute("aria-current", "page");
    else anchor.removeAttribute("aria-current");
  }
  if (item) {
    const heading = element("h2", item.name);
    heading.tabIndex = -1;
    const back = active === "site" ? ["세력지도로", "#map"] : ["인물 목록으로", "#people"];
    get("detail").replaceChildren(heading, ...(active === "site" ? siteDetail(item) : personDetail(item)), element("hr"), link(...back));
  }
  if (active === "map") renderMap();
  if (active === "play") renderPlay(id);
  if (active === "story") renderStory(id);
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
