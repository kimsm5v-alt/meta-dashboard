package com.vs.meta.common.response;

import com.vs.meta.common.utils.PagingInfo;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;

public final class AidtCommonUtil {

    private AidtCommonUtil() {
    }

    public static ResponseDTO<CustomBody> makeResultSuccess(Object paramData, Object resultData, String resultMessage) {
        return ResponseDTO.of()
                .success()
                .resultCode(HttpStatus.OK)
                .paramData(paramData)
                .resultData(resultData)
                .resultMessage(resultMessage)
                .build();
    }

    public static ResponseDTO<CustomBody> makeResultFail(Object paramData, Object resultData, String resultMessage) {
        return ResponseDTO.of()
                .fail()
                .resultCode(resolveStatusCode(resultData))
                .paramData(paramData)
                .resultData(resultData)
                .resultMessage(resultMessage)
                .build();
    }

    public static PagingInfo ofPageInfo(List<?> resultList, Pageable pageable, long total) {
        return PagingInfo.builder()
                .size(pageable.getPageSize())
                .totalElements(total)
                .totalPages((int) Math.ceil((double) total / pageable.getPageSize()))
                .number(pageable.getPageNumber())
                .build();
    }

    private static int resolveStatusCode(Object resultData) {
        if (resultData instanceof Map<?, ?> map) {
            Object code = map.get("code");
            if (code instanceof Number number) {
                return number.intValue();
            }
            if (code instanceof String text) {
                try {
                    return Integer.parseInt(text);
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return HttpStatus.BAD_REQUEST.value();
    }
}
