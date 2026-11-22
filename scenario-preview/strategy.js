"use strict";

window.haedongStrategy = (() => {
  const {campaigns, replay} = window.haedongSimulation;
  const {factions,frontier_rules} = window.haedongHistoryData.factions;
  const powers = factions.filter(faction => faction.kind === "core");
  const rival = {gog:"tang", tang:"gog", baek:"sil", sil:"baek"};
  const policies = {
    rest:{label:"비용 절감", cost:0, effects:[[6,3]]},
    appointment:{label:"관직 임명", cost:2, effects:[[2,6],[5,4]]},
    marriage:{label:"가문 혼인", cost:2, effects:[[1,5],[2,4],[3,4]]},
    reform:{label:"행정 개혁", cost:4, effects:[[0,6],[2,-5],[5,8]]},
    alliance:{label:"동맹 교섭", cost:3, effects:[[1,3],[4,5]]},
    mobilization:{label:"전선 증원", cost:3, effects:[[4,6],[6,-4]]},
    purge:{label:"권신 교체", cost:4, effects:[[0,8],[2,-12],[3,-8]]},
  };
  const preference = {gog:"appointment", baek:"alliance", sil:"appointment", tang:"reform", wa:"marriage"};
  const clamp = value => Math.max(0, Math.min(100, value));

  function noise(seed, token) {
    let hash = seed | 0;
    for (const char of token) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    return (hash >>> 0) / 4294967296;
  }

  function start(seed = 645) {
    return {
      seed: seed >>> 0,
      turn: 0,
      states: Object.fromEntries(powers.map(({id, political_seed}) => [id, {politics:[...political_seed], choices:[], treasury:6}])),
      frontiers: Object.fromEntries(frontier_rules.map(({id,stock,autonomy}) => [id,{stock,autonomy,policy:"대기"}])),
      log: [],
    };
  }

  function proposal(run, id) {
    const side = run.states[id];
    const opponent = run.states[rival[id]];
    const resistance = frontier_rules.filter(rule => rule.neighbor === id && run.frontiers[rule.id].policy === "경계 강화").length;
    const pressure = (opponent ? replay(rival[id], opponent.choices).values[1] : 4) + resistance;
    const [authority, legitimacy, nobles, houses, control, efficiency, finance] = side.politics;
    const scores = {
      rest: (100-finance)*0.48,
      appointment: (100-nobles)*0.48 + (100-efficiency)*0.2,
      marriage: (100-legitimacy)*0.55 + (100-nobles)*0.25,
      reform: (100-efficiency)*0.7 + authority*0.13 - (100-nobles)*0.32,
      alliance: (100-legitimacy)*0.45 + pressure*2,
      mobilization: (100-control)*0.55 + pressure*2 - (100-finance)*0.28,
      purge: houses*0.6 - legitimacy*0.35 - (100-nobles)*0.3,
    };
    const policy = Object.keys(policies).filter(key => side.treasury >= policies[key].cost)
      .map(key => [key, scores[key] - policies[key].cost*3 + (key === preference[id] ? 8 : 0) + noise(run.seed, `${run.turn}/${id}/${key}`)*4])
      .sort((left,right) => right[1] - left[1])[0][0];
    const camp = campaigns[id];
    const current = replay(id,side.choices).values;
    const scoreOrder = ([key]) => {
      const next = replay(id,[...side.choices,key]).values;
      const utility = next.reduce((sum,value,i) => {
        const reserve = Math.min(next[i], camp.target[i] + 2) - Math.min(current[i], camp.target[i] + 2);
        return sum + reserve * (1 + (i === 1 ? pressure/16 : 0)) + (i === 0 && value < 3 ? -4 : 0);
      },0);
      const support = policy === "mobilization" ? (next[1]-current[1])*0.35 : (next[0]-current[0])*0.1;
      return utility + support + noise(run.seed, `${run.turn}/${id}/order/${key}`)*0.5;
    };
    const order = camp.orders.map(row => [row[0],scoreOrder(row)]).sort((a,b) => b[1]-a[1])[0][0];
    return {policy,order,pressure};
  }

  function advance(run, override) {
    if (run.turn >= 4) return run;
    const outcomes = powers.map(({id}) => {
      const {policy,order,pressure} = proposal(run,id);
      const side = run.states[id];
      const selected = override?.faction === id && campaigns[id].orders.some(([key]) => key === override.order) ? override.order : order;
      const choices = [...side.choices, selected];
      const {cost,effects} = policies[policy];
      const politics = [...side.politics];
      for (const [key,delta] of effects) politics[key] = clamp(politics[key] + delta);
      const treasury = Math.min(12, side.treasury - cost + (politics[6] >= 65 ? 3 : 2));
      const encounter = replay(id,choices);
      return {id,state:{politics,choices,treasury},event:{id,policy,pressure,treasury,manual:selected !== order,
        order:encounter.history.at(-1),success:encounter.finished ? encounter.success : null}};
    });
    const frontiers = Object.fromEntries(frontier_rules.map(({id,neighbor}) => {
      const {stock,autonomy} = run.frontiers[id];
      const contact = run.states[neighbor].politics[4] + noise(run.seed,`${run.turn}/${id}/contact`)*8;
      const policy = stock <= 43 ? "교역 확대" : contact > autonomy+8 ? "경계 강화" : "사절 교섭";
      const deltas = {"교역 확대":[8,-1],"경계 강화":[-7,5],"사절 교섭":[2,1]}[policy];
      return [id,{policy,stock:clamp(stock+deltas[0]),autonomy:clamp(autonomy+deltas[1])}];
    }));
    return {seed:run.seed,turn:run.turn+1,states:Object.fromEntries(outcomes.map(({id,state}) => [id,state])),frontiers,
      log:[...run.log,outcomes.map(({event}) => event)]};
  }

  function finish(run) {
    while (run.turn < 4) run = advance(run);
    return run;
  }

  return {start,proposal,advance,finish,policies};
})();
