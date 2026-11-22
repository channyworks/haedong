# 해동삼국지 · 개발 상세 설계 v1.0

## 1. 제품 범위와 완성 기준

단일 플레이어가 안시성주를 맡아 전투 중에는 분 단위 군령을, 전후에는 10~365일 정책을 내린다. 구원군·적장·조정은 자기 권한과 목표에 따라 반응한다. 분기 B 기록 열람과 신규 플레이를 별도 모드로 제공한다. 본 패키지는 구현 명세와 검증용 최소 Python 커널이며 실행 가능한 전체 웹게임은 후속 구현 대상이다.

출시 MVP: 저장/재개, 이동/접촉/전투/치료, 전령 지연, 정보 안개, 포로 인계, 휴전·철군, 재현 가능한 이벤트 로그, 한 성의 전후 복구. 원정 전역·대규모 경제·멀티플레이는 후속 범위다.

## 2. 계층과 기술

Vue 3 + TypeScript는 지도, 명령 편집, 첩보 시간, 부대·물량, 정책, 로그 화면을 제공한다. UI가 성공을 낙관적으로 확정하지 않으며 서버 버전과 pending 상태를 보여 준다. FastAPI는 인증·Pydantic 검증·실행 요청을 담당하고 Python 도메인 엔진을 호출한다. MySQL InnoDB는 상태·명령·이벤트·자원원장·outbox를 원자적으로 보존한다. LangGraph는 AI 판단 절차와 중단/재개만 담당하고 Ollama 로컬 모델이 구조화된 제안을 낸다. AI 기능이 꺼져도 방어/대기 규칙으로 엔진은 진행한다.

규모가 작은 MVP는 단일 엔진 worker로 시작한다. 다중 worker 전환 시 run별 직렬화와 DB 잠금을 함께 사용한다. Python 정수·고정소수 단위를 사용하고 JS 부동소수에 회계를 맡기지 않는다. 특정 최신 버전에 맞춘 lock은 구현 환경에서 공식 문서와 함께 다시 확정한다.

## 3. 권위 상태와 도메인

Run(run_id, owner_id, version, ruleset, seed, current_minute, mode). Unit(unit_id, owner_force, commander_id, present, available, wounded, fatigue, morale, ammo, node_id, move_progress, orders). Force 소유권은 성주 직속·독립·적을 구분한다. 연합군은 alliance만 같고 owner는 다를 수 있다.

Population에는 귀환민·백성·복무 자격을 별도 관리한다. Prisoner는 개별 또는 batch 단위로 captured→medical_hold/eligible→approved→handover→released 상태를 따른다. Approved는 여전히 억류 인원이다. ResourceAccount는 grain_grams, arrow_count, timber_units, money_minor, supply_index를 서로 다른 계정으로 둔다. 지수에서 물량을 생성하는 환산 규칙은 없다.

원본 가져오기 모드는 immutable snapshot이다. 누락 필드가 있어도 읽을 수 있으나 simulation_ready가 false이며 신규 플레이 초기상태와 분리한다. POST_003의 부상0은 해당 저장점의 분류이지 역사적 무상해의 주장도 전체 전쟁 부상자0도 아니다.

## 4. 시간과 이벤트 순서

모든 권위 시각은 정수 분이다. event queue 정렬 키는 (minute, priority, insertion_seq). 동일 분 우선순위는 합의 발효→도착·전령 수신→회복→접촉→전투→생산소비→보고 생성이다. event_seq는 run 안에서 단조 증가하며 난수 소비 순서도 이벤트에 남긴다.

advance 요청은 duration_minutes만큼 상한을 정한다. all은 사용자 중요 이벤트, critical은 함락·지휘관 사망·합의 파기 등 등록된 필터에서 멈춘다. none은 끝까지 진행하되 치명 사건을 숨기지 않는다. 중단 시 remaining_minutes와 이유를 돌려주며 자동 재개하지 않는다. 전후 정책은 내부 일별로 생산·소비·기한을 먼저 계산하고 정책 종료시에 묶어 보고한다. 정수일을 분으로 환산하며 historical_date는 별도 필드다.

## 5. 이동과 전령

지역 그래프 Edge(length_units, minutes_base, terrain, capacity_per_minute, weather_modifier). 검증 시 출발·목표 노드와 알려진 길을 확인한다. 이동 중 전투가 발생하면 남은 진척을 상태에 보존한다. 이동 시간은 ceil(base * fatigue_factor * terrain_factor)로 제안하되 실제 지도 데이터가 없으므로 v1 설계값이다. 병력 전체가 도착하기 전에 통과량을 나누는 병목 모델을 지원한다.

전령은 이동 이벤트이며 observed_at과 received_at을 분리한다. 같은 전령의 보고라도 갱신된 정보가 아니면 시각을 현재로 덮어쓰지 않는다. 독립군은 수신 뒤 목표·보급·위험에 따라 수락/수정/거절한다. 명령 전송 성공을 명령 수행 확정으로 취급하지 않는다.

## 6. 전투 시제 규칙

정식 밸런스는 미확정. 제공 kernel은 회계와 재현의 기준을 검증하려는 최소 규칙이며 분기 B 수치를 역산하지 않는다. strength = available * morale/100 * (100-fatigue)/100 * terrain_factor, seed 기반으로 상한 내 사상자를 고르고 실제 전투 해상도는 5분 틱으로 제안한다. 확률·피해량은 ruleset에 버전을 붙이고 로그에 남긴다.

casualty 이벤트는 dead_delta와 wounded_delta를 분리한다. 가용→부상, 가용→전사만 허용하고 회복은 부상→가용이다. 사망자가 회복되거나 포로가 치료만으로 직속병이 되는 변경은 거부한다. surrender/capture는 별도 소유권 이벤트다. 맵 수용력과 근접 전투 범위를 만족해야 공격 가능하다. 아군 사격은 설계상 차단을 기본으로 하되 오인사격 시나리오를 추가할 경우 별도 규칙과 고지를 둔다.

## 7. 내정과 자원

일일 소비는 계정별 차변·대변으로 기록한다. grain_g_delta는 실제 창고 계정에만 작용하며 supply_index와 독립이다. 물량 미확인인 수레80/48/120은 차량 개수 이벤트로만 가져온다. 최종 보급78.6은 지수값으로 보존하며 쌀로 환산하지 않는다.

인사에서 직책·관등·친밀·신뢰·경계를 별도 저장한다. 양덕3000은 독립군 계정으로 남기며 출처가 확인되지 않은 전속은 pending_review다. 정책 명령은 시행 비용·효과 발생일·취소 조건을 갖는다. 구호·복구·훈련·외교는 같은 인력을 중복 배정할 수 없다. 장기 정책 중 공급 부족이 발생하면 daily_event로 즉시 판정한다.

## 8. 외교

Agreement는 draft/accepted/effective/expired/breached를 가진다. 수락과 발효를 분리하며 휴전09:02와 철군10:16은 참조 모드의 사건 시각이다. 신규 플레이에서는 제안·반응에 따라 달라진다. 교환 승인으로 포로 수를 줄이지 않고 실제 handover에 양측 확인과 release event를 남긴다. 같은 batch의 이중 인계는 멱등 키로 차단한다. 포로 의료 적격과 교환 정치 조건을 따로 검사한다.

## 9. AI 경계와 LangGraph

graph: gather_visible_context→plan→structured_parse→domain_validate→propose→wait_engine→narrate. 엔진 결과를 받은 narrate 단계는 새 수치나 새 사상자를 생성할 권한이 없다. 중요한 숫자는 서버가 채우는 템플릿으로 삽입한다. 모델이 제시한 casualty/resource_delta는 허용 필드가 아니므로 거부한다.

역할별 허용도구는 read_visible_intel, read_own_units, propose_order, summarize_memory로 한정한다. 적 정보 전체·파일시스템·SQL 실행 도구는 제공하지 않는다. 적의 기밀은 자신의 agent context에만 들어간다. Ollama 호출은 JSON schema, timeout 30초, 재시도1회, temperature0 제안. 재시도도 실패하면 방어/대기를 제안하고 시간·수치는 엔진이 정한다.

LangGraph 체크포인트는 AI 워크플로 상태다. MySQL run version과 별개이며 engine_command_id를 저장한다. 재개 시 이미 committed된 명령은 재실행하지 않고 결과를 읽는다. 랜덤성 재현은 모델 텍스트 동일성이 아니라 엔진 seed·이벤트 순서·명령 기록으로 검증한다.

## 10. 트랜잭션과 장애 복구

인증→형식검증→DB 트랜잭션→run SELECT FOR UPDATE→멱등키 조회→버전 확인→도메인 검사→이벤트 적용→원장·상태·outbox 저장→commit. AI 호출은 commit 전후의 잠금 밖에서 수행한다. AI 제안의 based_on_version이 오래되면 재검증하거나 폐기한다.

(run_id,idempotency_key) 유니크. 동일 키·동일 canonical payload hash는 이전 응답 반환, 동일 키·다른 payload는409. 해당 키의 성공 결과는 expected_version보다 먼저 조회하므로 재전송으로 이미 성공한 명령이 버전 불일치가 되지 않는다. 도메인 실패는 상태 불변, 클라이언트는 상태 갱신 뒤 새 키로 요청한다.

outbox 소비자는 event_id 중복을 제거한다. 재시작 시 마지막 스냅샷과 이후 이벤트를 ruleset_version/seed 상태와 함께 적용한다. 서로 다른 ruleset으로 조용히 재생하지 않는다. 자동 migration 없이 원본 참조 저장점을 덮어쓰지 않는다.

## 11. UI 흐름

화면 상단은 현재 상대 일차·시각·version·명령 진행 상태다. 지도는 확인된 병력과 추정 적군을 구분하고 마지막 관측 시각을 표시한다. 명령 편집기는 부대, 이동/방어/정찰/구호, 목표, 지속시간, 중단 기준을 받는다. 제출 전 비용과 충돌만 검증하여 보여 주고 예측 승리를 확정하지 않는다.

내정 화면은 직속군·독립군·귀환민·포로 탭을 분리하며 자원에는 단위를 붙인다. 포로 화면은 승인 대기와 실제 인계를 따로 보여 준다. 로그를 누르면 그 시점의 플레이어 시야를 재구성한다. 참조 기록에서 U는 '미확인'으로 표시하며 실제 0과 다른 스타일로 보인다.

## 12. 구현 로드맵과 수용 기준

M1 데이터/회계: null 보존, 원본 해시, 부대 합계, 포로 보존, 제안값 거부. M2 시간/이동: 동일분 순서, 전령지연, 중단 후 잔여분, 경로 수용력. M3 전투: seed 재현, 사상·회복·탄약, 성벽, 승패. M4 외교/내정: 합의 발효, 인계 멱등, 일별 소비, 소유권. M5 AI/UI: 정보 누출 차단, timeout 방어, 버전 충돌, 저장/재개. M6 통합: MySQL 동시 요청·프로세스 중단 후 outbox 재생·Vue 계약 시험.

기준 커널 unittest 통과는 M1 일부와 명령 원자성의 예시 증거다. 전체 MySQL/FastAPI/LangGraph/Ollama/Vue 통합이나 전투 밸런스의 검증을 의미하지 않는다. 테스트마다 어떤 구현을 검증했는지 QA에 구분한다.
