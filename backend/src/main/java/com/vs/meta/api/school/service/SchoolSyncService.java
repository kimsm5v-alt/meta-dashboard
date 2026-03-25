package com.vs.meta.api.school.service;

import com.vs.meta.api.school.mapper.SchoolInfoMapper;
import com.vs.meta.domain.SchoolInfo;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SchoolSyncService {

    private static final Charset[] SUPPORTED_CHARSETS = new Charset[]{
            StandardCharsets.UTF_8,
            Charset.forName("MS949")
    };

    private final SchoolInfoMapper schoolInfoMapper;

    @Transactional
    public SchoolImportResult importSchools(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("School file is required.");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.isBlank()) {
            filename = "schools.csv";
        }

        List<Map<String, String>> rows = readRows(file.getBytes(), filename);
        return importRows(rows, filename);
    }

    private static final int BATCH_SIZE = 500;

    SchoolImportResult importRows(List<Map<String, String>> rows, String sourceName) {
        int readCount = 0;
        int skippedCount = 0;
        int filteredCount = 0;
        int closedCount = 0;
        List<String> errors = new ArrayList<>();
        List<SchoolInfo> batch = new ArrayList<>(BATCH_SIZE);
        List<String> upsertedCodes = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (Map<String, String> row : rows) {
            readCount++;

            String schoolCode = value(row, "school_code", "\uD45C\uC900\uD559\uAD50\uCF54\uB4DC", "\uD559\uAD50\uCF54\uB4DC", "\uD589\uC815\uD45C\uC900\uCF54\uB4DC", "sd_schul_code");
            String schoolName = value(row, "school_name", "\uD559\uAD50\uBA85", "schul_nm");
            String schoolLevelRaw = value(row, "school_level", "\uD559\uAD50\uAE09", "\uD559\uAD50\uC885\uB958", "\uD559\uAD50\uC885\uB958\uBA85", "\uD559\uAD50\uAD6C\uBD84", "schul_knd_sc_nm");
            String region = value(row, "region", "\uC18C\uC7AC\uC9C0\uBA85", "\uC2DC\uB3C4\uBA85", "lctn_sc_nm");
            String district = value(row, "district", "\uAD00\uD560\uC870\uC9C1\uBA85", "\uAD50\uC721\uC9C0\uC6D0\uCCAD\uBA85", "\uAD50\uC721\uCCAD\uBA85", "ju_org_nm");

            if (isBlank(schoolCode) || isBlank(schoolName)) {
                filteredCount++;
                continue;
            }

            String schoolLevel = normalizeSchoolLevel(schoolLevelRaw);
            if (schoolLevel == null) {
                filteredCount++;
                continue;
            }

            String trimmedCode = schoolCode.trim();
            batch.add(SchoolInfo.builder()
                    .schoolCode(trimmedCode)
                    .schoolName(schoolName.trim())
                    .schoolLevel(schoolLevel)
                    .region(blankToNull(region))
                    .district(blankToNull(district))
                    .status("ACTIVE")
                    .createdBy(0L)
                    .updatedBy(0L)
                    .createdAt(now)
                    .updatedAt(now)
                    .build());
            upsertedCodes.add(trimmedCode);

            if (batch.size() >= BATCH_SIZE) {
                schoolInfoMapper.upsertSchoolBatch(batch);
                batch.clear();
            }
        }

        // 남은 건 처리
        if (!batch.isEmpty()) {
            schoolInfoMapper.upsertSchoolBatch(batch);
        }

        // CSV에 없는 기존 ACTIVE 학교를 CLOSED 처리
        if (!upsertedCodes.isEmpty()) {
            closedCount = schoolInfoMapper.closeSchoolsNotIn(upsertedCodes);
        }

        int upsertedCount = upsertedCodes.size();
        return new SchoolImportResult(sourceName, readCount, upsertedCount, skippedCount, filteredCount, closedCount, errors, schoolInfoMapper.countSchools());
    }

    private List<Map<String, String>> readRows(byte[] bytes, String filename) throws IOException {
        List<Map<String, String>> fallbackRows = null;
        for (Charset charset : SUPPORTED_CHARSETS) {
            List<Map<String, String>> rows = parseDelimited(bytes, charset, detectDelimiter(filename));
            if (!rows.isEmpty() && hasRecognizedHeaders(rows.get(0).keySet())) {
                return rows;
            }
            fallbackRows = rows;
        }

        if (fallbackRows == null || fallbackRows.isEmpty()) {
            throw new IllegalArgumentException("No school rows found in file.");
        }
        throw new IllegalArgumentException("Unsupported file format or unrecognized headers.");
    }

    private List<Map<String, String>> parseDelimited(byte[] bytes, Charset charset, char delimiter) throws IOException {
        List<Map<String, String>> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(new ByteArrayInputStream(bytes), charset))) {
            String headerLine = reader.readLine();
            if (headerLine == null) {
                return rows;
            }

            List<String> headers = parseLine(removeBom(headerLine), delimiter);
            if (headers.isEmpty()) {
                return rows;
            }

            String line;
            while ((line = reader.readLine()) != null) {
                if (line.isBlank()) {
                    continue;
                }

                List<String> values = parseLine(line, delimiter);
                Map<String, String> row = new LinkedHashMap<>();
                for (int i = 0; i < headers.size(); i++) {
                    String header = normalizeHeader(headers.get(i));
                    String value = i < values.size() ? values.get(i).trim() : "";
                    row.put(header, value);
                }
                rows.add(row);
            }
        }

        return rows;
    }

    private List<String> parseLine(String line, char delimiter) {
        List<String> tokens = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        boolean inQuotes = false;

        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);

            if (ch == '"') {
                if (inQuotes && i + 1 < line.length() && line.charAt(i + 1) == '"') {
                    current.append('"');
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
                continue;
            }

            if (ch == delimiter && !inQuotes) {
                tokens.add(current.toString());
                current.setLength(0);
                continue;
            }

            current.append(ch);
        }

        tokens.add(current.toString());
        return tokens;
    }

    private boolean hasRecognizedHeaders(Iterable<String> headers) {
        boolean hasCode = false;
        boolean hasName = false;

        for (String header : headers) {
            if (matches(header, "school_code", "\uD45C\uC900\uD559\uAD50\uCF54\uB4DC", "\uD559\uAD50\uCF54\uB4DC", "\uD589\uC815\uD45C\uC900\uCF54\uB4DC", "sd_schul_code")) {
                hasCode = true;
            }
            if (matches(header, "school_name", "\uD559\uAD50\uBA85", "schul_nm")) {
                hasName = true;
            }
        }

        return hasCode && hasName;
    }

    private boolean matches(String header, String... aliases) {
        String normalized = normalizeHeader(header);
        for (String alias : aliases) {
            if (normalized.equals(normalizeHeader(alias))) {
                return true;
            }
        }
        return false;
    }

    private String value(Map<String, String> row, String... aliases) {
        for (String alias : aliases) {
            String value = row.get(normalizeHeader(alias));
            if (!isBlank(value)) {
                return value;
            }
        }
        return null;
    }

    private String normalizeHeader(String header) {
        if (header == null) {
            return "";
        }
        return removeBom(header)
                .trim()
                .toLowerCase(Locale.ROOT)
                .replace(" ", "")
                .replace("-", "_");
    }

    private String removeBom(String text) {
        if (text != null && !text.isEmpty() && text.charAt(0) == '\uFEFF') {
            return text.substring(1);
        }
        return text;
    }

    private char detectDelimiter(String filename) {
        if (filename != null && filename.toLowerCase(Locale.ROOT).endsWith(".tsv")) {
            return '\t';
        }
        return ',';
    }

    private String normalizeSchoolLevel(String value) {
        if (isBlank(value)) {
            return null;
        }

        String normalized = value.trim().toLowerCase(Locale.ROOT);
        if ("elementary".equals(normalized) || normalized.contains("\uCD08\uB4F1")) {
            return "elementary";
        }
        if ("middle".equals(normalized) || normalized.contains("\uC911\uD559")) {
            return "middle";
        }
        if ("high".equals(normalized) || normalized.contains("\uACE0\uB4F1")) {
            return "high";
        }
        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String blankToNull(String value) {
        if (isBlank(value)) {
            return null;
        }
        return value.trim();
    }

    @Getter
    @RequiredArgsConstructor
    public static class SchoolImportResult {
        private final String sourceName;
        private final int readCount;
        private final int upsertedCount;
        private final int skippedCount;
        private final int filteredCount;
        private final int closedCount;
        private final List<String> errors;
        private final long totalSchoolCount;
    }
}