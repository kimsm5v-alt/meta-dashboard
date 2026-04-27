# DGNSS 심리검사 DDL 정리

> 작성일: 2026-03-26
> 목적: PDF 마이그레이션 API 설계를 위한 DGNSS 테이블 DDL 수집

## 사용 방법
- 아래 각 섹션에 실제 운영 DDL(`CREATE TABLE ...`)을 그대로 붙여넣어 주세요.
- 가능하면 인덱스/제약조건(FK, UK), 기본값(DEFAULT), NOT NULL 정보가 보이도록 전체 DDL을 넣어 주세요.

---

## 1) tb_dgnss_info

```sql
CREATE TABLE `tb_dgnss_info` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '진단검사 ID',
  `cla_id` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '학급ID',
  `paper_idx` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT '2' COMMENT '진단 종류(1: 종합검사, 2: 자기조절학습검사)',
  `tc_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `ord_no` int NOT NULL COMMENT '진단 회차',
  `dgnss_at` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'Y' COMMENT '진단 상태(Y: 진단중, N: 진단종료)',
  `dgnss_st_dt` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '진단시작일시',
  `dgnss_ed_dt` datetime DEFAULT NULL COMMENT '진단종료일시',
  `file_url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `rgtr` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'system',
  `reg_dt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
  `mdfr` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'system',
  `mdfy_dt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정일시',
  `dgnss_text` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tb_dgnss_info_cla_id_IDX` (`cla_id`,`paper_idx`,`ord_no`),
  UNIQUE KEY `uq_tb_dgnss_info` (`cla_id`,`paper_idx`,`ord_no`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='META자기조절학습 마스터'
```

## 2) tb_dgnss_result_info

```sql
CREATE TABLE `tb_dgnss_result_info` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '진단검사 상세 ID',
  `dgnss_id` int NOT NULL COMMENT '진단검사 ID',
  `omr_id` int DEFAULT NULL,
  `stdt_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `eak_stts_cd` int NOT NULL DEFAULT '1' COMMENT '응시상태 1: 응시전, 2: 응시중, 3: 제출완료, 4: 채점중, 5, 채점완료',
  `eak_at` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'N' COMMENT '응시여부  학생 응시 여부',
  `subm_at` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'N' COMMENT '제출여부  학생 제출여부',
  `subm_dt` datetime DEFAULT NULL COMMENT '제출일자',
  `eak_st_dt` datetime DEFAULT NULL COMMENT '응시시작일시',
  `eak_ed_dt` datetime DEFAULT NULL COMMENT '응시종료일시',
  `file_url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `summary_file_url` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `rgtr` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'system',
  `reg_dt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일시',
  `mdfr` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'system',
  `mdfy_dt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (`id`),
  KEY `idx_dgnss_result_dgnss_id` (`dgnss_id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='META자기조절학습 상세'
```

## 3) tb_dgnss_answer

```sql
CREATE TABLE `tb_dgnss_answer` (
  `ANSWER_IDX` int NOT NULL AUTO_INCREMENT COMMENT '진단 답안지 인덱스',
  `MEM_ID` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `TEST_IDX` int DEFAULT NULL COMMENT '시험인덱스',
  `DGNSS_RESULT_ID` int DEFAULT NULL COMMENT '진단 상세 아이디',
  `DGNSS_ID` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'DGNSS_20',
  `DGNSS_ORD` int NOT NULL DEFAULT '1' COMMENT '회원, 진단명별 회차',
  `PAPER_IDX` int DEFAULT '6' COMMENT '진단시험지아이디',
  `SCH_GRADE` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `DGNSS_ASIGN_MEM_IDX` int DEFAULT NULL COMMENT '진단 배정 회원 인덱스(예전 호환성)',
  `DGNSS_CNTNTS_CD` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `MEM_IDX` int DEFAULT NULL COMMENT '회원인덱스(예전 호환성)',
  `GRP_IDX` int DEFAULT NULL COMMENT '모둠인덱스(예전 호환성)',
  `ASIGN_DT` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '배정일',
  `RSPNS_DT` datetime DEFAULT NULL COMMENT '응답일시',
  `SUBMIT_YN` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `ANSWERS` json DEFAULT NULL COMMENT '응답지',
  `LS_ANS01` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `LS_ANS02` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `LS_ANS03` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `LS_ANS04` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `LS_ANS05` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `REPEATED_RESPONSE_YN` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT 'N' COMMENT '연속 동일 반응 여부(같은 번호로 응답을 10번 이상 한 경우 Y)',
  `TOTAL_NO` int DEFAULT NULL COMMENT '문항수',
  `NO_ANS_CNT` int DEFAULT '0' COMMENT '무응답수',
  `SCORE` int DEFAULT NULL COMMENT '총점',
  `M_VALUE` decimal(5,2) DEFAULT NULL COMMENT '평균',
  `COCH_DGNSS_QESITM01_SCORE` decimal(5,1) DEFAULT NULL COMMENT '교사용 반응 일관성(총 2문제 동일문항 3쌍에 대한 절대값에 대한 t점수) ',
  `COCH_DGNSS_QESITM01_MARK` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `COCH_DGNSS_QESITM02_SCORE` decimal(5,1) DEFAULT NULL COMMENT '교사용 사회적바람직성(평균 4.44 이상이면 주의 표시)',
  `COCH_DGNSS_QESITM02_MARK` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `COCH_DGNSS_QESITM03_SCORE` decimal(5,2) DEFAULT NULL COMMENT '교사용 학업성취도 (5문항 평균 점수)',
  `COCH_DGNSS_QESITM03_MARK` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `COCH_DGNSS_QESITM04_SCORE` decimal(5,2) DEFAULT NULL COMMENT '교사용 학업만족도( 1문항 평균 점수)',
  `COCH_DGNSS_QESITM04_MARK` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `PDF_YN` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `REGIST_DT` datetime DEFAULT NULL COMMENT '등록일',
  `RGSTR_ID` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `RGSTR_IP` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `REGIST_MODULE_ID` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `UPDT_DT` datetime DEFAULT NULL COMMENT '수정일시',
  `UPDUSR_ID` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `UPDUSR_IP` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `UPDT_MODULE_ID` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `LPA_TYPE` char(1) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`ANSWER_IDX`),
  KEY `idx_dgnss_answer_result_id` (`DGNSS_RESULT_ID`) USING BTREE,
  KEY `idx_dgnss_answer_test_idx` (`TEST_IDX`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='진단응답지 마스터'
```

## 4) tb_dgnss_answer_report

```sql
CREATE TABLE `tb_dgnss_answer_report` (
  `ANSWER_REPORT_IDX` int NOT NULL AUTO_INCREMENT COMMENT '진단 결과 보고서 인덱스',
  `ANSWER_IDX` int DEFAULT NULL COMMENT '진단 답안지 인덱스',
  `SECTION_ID` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `DEPTH` int DEFAULT NULL COMMENT '유형 뎁스',
  `M_VALUE` decimal(3,2) DEFAULT NULL COMMENT '평균결과점수',
  `T_SCORE` decimal(3,1) DEFAULT NULL COMMENT 'T점수',
  `T_RANK` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `T_SCRIPT` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `P_RANK` decimal(5,2) DEFAULT NULL COMMENT '백분위등수',
  `RANK_TOTAL` int DEFAULT NULL COMMENT '종합순위(종합진단에만 존재)',
  `REGIST_DT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록일',
  PRIMARY KEY (`ANSWER_REPORT_IDX`),
  UNIQUE KEY `ANSWER_IDX_DGNSS_SECTION_ID` (`ANSWER_IDX`,`SECTION_ID`),
  KEY `ix_report_answer_section_score` (`ANSWER_IDX`,`SECTION_ID`,`T_SCORE`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='진단 응답 유형별 통계'
```

## 5) tb_dgnss_omr (사용 시)

```sql
CREATE TABLE `tb_dgnss_omr` (
  `OMR_IDX` int NOT NULL AUTO_INCREMENT,
  `MEM_ID` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `CLASS_NO` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `RSPNS_DT` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `PAPER_IDX` int DEFAULT '6',
  `1` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `2` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `3` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `4` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `5` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `6` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `7` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `8` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `9` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `10` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `11` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `12` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `13` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `14` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `15` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `16` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `17` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `18` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `19` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `20` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `21` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `22` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `23` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `24` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `25` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `26` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `27` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `28` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `29` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `30` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `31` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `32` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `33` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `34` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `35` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `36` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `37` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `38` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `39` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `40` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `41` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `42` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `43` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `44` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `45` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `46` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `47` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `48` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `49` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `50` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `51` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `52` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `53` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `54` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `55` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `56` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `57` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `58` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `59` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `60` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `61` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `62` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `63` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `64` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `65` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `66` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `67` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `68` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `69` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `70` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `71` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `72` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `73` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `74` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `75` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `76` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `77` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `78` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `79` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `80` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `81` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `82` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `83` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `84` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `85` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `86` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `87` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `88` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `89` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `90` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `91` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `92` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `93` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `94` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `95` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `96` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `97` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `98` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `99` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `100` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `101` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `102` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `103` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `104` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `105` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `106` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `107` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `108` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `109` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `110` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `111` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `112` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `113` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `114` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `115` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `116` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `117` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `118` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `119` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `120` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `121` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `122` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `123` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `124` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`OMR_IDX`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='OMR 기록지'
```

## 6) tb_dgnss_lpa_result (사용 시)

```sql
CREATE TABLE `tb_dgnss_lpa_result` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT 'PK',
  `answer_idx` int NOT NULL COMMENT 'tb_dgnss_answer.ANSWER_IDX',
  `dgnss_result_id` int NOT NULL COMMENT 'tb_dgnss_result_info.id',
  `test_idx` int NOT NULL COMMENT 'tb_dgnss_info.id',
  `mem_id` varchar(255) COLLATE utf8mb4_general_ci NOT NULL COMMENT '학생 ID',
  `school_level` varchar(20) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'elementary, middle, high',
  `class_id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'Class1 ~ Class6',
  `type_name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL COMMENT 'LPA 유형명',
  `confidence` decimal(5,2) NOT NULL COMMENT '예측 확률(%)',
  `model_version` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT '모델 버전',
  `profile_version` varchar(50) COLLATE utf8mb4_general_ci NOT NULL COMMENT '프로파일 데이터 버전',
  `input_scores_json` json NOT NULL COMMENT '입력 38개 T점수 snapshot',
  `probabilities_json` json DEFAULT NULL COMMENT '유형별 확률 분포',
  `status` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'COMPLETED' COMMENT 'COMPLETED, UNSUPPORTED, FAILED',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_answer_idx` (`answer_idx`),
  KEY `idx_mem_id` (`mem_id`),
  KEY `idx_test_idx` (`test_idx`),
  KEY `idx_dgnss_result_id` (`dgnss_result_id`),
  CONSTRAINT `fk_dgnss_lpa_result_answer_idx` FOREIGN KEY (`answer_idx`) REFERENCES `tb_dgnss_answer` (`ANSWER_IDX`),
  CONSTRAINT `fk_dgnss_lpa_result_result_id` FOREIGN KEY (`dgnss_result_id`) REFERENCES `tb_dgnss_result_info` (`id`),
  CONSTRAINT `fk_dgnss_lpa_result_test_idx` FOREIGN KEY (`test_idx`) REFERENCES `tb_dgnss_info` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='DGNSS LPA 유형 분류 결과'
```

---

## 참고 (선택)
- 관련 프로시저/함수 DDL
  - 예: `PC_DGNSS_MARK`, `FN_GET_MEM_UNDER_TSCORE`
- 트리거나 배치성 업데이트 로직
- 마이그레이션 시 필수 비즈니스 규칙

```sql
-- 여기에 추가 기입
```
