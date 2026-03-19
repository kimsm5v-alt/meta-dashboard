package com.vs.meta.common.response;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonUnwrapped;
import org.springframework.http.HttpStatus;

import java.util.LinkedHashMap;
import java.util.Map;

public class ResponseDTO<T> {

    @JsonIgnore
    private final Map<String, String> headers;

    @JsonUnwrapped
    private final T body;

    public ResponseDTO(Map<String, String> headers, T body) {
        this.headers = headers == null ? Map.of() : Map.copyOf(headers);
        this.body = body;
    }

    public Map<String, String> getHeaders() {
        return headers;
    }

    public T getBody() {
        return body;
    }

    public static HeaderBuilder of() {
        return new HeaderBuilder();
    }

    public static class HeaderBuilder {
        private final Map<String, String> headers = new LinkedHashMap<>();

        public HeaderBuilder header(Map<String, String> headers) {
            if (headers != null) {
                this.headers.putAll(headers);
            }
            return this;
        }

        public BodyBuilder success() {
            return new BodyBuilder(headers, true);
        }

        public BodyBuilder fail() {
            return new BodyBuilder(headers, false);
        }
    }

    public static class BodyBuilder {
        private final Map<String, String> headers;
        private final boolean success;
        private int resultCode;
        private Object paramData;
        private Object resultData;
        private String resultMessage;
        private String sTime;
        private String eTime;
        private String currentTime;
        private String hash;

        public BodyBuilder(Map<String, String> headers, boolean success) {
            this.headers = new LinkedHashMap<>(headers);
            this.success = success;
            this.resultCode = success ? HttpStatus.OK.value() : HttpStatus.BAD_REQUEST.value();
        }

        public BodyBuilder resultCode(HttpStatus status) {
            this.resultCode = status.value();
            return this;
        }

        public BodyBuilder resultCode(int statusCode) {
            this.resultCode = statusCode;
            return this;
        }

        public BodyBuilder paramData(Object paramData) {
            this.paramData = paramData;
            return this;
        }

        public BodyBuilder resultData(Object resultData) {
            this.resultData = resultData;
            return this;
        }

        public BodyBuilder resultMessage(String resultMessage) {
            this.resultMessage = resultMessage;
            return this;
        }

        public BodyBuilder sTime(String sTime) {
            this.sTime = sTime;
            return this;
        }

        public BodyBuilder eTime(String eTime) {
            this.eTime = eTime;
            return this;
        }

        public BodyBuilder currentTime(String currentTime) {
            this.currentTime = currentTime;
            return this;
        }

        public BodyBuilder hash(String hash) {
            this.hash = hash;
            return this;
        }

        public ResponseDTO<CustomBody> build() {
            return new ResponseDTO<>(
                    headers,
                    new CustomBody(success, resultCode, paramData, resultData, resultMessage, sTime, eTime, currentTime, hash)
            );
        }
    }
}
