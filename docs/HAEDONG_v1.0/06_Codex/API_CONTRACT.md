# API / 화면 계약

인증은 run 소유자 또는 명시적 읽기 권한으로 검사한다. SSE에도 같은 권한을 적용한다. 전송은 JSON UTF-8, 시각은 정수 분, 수량은 정수, 지수는 명시적 고정소수 문자열을 권장한다.

| 메서드 | 경로 | 동작 |
|---|---|---|
| POST | /runs | mode=new 또는 reference, scenario_id, seed로 생성 |
| GET | /runs/{id}/state | 플레이어 허용 투영과 version |
| GET | /runs/{id}/events?after_seq= | seq 오름차순, 다음 커서 |
| GET | /runs/{id}/intel | observed_at / received_at / confidence |
| POST | /runs/{id}/orders | version·멱등·부대 충돌 검사 후 적용 |
| POST | /runs/{id}/advance | 남은 시간 포함 진행/중단 응답 |
| POST | /runs/{id}/policies | 10~365일 정책·예상 비용 |
| POST | /runs/{id}/handover | 실제 포로 인계 확인 |
| GET | /runs/{id}/stream | event_seq 기반 SSE, 재접속 가능 |

orders 요청 예시:
```json
{"expected_version":12,"idempotency_key":"client-018","duration_minutes":60,"interrupt_policy":"critical","delegate_emergency_response":false,"retain_active_orders":true,"orders":[{"unit_id":"mobile","kind":"recon","target_node":"canyon"}]}
```

성공 응답 예시(신규 설계 예시이며 G 저장점이 아님):
```json
{"version":13,"status":"interrupted","elapsed_minutes":25,"remaining_minutes":35,"stop_reason":"enemy_contact","event_seq":92,"state_url":"/runs/example/state"}
```

멱등 재요청은 동일 응답과 replayed=true 메타데이터를 반환한다. 409 version_conflict와 idempotency_conflict를 구분한다.422는 잘못된 단위·음수·부대 충돌·미확인 import의 시뮬레이션 시도다.403은 타인 run 접근,404는 공개할 수 없는 run이다.503은 엔진 worker 접근 실패이며 commit 여부가 불명확하면 동일 키로 조회/재전송한다.

AI 제안 스키마: {based_on_version:int, orders:[{unit_id,kind,target_node}], reasoning:string}. additionalProperties=false. casualty_delta·supply_delta·new_state·hidden_enemy는 금지 필드다. reasoning은 플레이어에게 바로 공개하지 않고 해당 역할의 정보 권한을 검증한다.

Vue TypeScript 타입에서 available:number|null, absolute_date:string|null로 선언한다. truthy 체크로 0을 누락하지 말고 value===null로 분기한다. UI 숫자 포맷과 관계없이 JSON은 숫자 단위를 보존한다.
