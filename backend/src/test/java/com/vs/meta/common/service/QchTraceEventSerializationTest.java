package com.vs.meta.common.service;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * QchTraceEvent 직렬화 계약 테스트.
 *
 * <p>QCH ingest 는 JSON 키 {@code "isError"}/{@code "logType"} 를 읽는다. Lombok Boolean 게터
 * 명명(getIsError) + Jackson 3(tools.jackson, WebClient 기본 코덱) 조합에서 키가 {@code "error"}
 * 로 잘못 나가면 QCH 가 필드를 못 읽어 statusCode>=400 폴백(에러 오분류)으로 되돌아간다.
 * 이 테스트가 그 회귀를 막는다.
 */
class QchTraceEventSerializationTest {

    private static final JsonMapper MAPPER = JsonMapper.builder().build();

    @Test
    @DisplayName("isError/logType 이 정확한 JSON 키로 직렬화된다 (401=WARN, isError=false)")
    void serializesIsErrorAndLogTypeWithExactKeys() {
        QchTraceEvent event = QchTraceEvent.builder()
                .serviceKey("meta-api")
                .method("POST")
                .endpoint("/api/v1/auth/token")
                .statusCode(401)
                .logType("WARN")
                .isError(false)
                .build();

        String json = MAPPER.writeValueAsString(event);

        assertThat(json).contains("\"logType\":\"WARN\"");
        assertThat(json).contains("\"isError\":false");
        // 잘못된 키로 새지 않는지 — Jackson 이 is-prefix boolean 을 "error" 로 낮추는 함정 방지.
        assertThat(json).doesNotContain("\"error\":");
    }
}
