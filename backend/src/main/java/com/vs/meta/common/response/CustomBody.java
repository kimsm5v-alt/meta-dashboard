package com.vs.meta.common.response;

public record CustomBody(
        boolean success,
        int resultCode,
        Object paramData,
        Object resultData,
        String resultMessage,
        String sTime,
        String eTime,
        String currentTime,
        String hash
) {
}
