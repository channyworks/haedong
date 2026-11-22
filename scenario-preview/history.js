"use strict";

window.haedongHistory = (() => {
  const {characters, factions:world, scenarios} = window.haedongHistoryData;
  const {factions,houses,relations,growth} = world;
  const countries = factions.filter(faction => ["core","expansion"].includes(faction.kind));
  const factionById = new Map(factions.map(faction => [faction.id,faction]));
  const personsById = new Map(characters.map(person => [person.person_id,person]));
  const houseById = new Map(houses.map(house => [house.id,house]));
  const historyView = document.getElementById("history-content");
  const levels = {A:"원문 확인",B:"이설·쟁점",C:"전승",U:"검증 대기"};
  const eraNames = {early:"전기 확장",base:"기본 시대",core:"핵심 캠페인",balhae:"발해 확장"};
  const kinds = {independent:"독립 국가",frontier:"변경·부흥 세력",candidate:"편입 검토"};
  const statsLabels = ["통솔","무력","지력","정치","매력"];
  const affiliationKinds = {defection:"귀순·망명",surrender:"항복",service:"복무",restoration:"부흥 세력",record:"기록 시기",reference_period:"대표 활동 시기",unbounded_reference:"연대 미확인"};
  const wide = matchMedia("(prefers-reduced-motion: reduce)");
  const filters = {query:"",faction:"",role:"",year:"",level:"",sort:"name",affiliation:"origin"};
  const yearDisplay = (from,to) => from === to ? String(from ?? "미확인") : `${from ?? "미상"}–${to ?? "미상"}`;
  const inYears = (year,from,to) => (from === null || year >= from) && (to === null || year <= to);
  const knownIn = (year,from,to) => (from !== null || to !== null) && inYears(year,from,to);
  const nation = id => factionById.get(id).name;

  function tag(name, value, className) {
    const result = document.createElement(name);
    if (value != null) result.textContent = value;
    if (className) result.className = className;
    return result;
  }

  function jump(label,href,className) {
    const link = tag("a",label,className);
    link.href = href;
    return link;
  }

  function button(label, handler, className) {
    const control = tag("button",label,className);
    control.type = "button";
    control.addEventListener("click",handler);
    return control;
  }

  function field(label,control) {
    const name = tag("label",label);
    name.append(control);
    return name;
  }

  function select(rows, value = "") {
    const control = tag("select");
    for (const [key,label] of rows) control.add(new Option(label,key));
    control.value = value;
    return control;
  }

  function yearInput(value) {
    const control = tag("input");
    Object.assign(control,{type:"number",min:391,max:926,step:1,value,placeholder:"전체"});
    return control;
  }

  function definition(rows) {
    const list = tag("dl",null,"facts");
    for (const [label,value] of rows) {
      const property = tag("dd");
      property.append(value);
      list.append(tag("dt",label),property);
    }
    return list;
  }

  function header(title,caption) {
    historyView.append(tag("h2",title,"history-title"),tag("p",caption,"history-caption"));
  }

  function card(title,subheading) {
    const box = tag("article",null,"panel history-card");
    box.append(tag("h3",title));
    if (subheading) box.append(tag("p",subheading,"history-caption"));
    return box;
  }

  function statTable(labels, series) {
    const table = tag("table",null,"history-table");
    const head = table.createTHead().insertRow();
    for (const label of ["항목",...series.map(item => item.name)]) {
      const cell = tag("th",label);
      cell.scope = "col";
      head.append(cell);
    }
    const body = table.createTBody();
    for (const [index,label] of labels.entries()) {
      const row = body.insertRow();
      const name = tag("th",label);
      name.scope = "row";
      row.append(name);
      for (const item of series) row.append(tag("td",String(item.values[index] ?? "미확인")));
    }
    const wrapper = tag("div",null,"history-table-wrap");
    wrapper.append(table);
    return wrapper;
  }

  function svg(name,attrs,value) {
    const node = document.createElementNS("http://www.w3.org/2000/svg",name);
    for (const [key,data] of Object.entries(attrs)) node.setAttribute(key,data);
    if (value != null) node.textContent = value;
    return node;
  }

  function chart(width,height,label) {
    const plot = svg("svg",{viewBox:`0 0 ${width} ${height}`,role:"img","aria-label":label,class:"history-svg"});
    plot.append(svg("title",{},label));
    return plot;
  }

  function radar(labels,series,title) {
    const block = tag("div",null,"history-radar");
    if (series.some(item => item.values.some(value => value !== null))) {
      const plot = chart(460,310,title);
      const origin = [230,148];
      const point = (index,size) => {
        const angle = index * 2*Math.PI/labels.length;
        return [origin[0] + Math.sin(angle)*size, origin[1]-Math.cos(angle)*size];
      };
      const polygon = values => values.map((value,i) => point(i,value*1.03).join(",")).join(" ");
      for (const step of [25,50,75,100]) plot.append(svg("polygon",{points:polygon(labels.map(() => step)),class:"chart-grid"}));
      for (const [i,label] of labels.entries()) {
        const [x,y] = point(i,103);
        const [tx,ty] = point(i,126);
        plot.append(svg("line",{x1:origin[0],y1:origin[1],x2:x,y2:y,class:"chart-grid"}));
        plot.append(svg("text",{x:tx,y:ty+4,"text-anchor":"middle",class:"chart-label"},label));
      }
      for (const item of series) {
        if (item.values.every(value => value !== null)) {
          plot.append(svg("polygon",{points:polygon(item.values),fill:item.color,"fill-opacity":0.12,stroke:item.color,"stroke-width":2.5}));
        }
        for (const [i,value] of item.values.entries()) {
          if (value === null) continue;
          const [cx,cy] = point(i,value*1.03);
          plot.append(svg("circle",{cx,cy,r:4,fill:item.color}));
        }
      }
      block.append(plot);
    } else {
      block.append(tag("p","확인된 게임 능력치가 없습니다.","notice"));
    }
    block.append(statTable(labels,series));
    return block;
  }

  function citations(entries) {
    const list = tag("ul",null,"history-sources");
    for (const item of entries) {
      const row = tag("li");
      row.append(item.url ? jump(item.title,item.url) : tag("span",item.title));
      const detail = [item.status === "checked" ? "확인" : "대조 후보",item.locator,item.edition,item.accessed_on].filter(Boolean);
      row.append(tag("small",detail.join(" · ")));
      if (item.claim) row.append(tag("span",item.claim));
      if (item.excerpt) row.append(tag("q",item.excerpt));
      list.append(row);
    }
    return list;
  }

  function showPerson(person) {
    const opener = document.activeElement;
    const dialog = tag("dialog",null,"history-dialog");
    dialog.setAttribute("aria-labelledby","history-person-title");
    const heading = tag("h2",person.name_ko);
    heading.id = "history-person-title";
    const close = button("닫기",() => dialog.close(),"quiet-button");
    close.autofocus = true;
    const title = tag("div",null,"history-dialog-title");
    title.append(heading,close);
    const sub = tag("p",`${nation(person.origin)} · ${person.roles.join(" · ")} · ${person.historicity} ${levels[person.historicity]}`);
    const house = houseById.get(person.house_id);
    dialog.append(title,sub,tag("p",person.bio),definition([
      ["원어 표기",person.name_original ?? "미확인"], ["이명",person.aliases.join(" · ") || "미등록"],
      ["출생",person.birth_range ? yearDisplay(...person.birth_range) : "미확인"], ["사망",person.death_range ? yearDisplay(...person.death_range) : "미확인"],
      ["기록·등장 시기",person.availability.map(span => yearDisplay(...span)).join(" · ") || "미확인"],
      ["가문",house?.name ?? "미등록"], ["특기",person.skills.join(" · ") || "미설계"],
    ]));
    if (person.affiliations.length) {
      const list = tag("ol",null,"history-transfers");
      for (const item of person.affiliations) list.append(tag("li",`${nation(item.faction_id)} · ${yearDisplay(item.from_year,item.to_year)} · ${affiliationKinds[item.basis]}`));
      dialog.append(tag("h3","기록된 소속과 변동"),list);
    }
    dialog.append(tag("h3","인물 능력치"),tag("p",person.stats_provenance.primary === "master_table" ? "첨부 기획서의 게임 설계값" :
      person.stats_provenance.primary === "repository_preview" ? "기존 시연의 게임 설계값 · 매력은 미확인" : "능력치 설계 대기"),
      radar(statsLabels,[{name:person.name_ko,values:Object.values(person.stats),color:factionById.get(person.origin).color}],"인물 능력치 레이더"),
      tag("h3","사료와 검증 상태"),citations(person.sources));
    for (const note of person.notes) dialog.append(tag("p",note));
    if (person.legacy_site) {
      const legacy = jump("645년 시연 배역 보기",`#person/${encodeURIComponent(person.legacy_id)}`);
      legacy.addEventListener("click",() => dialog.close());
      dialog.append(legacy);
    }
    dialog.addEventListener("close",() => {dialog.remove(); if (opener?.isConnected) opener.focus();});
    document.body.append(dialog);
    dialog.showModal();
  }

  function identifier(person) {
    return `${nation(person.origin)} · ${person.roles.join(" · ")}`;
  }

  function renderPeople() {
    header("역사 인물 도감","이름·이명·원어를 검색하고, 기록된 활동 연도나 출신·소속으로 좁혀 보세요.");
    const toolbar = tag("form",null,"history-filters");
    toolbar.addEventListener("submit",event => event.preventDefault());
    const query = tag("input");
    Object.assign(query,{type:"search",placeholder:"예: 연남생, 사이메이, 李世民"});
    const byRole = [...new Set(characters.flatMap(person => person.roles))].sort((a,b) => a.localeCompare(b,"ko"));
    const controls = {
      query:["이름 검색",query],
      faction:["세력",select([["","전체"],...factions.filter(f => characters.some(p => p.origin === f.id || p.affiliations.some(a => a.faction_id === f.id))).map(f => [f.id,f.name])])],
      affiliation:["세력 기준",select([["origin","출신"],["service","소속"]])],
      year:["기록 연도",yearInput("")],
      role:["역할",select([["","전체"],...byRole.map(role => [role,role])])],
      level:["검증 상태",select([["","전체"],...Object.entries(levels).map(([key,name]) => [key,`${key} ${name}`])])],
      sort:["정렬",select([["name","이름순"],["year","기록 연도순"],["status","검증 상태순"],["leadership","통솔 내림차순"]])],
    };
    const results = tag("div",null,"history-roster");
    const count = tag("p",null,"history-results");
    count.setAttribute("role","status");
    function update() {
      const year = Number(filters.year);
      const search = filters.query.trim().normalize().toLocaleLowerCase("ko");
      const matches = characters.filter(person => (!filters.level || person.historicity === filters.level) &&
        (!filters.role || person.roles.includes(filters.role)) &&
        (!year || person.availability.some(([a,b]) => inYears(year,a,b))) &&
        (!filters.faction || (filters.affiliation === "origin" ? person.origin === filters.faction :
          person.affiliations.some(item => item.faction_id === filters.faction && (!year || knownIn(year,item.from_year,item.to_year))))) &&
        [person.name_ko,person.name_original,...person.aliases].some(name => name?.normalize().toLocaleLowerCase("ko").includes(search)));
      const sort = {
        name:() => 0,
        year:(a,b) => (a.availability[0]?.[0] ?? 9999)-(b.availability[0]?.[0] ?? 9999),
        status:(a,b) => a.historicity.localeCompare(b.historicity),
        leadership:(a,b) => (b.stats.leadership ?? -1)-(a.stats.leadership ?? -1),
      }[filters.sort];
      matches.sort((a,b) => sort(a,b) || a.name_ko.localeCompare(b.name_ko,"ko"));
      count.textContent = `전체 ${characters.length}건 중 ${matches.length}건${year ? " · 기록된 활동 시기 기준" : ""}`;
      results.replaceChildren(...matches.map(person => {
        const entry = button(person.name_ko,() => showPerson(person),"history-person");
        entry.style.setProperty("--faction-color",factionById.get(person.origin).color);
        entry.append(tag("small",identifier(person)),tag("span",`${person.historicity} · ${levels[person.historicity]}`,"history-status"));
        return entry;
      }));
      if (!matches.length) results.append(tag("p","조건에 맞는 기록이 없습니다."));
    }
    for (const [name,[label,input]] of Object.entries(controls)) {
      input.value = filters[name];
      input.addEventListener("input",() => {
        if (input.validity.valid) filters[name] = input.value;
        update();
      });
      toolbar.append(field(label,input));
    }
    const clear = button("필터 초기화",() => {
      Object.assign(filters,{query:"",faction:"",role:"",year:"",level:"",sort:"name",affiliation:"origin"});
      for (const [name,[,input]] of Object.entries(controls)) input.value = filters[name];
      update();
    },"quiet-button");
    historyView.append(toolbar,clear,count,results,jump("645년 시연 인물과 배역", "#cast", "history-bottom"));
    update();
  }

  function network(graph, year, mode) {
    const nodes = graph.nodes.filter(node => inYears(year,node.from_year,node.to_year));
    const ids = new Set(nodes.map(node => node.id));
    const edges = graph.edges.filter(edge => ids.has(edge.left) && ids.has(edge.right) && inYears(year,edge.from_year,edge.to_year));
    const content = tag("div",null,"history-network");
    if (!nodes.length) {
      content.append(tag("p","이 연도에는 활성화된 정치 조직이 없습니다."));
      return content;
    }
    const plot = chart(580,320,"시대별 연결 구조 개념도");
    const coords = new Map();
    if (mode === "radial" || mode === "relations") {
      const orbit = nodes.slice(mode === "radial" ? 1 : 0);
      if (mode === "radial") coords.set(nodes[0].id,[290,160]);
      for (const [i,node] of orbit.entries()) {
        const angle = i*2*Math.PI/orbit.length;
        coords.set(node.id,[290+205*Math.sin(angle),160-115*Math.cos(angle)]);
      }
    } else {
      const depths = new Map([[nodes[0].id,0]]);
      for (const node of nodes.slice(1)) {
        const parents = edges.filter(edge => edge.right === node.id && depths.has(edge.left));
        depths.set(node.id, parents.length ? Math.max(...parents.map(edge => depths.get(edge.left)))+1 : 1);
      }
      const max = Math.max(...depths.values(),1);
      for (let depth=0;depth<=max;depth++) {
        const row = nodes.filter(node => depths.get(node.id) === depth);
        for (const [i,node] of row.entries()) coords.set(node.id,[(i+1)*580/(row.length+1),35+250*depth/max]);
      }
    }
    for (const edge of edges) {
      const [x1,y1] = coords.get(edge.left);
      const [x2,y2] = coords.get(edge.right);
      const kind = {전쟁:"war",동맹:"ally",지원:"support"}[edge.kind] ?? "design";
      plot.append(svg("line",{x1,y1,x2,y2,class:`network-link ${kind}`}));
    }
    for (const node of nodes) {
      const [x,y] = coords.get(node.id);
      plot.append(svg("rect",{x:x-65,y:y-14,width:130,height:28,rx:6,class:"network-node"}));
      plot.append(svg("text",{x,y:y+5,"text-anchor":"middle",class:"chart-label"},node.label));
    }
    const descriptions = tag("ul",null,"history-edge-list");
    const label = id => nodes.find(node => node.id === id).label;
    for (const edge of edges) descriptions.append(tag("li",`${label(edge.left)} ${edge.kind === "동맹" ? "↔" : "→"} ${label(edge.right)} · ${edge.label}`));
    if (!edges.length) descriptions.append(tag("li","표시된 연도에 등록된 연결 없음"));
    content.append(plot,descriptions);
    return content;
  }

  function houseCard(faction) {
    const result = card("가문과 친족 관계", "가문 소속과 확인 대상 친족 연결을 표시합니다.");
    const ids = faction.houses;
    const selector = select(ids.map(id => [id,houseById.get(id).name]),ids[0]);
    const drawing = tag("div");
    function update() {
      const house = houseById.get(selector.value);
      const list = tag("ul",null,"history-edge-list");
      for (const edge of house.links) {
        const left = personsById.get(edge.left),right = personsById.get(edge.right);
        const entry = tag("li");
        entry.append(button(left.name_ko,() => showPerson(left),"history-text-button"),` ↔ `,
          button(right.name_ko,() => showPerson(right),"history-text-button"),` · ${edge.label}`);
        list.append(entry);
      }
      const graph = {
        nodes:[{id:house.id,label:house.name},...Array.from(new Set(house.links.flatMap(link => [link.left,link.right])),id => ({id,label:personsById.get(id).name_ko}))].map(node => ({...node,from_year:null,to_year:null})),
        edges:house.links.map(link => ({...link,from_year:null,to_year:null})),
      };
      drawing.replaceChildren();
      if (house.links.length) {
        const diagram = network(graph,642,"radial");
        drawing.append(diagram.firstChild,list);
      } else {
        drawing.append(tag("p","등록된 친족 연결이 없습니다."));
      }
      const members = tag("div",null,"history-chips");
      for (const person of characters.filter(person => person.house_id === house.id)) members.append(button(person.name_ko,() => showPerson(person),"quiet-button"));
      drawing.append(members);
    }
    selector.addEventListener("input",update);
    result.append(field("가문",selector),drawing);
    update();
    return result;
  }

  function renderPolity() {
    header("국가 특성과 정치 구조","레이더와 정치 변수는 게임 설계값입니다. 도식의 행정·권력 연결은 시기별 게임 모델입니다.");
    const toolbar = tag("div",null,"history-filters");
    const primary = select(countries.map(f => [f.id,f.name]),"gog");
    const compare = select([["","선택 안 함"],...countries.filter(f=>f.radar).map(f=>[f.id,f.name])],"baek");
    const year = yearInput(642);
    const cards = tag("div",null,"history-grid");
    toolbar.append(field("국가",primary),field("비교 국가",compare),field("정치 구조 연도",year));
    historyView.append(toolbar,cards);
    function update() {
      const faction = factionById.get(primary.value);
      const comparison = factionById.get(compare.value);
      const series = [faction,...(comparison && faction !== comparison ? [comparison] : [])].filter(f=>f.radar).map(f=>({name:f.name,values:f.radar,color:f.color}));
      const comparisonCard = card("국가 특성 레이더",series.map(f=>f.name).join(" · "));
      if (series.length) comparisonCard.append(radar(world.radar_axes,series,"국가 특성 비교 레이더"));
      if (!faction.radar) comparisonCard.append(tag("p",`${faction.name}의 국가 비교 수치는 설계 대기 중입니다.`));
      const political = card(faction.name,"국가 고유 시스템");
      political.append(tag("p",faction.traits),tag("p",faction.tension),definition([
        ["고유 효과",faction.mechanics.join(" · ")],["AI 우선 판단",faction.ai_policy],
      ]),statTable(world.political_axes,[{name:"초기값",values:faction.political_seed}]));
      const structure = card(`${faction.name}의 정치 구조`);
      const date = year.valueAsNumber || 642;
      if (inYears(date,...faction.span)) structure.append(network(faction.government,date,"hierarchy"));
      else structure.append(tag("p",`${date}년에는 ${faction.name}이 이 시나리오의 국가로 활성화되지 않습니다.`));
      cards.replaceChildren(comparisonCard,political,structure,houseCard(faction));
    }
    for (const input of [primary,compare,year]) input.addEventListener("input",() => {if (input.validity.valid) update();});
    update();
  }

  function scenarioCard(item) {
    const result = card(item.title,`${yearDisplay(item.start_year,item.end_year)}년 · ${eraNames[item.campaign]} · ${item.faction_ids.map(nation).join(" / ")}`);
    result.append(tag("h4","역사 시작 조건"),tag("p",item.history),tag("h4","대체 역사 승리 조건"),tag("p",item.victory));
    const docs = tag("details");
    docs.append(tag("summary","사료 보기"),citations(item.sources));
    result.append(docs);
    if (item.playable === "legacy_645") result.append(jump("안시성 645년 플레이", "#play/gog"));
    if (item.start_month) result.append(tag("small","기획 시작점 · 642년 1월"));
    return result;
  }

  function renderTimeline() {
    header("시나리오 연표","기본 시대 551–676년과 핵심 캠페인 612–676년을 중심으로, 전기·발해 확장 시나리오를 살펴봅니다.");
    const year = yearInput("");
    const faction = select([["","전체"],...factions.filter(f=>scenarios.some(s=>s.faction_ids.includes(f.id))).map(f=>[f.id,f.name])]);
    const era = select([["","전체"],...Object.entries(eraNames)]);
    const toolbar = tag("div",null,"history-filters");
    toolbar.append(field("연도",year),field("참여 세력",faction),field("시대",era));
    const list = tag("ol",null,"history-timeline");
    const status = tag("p",null,"history-results");
    status.setAttribute("role","status");
    historyView.append(toolbar,status,list);
    function update() {
      if (!year.validity.valid) return;
      const result = scenarios.filter(item => (!year.value || inYears(year.valueAsNumber,item.start_year,item.end_year)) &&
        (!faction.value || item.faction_ids.includes(faction.value) && (!year.value || inYears(year.valueAsNumber,...factionById.get(faction.value).span))) &&
        (!era.value || item.campaign === era.value));
      status.textContent = result.length ? `${result.length}개 시나리오` : "조건에 맞는 시나리오가 없습니다.";
      list.replaceChildren(...result.map(item => {
        const row = tag("li");
        row.append(tag("time",yearDisplay(item.start_year,item.end_year)),scenarioCard(item));
        return row;
      }));
    }
    for (const input of [year,faction,era]) input.addEventListener("input",update);
    update();
  }

  function renderRelations() {
    header("동아시아의 외교와 전선","축척 없는 개념도입니다. 전쟁과 지원은 각각 표시하며, 당의 전선 도식은 시기별 전역을 종합합니다.");
    const year = yearInput(660);
    const boards = tag("div",null,"history-grid");
    historyView.append(field("외교 관계 연도",year),boards);
    function update() {
      if (!year.validity.valid) return;
      const date = year.valueAsNumber || 660;
      const war = card(`${date}년 외교·전쟁 관계`,"동맹 · 전쟁 · 지원의 개시·종료 범위를 적용합니다.");
      war.append(network(relations.war_660,date,"relations"));
      const tang = card("당나라 다중 전선","장안을 중심으로 본 전역 · 종합 도식");
      tang.append(network(relations.tang_fronts,date,"radial"));
      const wa = card("왜나라 호족 네트워크","645년 이후 소가 본가와 방계의 정치 역할 변화를 반영합니다.");
      wa.append(network(relations.wa_clans,date,"radial"));
      boards.replaceChildren(war,tang,wa);
    }
    year.addEventListener("input",update);
    update();
  }

  function renderFrontiers() {
    header("독립 국가와 변경 세력","시기별 국가·연맹·부흥 세력의 범위를 보여 줍니다. 지도는 개념도이며 좌표는 게임 설명용입니다.");
    const year = yearInput("");
    const kind = select([["","전체"],...Object.entries(kinds)]);
    const toolbar = tag("div",null,"history-filters");
    toolbar.append(field("연도",year),field("유형",kind));
    const map = tag("div",null,"history-frontier-map");
    const list = tag("div",null,"history-grid");
    historyView.append(toolbar,map,list);
    function update() {
      if (!year.validity.valid) return;
      const visible = factions.filter(faction => faction.map_position && (!kind.value || kind.value === faction.kind) &&
        (!year.value || inYears(year.valueAsNumber,...faction.span)));
      const plot = chart(500,350,"변경 세력의 대략적인 상대 위치");
      plot.append(svg("path",{d:"M28 64 L160 40 310 41 432 79 480 131 408 179 380 217 326 224 302 281 220 255 128 222 52 167 Z",class:"frontier-land"}),
        svg("path",{d:"M395 231 L413 224 435 242 464 252 469 265 432 265 407 251 Z",class:"frontier-land"}));
      for (const [i,faction] of visible.entries()) {
        const [x,y] = faction.map_position;
        const cx = x*4.8, cy = y*3.3;
        plot.append(svg("circle",{cx,cy,r:10,class:`frontier-pin ${faction.kind}`}));
        plot.append(svg("text",{x:cx,y:cy+4,"text-anchor":"middle",class:"frontier-number"},i+1));
      }
      map.replaceChildren(plot);
      list.replaceChildren(...visible.map((f,i) => {
        const result = card(`${i+1}. ${f.name}`,`${kinds[f.kind]} · ${yearDisplay(...f.span)}`);
        result.append(tag("p",f.traits),citations(f.sources));
        return result;
      }));
      if (!visible.length) list.append(tag("p","조건에 맞는 세력이 없습니다."));
    }
    for (const control of [year,kind]) control.addEventListener("input",update);
    update();
  }

  function renderGrowth() {
    header("인물 성장과 노화","가상 문무겸전형의 게임 수치입니다. 연령 사이의 값은 선형 보간합니다.");
    const age = tag("input");
    Object.assign(age,{type:"range",min:12,max:75,step:1,value:35});
    const box = card(growth.label);
    const labels = Object.keys(growth.series);
    const colors = ["#6cc3ac","#ec8e84","#e5d577","#9fbdf3"];
    const x = age => 50+(age-12)*463/63;
    const y = score => 245-score*2.05;
    const plot = chart(540,284,"12세부터 75세까지의 통솔·무력·지력·정치 설계 수치");
    for (const step of [0,25,50,75,100]) {
      plot.append(svg("line",{x1:48,y1:y(step),x2:513,y2:y(step),class:"chart-grid"}));
      plot.append(svg("text",{x:40,y:y(step)+4,"text-anchor":"end",class:"chart-label"},step));
    }
    growth.ages.forEach(value => plot.append(svg("text",{x:x(value),y:266,"text-anchor":"middle",class:"chart-label"},value)));
    labels.forEach((label,index) => {
      plot.append(svg("polyline",{points:growth.series[label].map((score,i) => `${x(growth.ages[i])},${y(score)}`).join(" "),
        fill:"none",stroke:colors[index],"stroke-width":3,"stroke-dasharray":["none","8 3","3 2","11 4 2 4"][index]}));
    });
    const cursor = svg("line",{y1:40,y2:245,class:"growth-cursor"});
    plot.append(cursor);
    const legend = tag("ul",null,"history-edge-list growth-legend");
    for (const [i,label] of labels.entries()) {
      const entry = tag("li",`${label} · ${["실선","파선","점선","혼합선"][i]}`);
      entry.style.color = colors[i];
      legend.append(entry);
    }
    const indicator = tag("p");
    indicator.setAttribute("role","status");
    function update() {
      const current = Number(age.value);
      const end = Math.max(1,growth.ages.findIndex(value => value >= current));
      const start = end-1;
      const fraction = (current-growth.ages[start])/(growth.ages[end]-growth.ages[start]);
      const text = labels.map(label => `${label} ${Math.round(growth.series[label][start]+fraction*(growth.series[label][end]-growth.series[label][start]))}`);
      cursor.setAttribute("x1",x(current));
      cursor.setAttribute("x2",x(current));
      indicator.textContent = `${current}세 · ${text.join(" · ")} · 매력 미설계`;
    }
    age.addEventListener("input",update);
    box.append(plot,legend,field("연령",age),indicator,statTable(growth.ages.map(age => `${age}세`),labels.map(name => ({name,values:growth.series[name]}))));
    const generations = card("세대교체와 귀순","게임 설계");
    generations.append(definition([["성장","연령 기준값과 훈련·전공 경험을 분리합니다."],["세대교체","후계자의 정통성과 개인 충성도를 다시 평가합니다."],
      ["가문","가문 영향력과 개인 충성도를 따로 기록합니다."],["귀순","인물 ID를 유지하고 소속 이력을 새로 기록합니다."]]),
      button("연남생의 소속 변화 보기",() => showPerson(characters.find(person => person.name_ko === "연남생")),"quiet-button"));
    historyView.append(box,generations);
    update();
  }

  function renderBalhae() {
    header("발해 확장팩","698년 건국부터 926년까지. 변경 통합, 해상 외교, 수도 이동과 행정 정비를 다룹니다.");
    const faction = factionById.get("balhae");
    const outline = card("왕과 변경","698년의 초기 정치 구조를 표현한 게임 개념도");
    outline.append(network(faction.government,698,"hierarchy"));
    const story = tag("div",null,"history-grid");
    story.append(...scenarios.filter(s=>s.campaign==="balhae").map(scenarioCard));
    const people = tag("div",null,"history-chips");
    for (const person of characters.filter(person=>person.origin==="balhae")) people.append(button(person.name_ko,() => showPerson(person),"quiet-button"));
    historyView.append(outline,tag("h3","발해 인물"),people,tag("h3","발해 시나리오"),story);
  }

  function renderEvidence() {
    header("역사적 출처와 검증 상태","등급은 열전의 확인 범위를 가리킵니다. 상세에서 대조한 주장, 기사 위치와 판본을 확인할 수 있습니다.");
    const grid = tag("div",null,"history-grid");
    const descriptions = {A:"직접 열람한 원문이나 기사로 연결할 수 있습니다.",B:"사료별 기록이 엇갈리거나 해석에 쟁점이 있습니다.",
      C:"후대 전승명 또는 설화에 따른 항목입니다.",U:"기존 도감이나 첨부의 출처 후보를 다시 대조해야 합니다."};
    for (const [key,label] of Object.entries(levels)) {
      const total = characters.filter(person=>person.historicity===key).length;
      const box = card(`${key} · ${label}`,`${total}건`);
      box.append(tag("p",descriptions[key]),jump("해당 항목 목록", "#people", "history-text-button"));
      box.lastChild.addEventListener("click",() => {Object.assign(filters,{level:key,query:"",faction:"",role:"",year:""});});
      grid.append(box);
    }
    const review = card("검증 자료");
    review.append(jump("출처와 검증 보고서", "https://github.com/channyworks/haedong/blob/main/docs/history/SOURCES.md"),
      jump("원본 복구와 누락 기록", "https://github.com/channyworks/haedong/blob/main/docs/history/ROSTER_AUDIT.md"));
    historyView.append(grid,review);
  }

  function renderStrategy() {
    header("645년 전략 AI 관전","다섯 세력이 한 차례씩 정치 결정을 내리고 기존 군령 시연의 판정을 적용합니다. 전략 단계의 10일은 시연용 시간입니다.");
    const strategy = window.haedongStrategy;
    const simulator = window.haedongSimulation;
    const seed = tag("input");
    Object.assign(seed,{type:"number",min:0,max:4294967295,step:1,value:645});
    const player = select(countries.filter(f=>f.kind==="core").map(f=>[f.id,f.name]),"gog");
    let run = strategy.start(645);
    let auto = false;
    let timer;
    const toolbar = tag("div",null,"history-filters");
    const reset = button("새 관전 시작",() => {if (seed.validity.valid) run = strategy.start(Number(seed.value)); update();},"quiet-button");
    toolbar.append(field("난수 시드",seed),field("수동 군령 세력",player),reset);
    const controls = tag("div",null,"history-chips");
    const orders = tag("div",null,"history-chips");
    const status = tag("p",null,"history-results");
    status.setAttribute("role","status");
    const board = tag("div",null,"history-grid");
    const frontier = card("변경 세력 판단","각 세력은 직전 턴의 보급·자율성과 인접 국가의 지방 통제를 기준으로 행동합니다.");
    const frontierRows = tag("div");
    frontier.append(frontierRows);
    const log = tag("ol",null,"history-turns");
    const step = button("다음 턴",() => {run = strategy.advance(run); update();},"quiet-button");
    const skip = button("결과까지 진행",() => {run = strategy.finish(run); update();},"quiet-button");
    const watch = button("자동 관전",() => {
      auto = !auto;
      update();
      window.clearTimeout(timer);
      if (!auto) return;
      const timed = () => {
        if (!auto || !board.isConnected) return;
        run = strategy.advance(run);
        if (run.turn === 4) auto = false;
        update();
        if (auto) timer = window.setTimeout(timed,wide.matches ? 120 : 650);
      };
      timer = window.setTimeout(timed,wide.matches ? 120 : 650);
    },"quiet-button");
    controls.append(step,watch,skip);
    player.addEventListener("input",() => update(true));
    historyView.append(toolbar,controls,status,orders,board,frontier,tag("h3","턴별 결정"),log);
    function update(ordersOnly = false) {
      const locked = auto || run.turn === 4;
      const camp = simulator.campaigns[player.value];
      orders.replaceChildren(...(locked ? [] : camp.orders.map(([id,label]) => {
        const selected = strategy.proposal(run,player.value).order === id;
        return button(`${label}${selected ? " · AI 권장" : ""}`,() => {
          run = strategy.advance(run,{faction:player.value,order:id});
          update();
        },"quiet-button");
      })));
      if (ordersOnly) return;
      step.disabled = skip.disabled = locked;
      reset.disabled = auto;
      watch.disabled = run.turn === 4;
      watch.textContent = auto ? "관전 일시 정지" : "자동 관전";
      status.textContent = `${run.turn} / 4턴 · ${run.turn*10}일 경과 · 시드 ${run.seed}`;
      board.replaceChildren(...Object.entries(run.states).map(([id,state]) => {
        const result = card(nation(id),`정치 재정 ${state.treasury} · ${state.choices.length}턴`);
        const battle = simulator.replay(id,state.choices);
        result.append(statTable(battle.campaign.meters,[{name:"군령 지표",values:battle.values}]),
          statTable(world.political_axes,[{name:"정치 지표",values:state.politics}]));
        if (battle.finished) result.append(tag("p",battle.success ? "시연 목표 달성" : "시연 목표 일부 미달"));
        return result;
      }));
      const border = Object.entries(run.frontiers);
      frontierRows.replaceChildren(statTable(border.map(([id]) => nation(id)),[
        {name:"선택",values:border.map(([,side]) => side.policy)},
        {name:"보급",values:border.map(([,side]) => side.stock)},
        {name:"자율성",values:border.map(([,side]) => side.autonomy)},
      ]));
      log.replaceChildren(...run.log.map((events,index) => {
        const row = tag("li",`${index+1}턴`);
        const decisions = tag("ul");
        for (const event of events) decisions.append(tag("li",`${nation(event.id)} · ${strategy.policies[event.policy].label} · ${event.order.label}${event.manual ? " (수동)" : ""} · 상대 방면 압력 ${event.pressure}`));
        row.append(decisions);
        return row;
      }));
    }
    update();
  }

  const views = {people:renderPeople,polity:renderPolity,timeline:renderTimeline,relations:renderRelations,
    frontiers:renderFrontiers,growth:renderGrowth,balhae:renderBalhae,evidence:renderEvidence,strategy:renderStrategy};
  return {routes:Object.keys(views),render(route) {
    const dialog = document.querySelector(".history-dialog[open]");
    if (dialog) dialog.close();
    historyView.replaceChildren();
    views[route]();
  }};
})();
