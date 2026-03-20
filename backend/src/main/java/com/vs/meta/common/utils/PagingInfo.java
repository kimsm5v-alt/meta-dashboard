package com.vs.meta.common.utils;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Builder
@Data
@AllArgsConstructor
public class PagingInfo {
    private Integer size;
    private Long totalElements;
    private Integer totalPages;
    private Integer number;
}
