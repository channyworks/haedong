window.haedong = {
  factions: {고구려:"#6cc3ac", 백제:"#eeb176", 신라:"#e5d577", 왜:"#cca9ed", 당:"#ec8e84"},
  sources: {
    ansi: ["삼국사기 · 안시성 전투", "https://db.history.go.kr/common/compareViewer.do?levelId=sg_021r_0020_0220&type=ancient"],
    field: ["삼국사기 · 주필산 전투", "https://db.history.go.kr/ancient/level.do?levelId=sg_021r_0020_0216"],
    surrender: ["삼국사기 · 고연수와 고혜진", "https://db.history.go.kr/id/sg_021r_0020_0218"],
    baekje: ["삼국사기 · 의자왕 5년", "https://db.history.go.kr/ancient/level.do?levelId=sg_028r_0020_0120"],
    silla: ["삼국사기 · 김유신 열전", "https://db.history.go.kr/id/sg_041r_0020_0240"],
    japan: ["일본서기 · 고토쿠기", "https://www.seisaku.bz/nihonshoki/shoki_25.html"],
    project: ["해동연의 · 인물 설정집", "https://github.com/channyworks/haedong/blob/main/docs/HAEDONG_v1.0/03_Characters/CHARACTER_BIBLE.md"]
  },
  // x/y are percentages in a schematic. Connections are game-design routes.
  sites: [
    ["ansi","안시성","고구려",35,36,"포위 중","mancun",["ogol","siege"],"안시성 방어의 중심. 성벽 보수와 비축을 검토한다."],
    ["ogol","오골성","고구려",45,42,"보급 지원",null,["ansi","pyongyang"],"안시성으로 보급을 보낼 거점."],
    ["pyongyang","평양","고구려",54,48,"조정","bojang",["ogol"],"조정 보고와 구원 요청을 처리한다."],
    ["geonan","건안성","고구려",32,49,"요동 방어",null,["ansi"],"요동 방어선의 거점."],
    ["sabi","사비","백제",51,68,"조정","uija",["front"],"백제의 조정과 접경 전황을 살핀다."],
    ["front","접경 전선","백제",57,77,"개념 거점",null,["maeri","sabi"],"백제와 신라의 접경 사건을 요약한다."],
    ["seorabeol","서라벌","신라",66,67,"조정",null,["maeri"],"신라 조정과 국방 보고를 확인한다."],
    ["maeri","매리포성","신라",66,84,"접경 방어","yusin",["front","seorabeol"],"645년 전투 기록이 있는 거점. 위치 표시는 도식이다."],
    ["yamato","야마토 조정","왜",88,72,"조정","kotoku",["sea"],"645년 조정 개편의 인물을 살핀다."],
    ["sea","해상 교섭","왜",80,86,"개념 거점",null,["yamato"],"대외 사절과 해상 교섭을 요약한다."],
    ["changan","장안","당",12,64,"조정",null,["liaodong"],"원정 보고가 이어지는 당 조정."],
    ["liaodong","요동성","당",24,23,"원정군 점령","shiji",["baekam","siege"],"공성군으로 이어지는 전방 보급 거점."],
    ["baekam","백암성","당",36,16,"원정군 점령",null,["liaodong"],"안시성 공방에 앞서 당 원정군에 넘어간 성."],
    ["siege","당 외곽 진지","당",20,37,"공성 준비","shimin",["liaodong","ansi"],"공성 진행과 병력 집결을 살핀다."]
  ],
  // Ability arrays are prototype values, never historical measurements.
  people: [
    ["mancun","양만춘","고구려","성주","전승 이름","ansi","ansi","안시성 수비 지휘관의 이름은 기본 사료에 기록되지 않았다. 작품은 후대 전승에 따라 양만춘으로 부른다.",[89,78,76,65,61],"楊萬春 梁萬春"],
    ["mujin","고무진","고구려","수비대장","창작","ansi","project","성벽 수비를 맡고 전후에는 주민의 복구 요구를 조정한다.",[76,70,61,60,42]],
    ["yeonsu","고연수","고구려","중장보병대장","실존 · 가상 배역","ansi","surrender","주필산 전투 뒤 당에 항복했다는 기록이 있다. 작품에서는 분기 B의 성내 지휘관으로 배치한다.",[81,74,62,53,50]],
    ["hyejin","고혜진","고구려","구원군 지휘관","실존",null,"surrender","고연수와 함께 구원군을 이끌었으며 주필산 전투 뒤 항복했다."],
    ["bojang","보장왕","고구려","군주","실존","pyongyang","ansi","645년 당의 침공을 맞은 고구려의 왕이다.",null,"고장"],
    ["gaesomun","연개소문","고구려","조정 실권자","실존","pyongyang","project","고구려 조정의 군사·정치 결정에 관여하는 인물로 등장한다."],
    ["uija","의자왕","백제","군주","실존","sabi","baekje","당의 원정을 계기로 신라의 성들을 공격했다고 백제본기에 기록된다.",[80,67,77,82,76]],
    ["yusin","김유신","신라","장군","실존","maeri","silla","645년 백제의 매리포성 공격에 대응했다. 이 기획안의 배치는 접경 방어 역할을 보여준다.",[91,86,79,69,68]],
    ["kotoku","고토쿠","왜","군주","실존","yamato","japan","645년 즉위한 군주로 조정 개편기의 인사와 외교를 이끈다.",[55,45,72,81,74],"孝徳 가루 황자"],
    ["nakano","나카노오에","왜","황태자","실존","yamato","japan","고토쿠 즉위 당시 황태자가 되었다.",null,"中大兄 덴지"],
    ["kamatari","나카토미노 가마타리","왜","내신","실존","yamato","japan","고토쿠 즉위 뒤 내신에 임명되었다.",null,"中臣鎌足 후지와라"],
    ["abeno","아베노 우치마로","왜","좌대신","실존","yamato","japan","고토쿠 조정의 좌대신으로 임명되었다.",null,"阿倍内麻呂"],
    ["shimin","이세민","당","황제","실존","siege","ansi","당 태종으로 645년 고구려 원정을 직접 지휘했다.",[94,84,89,92,85],"당 태종"],
    ["shiji","이세적","당","원정 장군","실존","liaodong","ansi","당의 원정 장군이며, 보급로를 고려해 안시성 공격을 주장했다.",[91,76,88,71,63],"李世勣 이적"],
    ["wuji","장손무기","당","원정 지휘부","실존","siege","field","주필산 전투 기사에 당군을 이끈 인물로 나온다."],
    ["rengui","설인귀","당","원정군 무장","실존",null,"field","주필산 전투에서 활약이 기록된다."]
  ]
};
