# 아키텍처

## 현재 구성

`scenario-preview/index.html`이 화면 구조, `style.css`가 반응형 스타일, `data.js`가 세력·거점·인물·출처, `coastline.js`가 해안선 데이터를 제공한다. `simulation.js`는 세력별 네 턴의 재현 가능한 판정과 소설 초안, `app.js`는 탐색·검색·브라우저 저장과 다운로드를 맡는다. 상대 경로가 로컬과 Pages 프로젝트 접두 경로에서 같은 리소스를 가리킨다. 실행에 별도 API나 외부 라이브러리가 필요하지 않다. [상세 기획](PLAY_TO_NOVEL.md)

```mermaid
flowchart LR
  A[main 변경] --> B[구문과 경로 검증]
  B --> C[허용된 정적 파일 여섯 개 패키징]
  C --> D[GitHub Pages OIDC 배포]
  D --> E[PC 및 모바일 브라우저]
```

기존 v1.0 게임 데이터와 원본 저장점은 정적 사이트 바깥에 있다. 미확인 수치는 null, 게임 자료의 역사·복원·창작 출처는 분리한다. FastAPI·Vue·MySQL·LangGraph·Ollama는 기존 설계와 검증 커널의 문맥이다. 현재 PoC에서 배포하는 런타임은 브라우저뿐이다.

## MVP 후보

Next.js·React·TypeScript·Auth.js와 Vercel을 기존 엔진 연동 요구와 함께 평가한다. 로그인 완료 후 서버에서 GitHub 사용자 고유 ID 허용 목록을 확인한다. 매 요청에서 화면·API·파일 권한을 확인하고 콘텐츠는 보호된 서버 경로에서만 전달한다. 빌드 결과, 정적 리소스와 미리보기·개별 배포 URL도 접근 제어 설계에 포함한다. 배포 시점의 요금제와 정책을 다시 검토한다.
