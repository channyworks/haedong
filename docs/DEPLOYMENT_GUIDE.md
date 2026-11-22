# 배포 가이드

## 로컬 실행

저장소 루트에서 다음 명령을 실행하고 [로컬 시나리오](http://localhost:8000/scenario-preview/)를 연다. 파일을 브라우저에서 직접 열어도 된다.

```sh
python -m http.server 8000
python scripts/check_preview.py
node --check scenario-preview/data.js
node --check scenario-preview/app.js
node --test scripts/check_scenario.cjs
python -X utf8 -B -m unittest discover -s docs/HAEDONG_v1.0/08_Tests -v
```

서버 명령은 별도 터미널에서 실행한다. `check_preview.py --output <새 디렉터리>`로 실제 업로드와 같은 파일 구성을 확인할 수 있다.

## 초기 게시와 검증

1. [보안 점검](SECURITY_POLICY.md)을 완료한다. 공개 담당자가 준비되면 저장소 **Settings → General → Danger Zone → Change repository visibility → Make public**에서 직접 진행한다.
2. **Settings → Pages → Build and deployment → Source → GitHub Actions**를 선택한다.
3. **Actions → Publish scenario preview → Run workflow**에서 `main`을 선택한다. 이후 `main`의 PoC·검사·워크플로 변경은 자동 배포된다.
4. 패키지 및 배포 작업이 성공하고 `github-pages` 환경에 URL이 표시되는지 확인한다. [공개 사이트](https://channyworks.github.io/haedong/)에서 페이지를 열고 CSS·JS 응답과 지도, 검색, 거점 상세, 열전, 브리핑을 PC와 모바일에서 확인한다.

워크플로는 `scenario-preview/`에서 검증된 HTML·CSS·JS 여섯 파일만 아티팩트 루트에 복사한다. 루트 테스트 페이지, 문서, 계획, 이미지와 원본 자료는 Pages에 포함되지 않는다. GitHub Pages에 게시하면 로컬 PC가 꺼져도 접속할 수 있다.

## 장애와 복구

- 패키지 실패 시 로그의 구문 오류와 애셋 상대 경로·대소문자·허용 파일 목록을 확인한다.
- Pages 미설정 또는 404라면 저장소 공개 상태, Pages Source, 최신 워크플로 결과와 환경 URL을 대조한다. 배포 권한 오류는 Actions 권한과 `github-pages` 환경의 브랜치 규칙을 확인한다.
- 회귀가 있으면 문제가 된 변경을 되돌리는 커밋을 `main`에 추가하고 정상 배포와 URL을 다시 확인한다.

## PoC 종료

자동 배포를 중지하고 **Settings → Pages**에서 사이트 게시를 내린 뒤, 공개 URL이 응답하지 않는지 확인한다. 담당자가 저장소를 Private으로 전환한다. MVP 이전 시 Vercel 요금제와 Private 연동을 확인하고 서버 접근 제어를 배포 전에 검증한다. 환경변수는 대상 환경별로 관리한다.

[GitHub Pages 워크플로 공식 문서](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
