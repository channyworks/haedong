# HAEDONG 작업 지침

HAEDONG은 역사소설 《해동연의》와 역사 시뮬레이션 게임 《해동삼국지》를 같은 세계관과 시나리오 자료 위에서 개발하는 프로젝트다. 현재 단계는 PoC다. `scenario-preview/`는 브라우저 기획안, `docs/HAEDONG_v1.0/`은 기존 콘텐츠와 기준 커널, `plan/`은 날짜별 실행 계획이다.

## 세션 시작

이 문서 → [README](README.md) → [프로젝트 컨텍스트](docs/PROJECT_CONTEXT.md) → [현황](docs/PROJECT_STATUS.md) → [로드맵](docs/ROADMAP.md) → [아키텍처](docs/ARCHITECTURE.md) → [배포](docs/DEPLOYMENT_GUIDE.md) → [보안](docs/SECURITY_POLICY.md) → 관련 ADR → 작업 대상 소스와 상세 명세 순으로 확인한다. 기존 패키지를 다룰 때는 [패키지 개발 지침](docs/HAEDONG_v1.0/06_Codex/AGENTS.md)과 그 선행 문서를 읽는다.

## 개발과 완료 기준

- 역사 H, 게임 복원 G, 신규 설계 N, 미확인 U를 구분한다. 미확인 수치는 데이터에서 null로 둔다. v0.1, 원본 저장점, 기존 문서·이미지와 검증 매니페스트를 보존한다.
- PoC는 정적 HTML·CSS·JS와 GitHub Pages를 사용한다. 프레임워크·데이터베이스·인증 도입은 관련 단계의 근거와 ADR을 먼저 기록한다.
- [배포 가이드](docs/DEPLOYMENT_GUIDE.md)의 검사와 관련 회귀 테스트를 실행한다. 미실행 항목과 원인을 기록하고, 게시 성공은 실제 워크플로와 URL로 확인한다.
- 작업을 시작할 때 브랜치, origin, 원격 최신 상태, 작업 트리를 확인한다. 이번 작업 파일만 스테이징하고 승인 범위에 따라 커밋·푸시한다. 원격 충돌은 강제 푸시 없이 해결한다.
- 비밀값을 커밋하거나 로그에 넣지 않는다. 공개 범위 변경과 외부 공개는 [보안 정책](docs/SECURITY_POLICY.md)을 따른다.
- 주요 변경 후 관련 문서와 현황에 기능, 결정, 검사 결과, 공개 상태, 미해결 문제와 다음 작업을 갱신한다. 확정·검토·미확인을 구분한다. 별도 작업 계획이 필요하면 `plan/YYYY-MM-DD_HHmm_이름.md`에 한국시간으로 추가한다.
