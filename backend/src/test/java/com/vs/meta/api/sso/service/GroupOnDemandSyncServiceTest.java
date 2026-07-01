package com.vs.meta.api.sso.service;

import com.vs.meta.api.group.mapper.GroupInfoMapper;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.api.sso.client.RpGroupClient;
import com.vs.meta.api.sso.client.SpServiceTokenProvider;
import com.vs.meta.api.sso.client.dto.RpGroupDto;
import com.vs.meta.common.config.GroupSyncProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.transaction.PlatformTransactionManager;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class GroupOnDemandSyncServiceTest {

    @Mock RpGroupClient rpGroupClient;
    @Mock SpServiceTokenProvider tokenProvider;
    @Mock GroupUpsertService upsertService;
    @Mock GroupSyncProperties props;
    @Mock UserMapper userMapper;
    @Mock GroupInfoMapper groupInfoMapper;
    @Mock PlatformTransactionManager txManager;

    GroupOnDemandSyncService service;

    @BeforeEach
    void setUp() {
        when(props.isEnabled()).thenReturn(true);
        service = new GroupOnDemandSyncService(
                rpGroupClient, tokenProvider, upsertService, props, userMapper, groupInfoMapper, txManager);
    }

    @Test
    void 한_그룹_upsert_실패해도_나머지_그룹은_계속_동기화된다() {
        when(rpGroupClient.myStudentGroupIds("bt")).thenReturn(List.of(1L, 2L, 3L));
        when(tokenProvider.getToken(anyString())).thenReturn("svc");
        RpGroupDto rp1 = org.mockito.Mockito.mock(RpGroupDto.class);
        RpGroupDto rp2 = org.mockito.Mockito.mock(RpGroupDto.class);
        RpGroupDto rp3 = org.mockito.Mockito.mock(RpGroupDto.class);
        when(rpGroupClient.detail("svc", 1L)).thenReturn(rp1);
        when(rpGroupClient.detail("svc", 2L)).thenReturn(rp2);
        when(rpGroupClient.detail("svc", 3L)).thenReturn(rp3);
        when(upsertService.upsertGroupFromRp(rp1, true)).thenReturn(1);
        when(upsertService.upsertGroupFromRp(rp2, true)).thenThrow(new RuntimeException("dup"));
        when(upsertService.upsertGroupFromRp(rp3, true)).thenReturn(1);

        assertThatCode(() -> service.syncMyGroups("sp-user", "STUDENT", "bt"))
                .doesNotThrowAnyException();

        verify(upsertService).upsertGroupFromRp(rp1, true);
        verify(upsertService).upsertGroupFromRp(rp2, true);
        verify(upsertService).upsertGroupFromRp(rp3, true);
    }

    @Test
    void 부분_실패해도_디바운스_갱신되어_즉시_재동기화_안함() {
        when(rpGroupClient.myStudentGroupIds("bt")).thenReturn(List.of(1L));
        when(tokenProvider.getToken(anyString())).thenReturn("svc");
        RpGroupDto rp1 = org.mockito.Mockito.mock(RpGroupDto.class);
        when(rpGroupClient.detail("svc", 1L)).thenReturn(rp1);
        when(upsertService.upsertGroupFromRp(rp1, true)).thenThrow(new RuntimeException("dup"));

        service.syncMyGroups("sp-user", "STUDENT", "bt");
        service.syncMyGroups("sp-user", "STUDENT", "bt");

        verify(rpGroupClient, times(1)).myStudentGroupIds("bt");
    }
}
