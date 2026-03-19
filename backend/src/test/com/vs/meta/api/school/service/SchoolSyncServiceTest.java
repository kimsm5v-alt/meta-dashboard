package com.vs.meta.api.school.service;

import com.vs.meta.api.school.mapper.SchoolInfoMapper;
import com.vs.meta.domain.SchoolInfo;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SchoolSyncServiceTest {

    @Mock
    private SchoolInfoMapper schoolInfoMapper;

    @InjectMocks
    private SchoolSyncService schoolSyncService;

    @Test
    void importSchools_parsesNeisCsvAndUpsertsSupportedSchoolLevels() throws Exception {
        String csv = String.join("\n",
                "SD_SCHUL_CODE,SCHUL_NM,SCHUL_KND_SC_NM,LCTN_SC_NM,JU_ORG_NM",
                "7010569,School Elementary,elementary,Seoul,District A",
                "7020569,School Middle,middle,Seoul,District B",
                "7030569,School Kinder,kindergarten,Seoul,District C");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "schools.csv",
                "text/csv",
                csv.getBytes()
        );

        when(schoolInfoMapper.countSchools()).thenReturn(2L);

        SchoolSyncService.SchoolImportResult result = schoolSyncService.importSchools(file);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<SchoolInfo>> captor = ArgumentCaptor.forClass(List.class);
        verify(schoolInfoMapper).upsertSchoolBatch(captor.capture());

        List<SchoolInfo> batch = captor.getValue();
        assertThat(batch)
                .extracting(SchoolInfo::getSchoolCode, SchoolInfo::getSchoolLevel)
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple("7010569", "elementary"),
                        org.assertj.core.groups.Tuple.tuple("7020569", "middle")
                );

        assertThat(result.getSourceName()).isEqualTo("schools.csv");
        assertThat(result.getReadCount()).isEqualTo(3);
        assertThat(result.getUpsertedCount()).isEqualTo(2);
        assertThat(result.getSkippedCount()).isEqualTo(0);
        assertThat(result.getTotalSchoolCount()).isEqualTo(2L);
    }

    @Test
    void importSchools_rejectsFileWithoutRecognizedHeaders() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "schools.csv",
                "text/csv",
                "foo,bar\n1,2".getBytes()
        );

        assertThatThrownBy(() -> schoolSyncService.importSchools(file))
                .isInstanceOf(IllegalArgumentException.class);

        verify(schoolInfoMapper, never()).upsertSchoolBatch(anyList());
    }
}
