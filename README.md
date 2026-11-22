# HAEDONG

역사소설 **해동연의**와 역사 시뮬레이션 게임 **해동삼국지**를 함께 개발한다. 현재 PoC는 〈안시성의 불멸〉의 5국 세력지도, 거점, 인물 열전과 내정 직전 브리핑을 PC와 모바일에서 제공한다.

| 경로 | 내용 |
|---|---|
| [scenario-preview/](scenario-preview/index.html) | 정적 웹 기획안 진입점 |
| [docs/HAEDONG_v1.0/](docs/HAEDONG_v1.0/README.md) | 소설, 시나리오북, 인물, 지도, 원본, 설계와 기준 커널 |
| [docs/adr/](docs/adr/) | 기술적 의사결정 |
| [plan/](plan/) | 작업 계획 이력 |

## 실행과 배포

저장소 루트에서 `python -m http.server 8000`을 실행하고 [로컬 기획안](http://localhost:8000/scenario-preview/)을 연다. Python 없이 `scenario-preview/index.html`을 브라우저에서 직접 열 수도 있다. [GitHub Pages 예정 주소](https://channyworks.github.io/haedong/)의 활성화와 검증 절차는 [배포 가이드](docs/DEPLOYMENT_GUIDE.md)에 있다.

## 프로젝트 문서

- [Agent 작업 지침](AGENTS.md)
- [프로젝트 컨텍스트](docs/PROJECT_CONTEXT.md)
- [프로젝트 현황](docs/PROJECT_STATUS.md)
- [로드맵](docs/ROADMAP.md)
- [아키텍처](docs/ARCHITECTURE.md)
- [보안 정책](docs/SECURITY_POLICY.md)
