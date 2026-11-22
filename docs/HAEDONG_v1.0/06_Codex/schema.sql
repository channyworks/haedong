-- MySQL 8 계열 설계 초안. 실제 migration 적용·통합 시험은 미실시.
CREATE TABLE runs (
 run_id CHAR(36) PRIMARY KEY, owner_id VARCHAR(100) NOT NULL,
 version BIGINT UNSIGNED NOT NULL DEFAULT 0,
 current_minute BIGINT UNSIGNED NOT NULL, seed BIGINT NOT NULL,
 ruleset VARCHAR(64) NOT NULL, state_json JSON NOT NULL
) ENGINE=InnoDB;
CREATE TABLE commands (
 run_id CHAR(36) NOT NULL, idempotency_key VARCHAR(128) NOT NULL,
 payload_hash CHAR(64) NOT NULL, response_json JSON NOT NULL,
 committed_version BIGINT UNSIGNED NOT NULL,
 PRIMARY KEY(run_id,idempotency_key),
 FOREIGN KEY(run_id) REFERENCES runs(run_id)
) ENGINE=InnoDB;
CREATE TABLE events (
 run_id CHAR(36) NOT NULL, event_seq BIGINT UNSIGNED NOT NULL,
 minute BIGINT UNSIGNED NOT NULL, event_type VARCHAR(64) NOT NULL,
 provenance ENUM('H','G','N','U') NOT NULL, payload JSON NOT NULL,
 PRIMARY KEY(run_id,event_seq), FOREIGN KEY(run_id) REFERENCES runs(run_id)
) ENGINE=InnoDB;
CREATE TABLE ledger (
 run_id CHAR(36) NOT NULL, event_seq BIGINT UNSIGNED NOT NULL,
 line_no INT UNSIGNED NOT NULL, account VARCHAR(100) NOT NULL,
 unit VARCHAR(32) NOT NULL, amount BIGINT NOT NULL,
 PRIMARY KEY(run_id,event_seq,line_no),
 FOREIGN KEY(run_id,event_seq) REFERENCES events(run_id,event_seq)
) ENGINE=InnoDB;
CREATE TABLE outbox (
 run_id CHAR(36) NOT NULL, event_seq BIGINT UNSIGNED NOT NULL,
 published_at DATETIME NULL, payload JSON NOT NULL,
 PRIMARY KEY(run_id,event_seq),
 FOREIGN KEY(run_id,event_seq) REFERENCES events(run_id,event_seq)
) ENGINE=InnoDB;
-- unit별 ledger amount 합계 0은 서비스 계층에서 같은 트랜잭션으로 검사한다.
-- state_json 안의 전투·인물 스키마는 도메인 validation 후에만 저장한다.
