# 프로젝트 현황

마지막 갱신 2026-11-22 · PoC · 기준 브랜치 `main`

## 완료 및 검증

- 작업 시작 기준은 `cdb07a5`다. `d884561`의 안시성 웹 기획안과 `cdb07a5`의 루트 테스트 페이지 구조를 보존했다. 배포 준비 커밋은 `main`에서 제목 `feat: establish HAEDONG PoC deployment and agent documentation`으로 찾을 수 있다.
- 기획안에 5국과 거점 14개, 대표 인물 16명이 있다. `deploy-pages.yml`이 허용된 네 파일을 패키징하며 이전 워크플로는 새 파일로 통합했다.
- 기존 테스트 31개는 Windows Python UTF-8 모드에서 모두 통과했다. JavaScript 구문, 워크플로 YAML 구문, 파일 목록과 Pages 접두 경로를 확인했다.
- 로컬 Chrome 1280px와 iPhone 13 390px 에뮬레이션에서 `/haedong/`와 직접 파일 실행, 지도, 거점·열전 이동, 뒤로 가기, 이명 검색과 브리핑을 확인했다. 테스트 중 브라우저 스크립트 오류나 필수 리소스 HTTP 오류가 없었다. 실제 모바일 기기 검증은 남아 있다.
- 배포 커밋 `cc156a62808850f957b4abda4adfbf7b043e9ed8`의 [Actions 실행](https://github.com/channyworks/haedong/actions/runs/45021775821)이 성공했다. [공개 사이트](https://channyworks.github.io/haedong/)에서 시나리오 HTML과 CSS·JS 세 파일의 HTTP 200을 확인했다.

## 공개 상태와 검토 사항

- 원격 저장소가 Public으로 전환된 상태에서 배포가 실행됐다. 이번 작업에서는 저장소 공개 범위를 변경하지 않았다.
- 현재 파일과 접근 가능한 이력의 136개 기존 경로·객체 조합을 검토했다. 텍스트, ZIP·Word 내부의 텍스트, PDF 추출 텍스트·메타데이터, 이미지 EXIF 문자열에서 지정한 자격 증명 및 내부망 URL 패턴이 발견되지 않았다. 패턴 검사는 민감정보 부재를 보증하지 않는다.
- Git 커밋 메타데이터에서 작성자·커미터 이메일 유형을 확인했다. `09_References/production_brief.jpg`는 내부 제작 대화 캡처다. 해당 이미지, `09_References/haedong_v01.zip`, v1.0 원고·제작 자료의 저장소 공개 적합성은 권리자 확인이 필요하다.

## 다음 우선순위

자료·이력 공개 적합성 확인 → 실기기 검증 → 국가별 인물 편성과 사료 보강. MVP 기술 스택과 요금제는 [로드맵](ROADMAP.md)에 따라 추후 결정한다.
