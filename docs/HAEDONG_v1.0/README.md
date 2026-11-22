# HAEDONG v1.0 · 안시성의 불멸

## 바로 읽기

01_Novel/haedong_novel.pdf는 120×180mm 소형 판형 110쪽의 삽화 포함 완결본이다. 원고는 약 4.1만 자(공백·문장부호 포함), 서장·29장·종장으로 구성된다. 같은 원고의 Word·Markdown을 함께 제공한다. 일반 A4판의 110쪽을 뜻하지 않는다.

- 01_Novel: 소설 PDF·Word·Markdown.
- 02_Scenario: 시나리오북 18쪽 PDF·Word·Markdown, 25건 연표와 단계별 지도.
- 03_Characters: 20명 설정집 21쪽 PDF·Word·Markdown과 초상 PNG 원본.
- 04_Illustrations: 사건 삽화 20점 PNG, 생성 프롬프트 기록.
- 05_Maps: 비축척 게임 개념도 12종 SVG·PNG.
- 06_Codex: 개발 명세 PDF·Word·Markdown, API·SQL·Python 기준 커널·문서 재생성 스크립트.
- 07_GameData: 인물·사건·시나리오·저장점 JSON, 스키마·미확인 목록·회계 대조.
- 08_Tests: Python 검증 코드와 실행 안내.
- 09_References: 공개 출처, 업로드 원본과 첨부 제작 지침 이미지, 원본 해시.
- 10_QA: 테스트 로그·조판 점검·일관성 검토·최종 매니페스트.

## 자료의 경계

H=역사 골격 / G=기존 게임 복원 요약 / N=신규 창작 / U=미확인. 업로드 v0.1의 분기 B·POST_003은 바이트 동일하게 보존했다. 원래 대화 전체와 B023·POST_000~002 전체 저장점은 미확보다. 미확인을 수치로 채우지 않았다. 지도는 실측 지도가 아닌 게임 개념도이며, 인물 외형과 디자인 나이는 작품용 설정이다.

최종 병력·포로 총계는 맞지만 전 구간 사상·회복·물량 회계는 원장 부재로 확정할 수 없다. 개발 산출물은 Python/FastAPI/Vue 3/TypeScript/MySQL/LangGraph/Ollama 설계와 검증 기준 커널이다. 전체 웹게임 구현과 서비스 통합 구동은 후속 개발 범위다.

## 검증 실행

```bash
python -m unittest discover -s 08_Tests -v
```

Python 3.10 이상. jsonschema는 선택 검증 의존성이다. 전체 31개 테스트를 실행했다. 범위와 한계는 08_Tests/README.md와 10_QA/QA_REPORT.md에 정리했다.

## 문서 재생성

```bash
python -m pip install -r 06_Codex/requirements.txt
python 06_Codex/build_documents.py
```

Noto Serif CJK KR / Noto Sans CJK KR 폰트와 LibreOffice가 필요하다. 스크립트는 Word를 재생성한다. PDF는 LibreOffice로 각 폴더에 변환한다. 환경·폰트가 바뀌면 페이지 수도 달라질 수 있다. Markdown과 PNG·SVG가 편집 기준이다. 이미지 생성은 재생성 스크립트에 포함되지 않는다.
