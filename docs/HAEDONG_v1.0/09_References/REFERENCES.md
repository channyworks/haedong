# 출처·원문·미확인 자료

## 분류 기준

H는 역사 골격, G는 기존 분기 B 복원 요약, N은 신규 창작·설계, U는 미확인이다. 본권에 나오는 성주의 구체적 대사·눈썹 흉터·성격 장면·날씨·보초 신호·생활도구·시각별 지시·의료 절차는 N이다. G에서 확인되는 것은 사건 제목과 기록된 수치이며, 그 사이의 상세 전술을 소설 장면으로부터 사실로 추출해서는 안 된다.

## 1차 프로젝트 자료

업로드 haedong_v01.zip을 원본으로 보존했다. 09_References/v01_original에 압축 내 파일을 그대로 복사하고 source_hashes.json에 SHA-256을 기록했다. ansi_branch_b.json은 25건의 reconstructed_summary이며, POST_003은 source_status가 visible prior report; indices fictional이다. 원래 대화·Demo 전체 로그·B023 전체 저장 파일은 확보하지 못했다. 원본 ZIP도 별도 사본으로 포함한다.

첨부 1000092305.jpg는 제작 요구·폴더 구조·분량·전술지도10~15점·사건삽화20~30점·인물15~20명의 안내 화면이다. 실제 전투의 원문 증거나 인물 외형 참고 그림이 아니다. 10개 폴더, 지도12, 사건삽화20, 인물20을 제작 기준으로 삼았다.

## 역사 확인에 사용한 공개 자료

1. 국사편찬위원회 우리역사넷 「고구려와 당의 전쟁」. https://contents.history.go.kr/front/hm/view.do?levelId=hm_014_0020 . 열람 2026-11-21. 안시성 저항·토산 공방·당 철수·성주 이름의 후대 전승과 고연수의 항복이라는 골격을 확인했다. 정확한 원전 전체에 대한 교감이나 모든 병력 수치의 역사 검증은 하지 않았다.
2. 국사편찬위원회 한국사데이터베이스 『삼국사기』 권21 고구려본기9 보장왕4년 「고연수의 군대가 항복하다」. https://db.history.go.kr/id/sg_021r_0020_0218 . 공개 검색에서 항복 기사를 확인했다. 이 작품의 고연수 성내 지휘관 배역은 해당 역사와 의도적으로 다르다.

역사 달력의 645년과 게임의 상대17~150일차를 구분한다. 토산 붕괴의 정밀 원인·정확한 성주 외형·협곡 위치는 확인하지 않았다. 굴착이 붕괴 원인이라고 단정하지 않는다. 연남생은 645년의 소년 배역이며 주요 성인 장수처럼 군권을 주지 않는다.

## 구현 설계에 사용한 공식 문서

- FastAPI SQL (Relational) Databases: https://fastapi.tiangolo.com/tutorial/sql-databases/ . DB 라이브러리 선택과 API 계층 분리의 참고.
- Vue Using Vue with TypeScript: https://vuejs.org/guide/typescript/overview.html . 프런트엔드 타입 계약 참고.
- MySQL 8.4 Locking Reads: https://dev.mysql.com/doc/refman/8.4/en/innodb-locking-reads.html . SELECT FOR UPDATE 직렬화 설계 참고.
- LangGraph Persistence: https://docs.langchain.com/oss/python/langgraph/persistence . AI 워크플로 체크포인트 개념 참고. 체크포인트를 전쟁 수치의 권위 저장소로 사용하지 않는 선택은 본 프로젝트 설계다.
- Ollama Structured Outputs: https://docs.ollama.com/capabilities/structured-outputs . 로컬 모델 응답을 JSON schema로 제한하는 설계 참고.

모두 열람일 2026-11-21. 엔진 공식·API 경로·DB테이블·시간 우선순위·UI는 위 문서의 원문이 아니라 HAEDONG의 신규 설계다. 네트워크 서비스 실제 통합 시험은 수행하지 않았다.

## 미확인 사항의 처리

B022·POST_000·POST_001 가용병력은 null. source_status는 변경하지 않는다. B021 선송환146과 최종 선송환183 사이37명의 상세 경위는 미확인이다. 소설의 146을 누계183으로 바꾸지 않았다. 최종잔류0은 양쪽 값을 반영한 누계 회계다. 수레80·48·120은 물량으로 더하지 않는다. 독립군3000과 귀환민1420은 직속군에서 빼거나 더하지 않는다.
