"use strict";

window.haedongSimulation = (() => {
  const campaigns = {
    gog: {
      faction:"고구려", title:"안시성의 불멸", year:"645년 · 요동", home:"ansi",
      historical:"당 태종의 원정군이 안시성을 포위했다. 성주와 주민의 저항, 토산 공방, 당군의 철수가 사료에 남았다.",
      source:"ansi", opening:"성을 맡은 이는 안시성의 창고를 먼저 살폈다. 다음 전령이 들어오기 전에 무엇을 지킬지 정해야 했다.",
      meters:["군량","성벽·수비","구원 준비"], start:[7,5,2], target:[3,8,7],
      phases:[
        ["첫 군령","성벽과 오골성 지원을 살피고 첫 군령을 선택합니다."],
        ["토산이 높아지는 밤","같은 명령을 거듭하면 효과가 줄어듭니다. 수비와 구원 준비를 함께 살피세요."],
        ["구원군과의 연락","참조 시나리오의 출진은 기존 기록입니다. 이번 판의 구원 준비는 직접 쌓습니다."],
        ["포위의 끝","군량 3, 수비 8, 구원 준비 7에 도달하면 시연의 방어 목표를 달성합니다."]
      ],
      orders:[
        ["repair","성벽 보수",[-1,3,0],"무너진 구간부터 돌을 다시 올렸다."],
        ["supply","오골성에 군량 요청",[3,0,1],"창고 담당이 곡식의 수를 적었고, 그 장부가 다음 군령의 근거가 됐다."],
        ["relief","구원군 연락로 확보",[-1,1,3],"바깥으로 보낸 전령은 성 안과 밖이 같은 신호를 기다리게 했다."],
        ["watch","토산과 접근로 감시",[0,1,2],"감시 보고를 받아든 지휘부는 어느 쪽에 예비대를 둘지 다시 정했다."]
      ],
      success:"성벽을 지킬 여력과 바깥의 지원이 마련됐다. 안시성은 포위가 풀릴 때까지 버텨냈다.",
      failure:"성은 버텼으나 군량과 수비, 구원 준비가 모두 갖춰지지 않았다. 포위 뒤의 결말은 미정으로 남았다."
    },
    baek: {
      faction:"백제", title:"사비에 닿은 접경 보고", year:"645년 · 사비와 신라 접경", home:"sabi",
      historical:"『삼국사기』 백제본기에 따르면, 당의 원정기에 백제는 신라의 일곱 성을 공격했고 신라는 김유신을 보냈다.",
      source:"baekje", opening:"사비에 접경 보고가 쌓였다. 왕도에 남길 병력과 접경에 보낼 식량의 수가 서로 맞물려 있었다.",
      meters:["군량","접경 유지","보고·교섭"], start:[6,4,2], target:[3,7,7],
      phases:[["사비 회의","왕도에서 접경 상황에 대응할 첫 결정을 내립니다."],["접경의 소식","대야성 방향의 동향과 후방의 군량을 살핍니다."],["지원과 교섭","접경 방어와 보고·교섭을 함께 다룹니다."],["사비로 돌아온 보고","군량 3, 접경 유지 7, 보고·교섭 7이 시연 목표입니다."]],
      orders:[
        ["store","사비·웅진 군량 정리",[3,0,1],"웅진과 사비의 창고에서 다시 쓸 곡식의 수를 맞췄다."],
        ["watch","대야성 방면 방어 보강",[-1,3,0],"대야성 쪽 보고를 받고 접경의 근무를 조정했다."],
        ["report","접경 전령과 사절 정비",[-1,1,3],"사비에서 떠난 사절은 경계를 살필 사람과 보고할 날짜부터 정했다."]
      ],
      success:"사비는 접경을 유지하면서 왕도에서 다음 대응을 고를 여유를 확보했다.",
      failure:"군량과 접경 보고가 엇갈렸다. 조정은 방어를 먼저 수습하기로 했다."
    },
    sil: {
      faction:"신라", title:"서라벌의 두 전령", year:"645년 · 서라벌과 매리포성", home:"seorabeol",
      historical:"『삼국사기』 김유신 열전에는 645년 백제군의 매리포성 공격과 신라의 대응이 나온다.",
      source:"silla", opening:"서라벌에 이른 두 전령의 보고가 달랐다. 조정은 어느 보고부터 확인할지 결정해야 했다.",
      meters:["군량","경계 방어","조정·연락"], start:[6,4,3], target:[3,8,7],
      phases:[["왕경 보고","매리포성 사건을 배경으로 첫 군령을 선택합니다."],["접경 경계","왕경과 접경에 필요한 자원을 살핍니다."],["군정과 연락","경계 대비와 조정 연락을 함께 마련합니다."],["왕경으로 돌아온 전령","군량 3, 방어 8, 조정·연락 7이 시연 목표입니다."]],
      orders:[
        ["store","왕경 군량 비축",[3,0,1],"서라벌 창고의 빈 칸을 채우고 접경으로 보낼 몫을 남겼다."],
        ["guard","경계 수비 증원",[-1,3,0],"지원 병력이 왕경을 떠난 뒤 접경의 근무표가 새로 짜였다."],
        ["envoy","조정 전령과 외교 보고 정리",[-1,1,3],"서라벌에서는 늦게 온 보고까지 펼쳐 정세를 다시 읽었다."]
      ],
      success:"왕경과 접경의 연락이 이어졌고, 신라는 다음 보고를 기다릴 병력과 곡식을 확보했다.",
      failure:"접경에 사람이 모였지만 지휘에 필요한 소식과 물자가 서로 다른 때에 닿았다."
    },
    wa: {
      faction:"왜", title:"아스카에서 난바로", year:"645년 · 아스카와 난바", home:"yamato",
      historical:"『일본서기』는 645년 고토쿠의 즉위와 조정 인선, 난바로 옮긴 일을 전한다.",
      source:"japan", opening:"아스카의 조정 탁상에 새 관직 명부가 놓였다. 궁이 옮겨도 일을 맡을 사람과 받을 보고는 남아야 했다.",
      meters:["물자","조정 정비","대외 교섭"], start:[6,5,2], target:[3,8,7],
      phases:[["새 조정","즉위와 조정 개편을 배경으로 첫 결정을 내립니다."],["천도 준비","난바에 필요한 물자와 결재 체계를 살핍니다."],["사절에 보낼 답","외부 교섭과 중앙의 인선을 조율합니다."],["난바의 보고","물자 3, 조정 정비 8, 교섭 7이 시연 목표입니다."]],
      orders:[
        ["store","난바의 이전 물자 마련",[3,0,1],"난바에 먼저 보낼 물건과 아스카에 남겨 둘 물건을 따로 적었다."],
        ["court","조정 인선과 기록 정리",[-1,3,0],"새 관직의 명부가 돌고 누가 어느 보고를 맡을지가 정해졌다."],
        ["envoy","해외 사절의 보고 검토",[-1,1,3],"사절을 맞을 사람들은 서로 다른 답을 하나의 문서에 모았다."]
      ],
      success:"조정 인선과 대외 연락이 이어졌고, 이전을 맡을 관리는 난바에서 받을 물자를 세었다.",
      failure:"이전 준비는 계속됐으나 여러 조정 보고가 같은 시각에 도착해 결정을 미뤘다."
    },
    tang: {
      faction:"당", title:"요동 원정군의 장부", year:"645년 · 요동성", home:"liaodong",
      historical:"『구당서』는 육로와 해로의 지휘부 편성, 태종의 출발과 645년 원정을 기록한다.",
      source:"tang", opening:"요동성에 새 군량 장부가 올라왔다. 길을 지킬 병력과 공성에 남길 인력은 한정돼 있었다.",
      meters:["군량","원정 유지","보고·철수 준비"], start:[7,4,2], target:[3,8,7],
      phases:[["원정군 회의","요동성에서 공성군과 후방 보급을 검토합니다."],["전방 보급","출정에 쓸 물자와 원정군 유지력을 맞춥니다."],["전령이 도착하다","공성 진행과 철수 대비에 관한 보고를 처리합니다."],["원정의 판단","군량 3, 원정 유지 8, 보고·철수 준비 7이 시연 목표입니다."]],
      orders:[
        ["supply","요동성 보급 장부 정리",[3,0,1],"전방 창고로 들어온 물량과 이미 떠난 수레를 따로 셌다."],
        ["siege","공성 인력과 장비 배치",[-1,3,0],"공성에 남을 인력이 정해지고 후방으로 돌릴 명단도 함께 적혔다."],
        ["report","전령망과 철수 경로 점검",[-1,1,3],"요동성에서 떠날 수레가 어디로 모일지 전령들에게 알렸다."]
      ],
      success:"원정군은 군량과 연락을 갖추어 공성 지속 또는 철수를 판단할 여유를 확보했다.",
      failure:"원정 계획보다 군량과 연락이 늦어졌다. 지휘부는 정비를 우선하기로 했다."
    }
  };

  function replay(id, choices = []) {
    if (!Object.hasOwn(campaigns, id)) return null;
    const campaign = campaigns[id];
    let values = campaign.start;
    const history = [];
    for (const key of choices.slice(0, campaign.phases.length)) {
      const order = campaign.orders.find(([orderId]) => orderId === key);
      if (!order) break;
      const [orderId, label, effect, prose] = order;
      const repeated = history.at(-1)?.id === orderId;
      const next = values.map((value, index) => Math.max(0, value + effect[index] -
        (repeated && effect[index] > 1 ? 1 : 0)));
      const passage = repeated
        ? "지휘부는 전날의 명령을 다시 내렸다. 보고는 전보다 늦게 모였고, 기대한 만큼의 성과는 오지 않았다."
        : prose;
      history.push({id:orderId, label, before:values, after:next, prose:passage, repeated});
      values = next;
    }
    const finished = history.length === campaign.phases.length;
    const success = finished && values.every((value, index) => value >= campaign.target[index]);
    return {campaign, values, history, finished, success};
  }

  function draft(title, run) {
    const {campaign, history, finished, success} = run;
    const [source, url] = window.haedong.sources[campaign.source];
    const chapters = history.map((event, index) => {
      const evidence = campaign.meters.map((meter, i) => meter + " " + event.before[i] + " → " + event.after[i]).join(", ");
      return {title:campaign.phases[index][0], prose:event.prose, evidence};
    });
    const ending = finished ? (success ? campaign.success : campaign.failure) : "아직 기록이 이어지고 있다.";
    const lines = ["# " + title, "", "## 역사적 배경", "", campaign.historical, "", "[" + source + "](" + url + ")",
      "", "## 플레이로 쓴 소설 초안", "", campaign.opening, "", ...chapters.flatMap(chapter => [chapter.prose, ""]),
      ending, "", "## 플레이 이력", "",
      ...history.map((event, index) => "- " + (index + 1) + "턴 · " + event.label + " · " + chapters[index].evidence),
      "", "지표와 전개의 결말은 플레이 기록에서 나온 창작입니다.", ""];
    return {lines, chapters, ending};
  }

  return {campaigns, replay, draft};
})();
