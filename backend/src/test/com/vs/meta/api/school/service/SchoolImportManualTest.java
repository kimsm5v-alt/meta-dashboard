package com.vs.meta.api.school.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("local")
@EnabledIfSystemProperty(named = "meta-api.school.import.run", matches = "true")
class SchoolImportManualTest {

    @Autowired
    private SchoolSyncService schoolSyncService;

    @Test
    void importsSchoolCsvIntoLocalDatabase() throws Exception {
        Path filePath = Files.list(Path.of("data"))
                .filter(Files::isRegularFile)
                .filter(path -> path.getFileName().toString().toLowerCase().endsWith(".csv"))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("data 폴더에 CSV 파일이 없습니다."));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                filePath.getFileName().toString(),
                "text/csv",
                Files.readAllBytes(filePath)
        );

        SchoolSyncService.SchoolImportResult result = schoolSyncService.importSchools(file);

        System.out.println("Imported school file: " + result.getSourceName());
        System.out.println("Read rows: " + result.getReadCount());
        System.out.println("Upserted rows: " + result.getUpsertedCount());
        System.out.println("Skipped rows: " + result.getSkippedCount());
        System.out.println("Total school_info rows: " + result.getTotalSchoolCount());
        if (!result.getErrors().isEmpty()) {
            System.out.println("First errors: " + result.getErrors().stream().limit(20).toList());
        }

        assertThat(result.getReadCount()).isGreaterThan(0);
    }
}