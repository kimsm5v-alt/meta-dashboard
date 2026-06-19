package com.vs.meta.common.aop;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * QCH 적재 제외 마커.
 *
 * <p>컨트롤러 클래스 또는 메서드에 부착하면 {@code QchTraceAspect} 가 해당 호출을 적재하지 않는다.
 * 적재 부적합한 경우(SSE 스트림, 디버그용 endpoint, dev tester 페이지 등)에 사용.
 *
 * <p>주의: SseEmitter / ResponseBodyEmitter / StreamingResponseBody 리턴 타입은 Aspect 가 자동으로
 * 인식해 skip 하므로 별도 부착 불필요. 그러나 가독성/명시성을 위해 함께 부착해도 무방.
 */
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.METHOD, ElementType.TYPE})
public @interface QchSkip {

    /** 제외 사유(선택) — 코드 리뷰 시 의도 전달용. 동작에는 영향 없음. */
    String reason() default "";
}
