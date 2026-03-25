package com.vs.meta.common.utils;

import lombok.Builder;
import lombok.Data;
import org.springframework.data.domain.Pageable;

@Builder
@Data
public class PagingParam<T> {
    private T param;
    private Pageable pageable;
}
