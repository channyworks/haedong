# HAEDONG

역사소설 **해동연의**와 역사 시뮬레이션 게임 **해동삼국지**를 함께 개발한다. PoC에서 삼국·당·왜와 발해의 인물, 국가별 정치와 가문, 외교 관계 및 27개 시나리오를 찾아볼 수 있다. 645년 최신 시연에는 기존 5국 군령과 소설 초안, 다섯 국가의 전략 AI 관전이 있다.

| 경로 | 내용 |
|---|---|
| [scenario-preview/](scenario-preview/index.html) | 정적 웹 기획안 진입점 |
| [docs/HAEDONG_v1.0/](docs/HAEDONG_v1.0/README.md) | 소설, 시나리오북, 인물, 지도, 원본, 설계와 기준 커널 |
| [data/history/](data/history/) | 통합 인물·국가·시나리오 JSON 정본 |
| [docs/adr/](docs/adr/) | 기술적 의사결정 |
| [plan/](plan/) | 작업 계획 이력 |

## 실행과 배포

저장소 루트에서 `python -m http.server 8000`을 실행하고 [로컬 기획안](http://localhost:8000/scenario-preview/)을 연다. Python 없이 `scenario-preview/index.html`을 브라우저에서 직접 열 수도 있다. 운영과 검증 절차는 [배포 가이드](docs/DEPLOYMENT_GUIDE.md)에 있다. [GitHub Pages 기획안](https://channyworks.github.io/haedong/scenario-preview/)

## 프로젝트 문서

- [Agent 작업 지침](AGENTS.md)
- [프로젝트 컨텍스트](docs/PROJECT_CONTEXT.md)
- [통합 게임 기획서](docs/design/WORLD_DESIGN.md)
- [국가별 정치 시스템과 전략 AI](docs/design/POLITICAL_SYSTEMS.md)
- [시나리오 연표와 발해 확장](docs/design/SCENARIO_TIMELINE.md)
- [역사 인물 도감](docs/history/ENCYCLOPEDIA.md)
- [역사적 출처 및 검증 보고서](docs/history/SOURCES.md)
- [5국 플레이와 역사소설 기획](docs/PLAY_TO_NOVEL.md)
- [프로젝트 현황](docs/PROJECT_STATUS.md)
- [로드맵](docs/ROADMAP.md)
- [아키텍처](docs/ARCHITECTURE.md)
- [보안 정책](docs/SECURITY_POLICY.md)
