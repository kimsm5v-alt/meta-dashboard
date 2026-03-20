package com.vs.meta.api.group.service;

import com.vs.meta.api.group.mapper.GroupInfoMapper;
import com.vs.meta.api.group.mapper.GroupMemberMapper;
import com.vs.meta.api.group.mapper.GroupQueryMapper;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.api.member.service.EmailVerificationService;
import com.vs.meta.api.member.service.MemberService;
import com.vs.meta.domain.GroupInfo;
import com.vs.meta.domain.GroupMember;
import com.vs.meta.domain.User;
import com.vs.meta.domain.enums.MemberStatus;
import com.vs.meta.domain.enums.MemberType;
import com.vs.meta.domain.enums.UserStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GroupServiceTest {

    @Mock
    private GroupInfoMapper groupInfoMapper;

    @Mock
    private GroupMemberMapper groupMemberMapper;

    @Mock
    private GroupQueryMapper groupQueryMapper;

    @Mock
    private UserMapper userMapper;

    @Mock
    private MemberService memberService;

    @Mock
    private EmailVerificationService emailVerificationService;

    @InjectMocks
    private GroupService groupService;

    @Test
    void createGroup_assignsTcIdForFirstHostAndCreatesGroup() throws Exception {
        Map<String, Object> paramData = new LinkedHashMap<>();
        paramData.put("userNo", 1L);
        paramData.put("groupNm", "6-2");
        paramData.put("schoolLevel", "elementary");
        paramData.put("grade", "6");
        paramData.put("classNumber", 2);
        paramData.put("schoolName", "Meta");

        User host = User.builder()
                .userNo(1L)
                .email("teacher1@test.com")
                .nickname("Teacher")
                .status(UserStatus.ACTIVE)
                .build();

        when(userMapper.findByUserNo(1L)).thenReturn(host);

        Object result = groupService.createGroup(paramData);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        ArgumentCaptor<GroupInfo> groupCaptor = ArgumentCaptor.forClass(GroupInfo.class);
        verify(userMapper).updateUser(userCaptor.capture());
        verify(groupInfoMapper).insertGroupInfo(groupCaptor.capture());

        User updatedHost = userCaptor.getValue();
        GroupInfo savedGroup = groupCaptor.getValue();

        assertThat(updatedHost.getTcId()).hasSize(32).matches("[a-f0-9]{32}");
        assertThat(savedGroup.getClaId()).hasSize(32).matches("[a-f0-9]{32}");
        assertThat(savedGroup.getHostUserNo()).isEqualTo(1L);
        assertThat(savedGroup.getUseYn()).isEqualTo("Y");
        assertThat(savedGroup.getMaxMemberCount()).isEqualTo(40);
        assertThat(savedGroup.getInviteCode()).hasSize(6).matches("[A-Z0-9]{6}");
        assertThat(savedGroup.getCreatedBy()).isEqualTo(1L);

        @SuppressWarnings("unchecked")
        Map<String, Object> resultMap = (Map<String, Object>) result;
        assertThat(resultMap).containsKey("claId").containsKey("inviteCode");
    }

    @Test
    void joinGroupAsPlayer_assignsStudentIdAndInsertsActiveMember() throws Exception {
        Map<String, Object> paramData = new LinkedHashMap<>();
        paramData.put("userNo", 2L);
        paramData.put("inviteCode", "abc123");

        User player = User.builder()
                .userNo(2L)
                .email("student1@test.com")
                .nickname("Player")
                .status(UserStatus.ACTIVE)
                .build();
        GroupInfo groupInfo = GroupInfo.builder()
                .groupId(10L)
                .inviteCode("ABC123")
                .maxMemberCount(40)
                .useYn("Y")
                .build();

        when(userMapper.findByUserNo(2L)).thenReturn(player);
        when(groupInfoMapper.findByInviteCodeAndUseYnForUpdate("ABC123", "Y")).thenReturn(groupInfo);
        when(groupMemberMapper.countByGroupIdAndStatus(10L, MemberStatus.ACTIVE.name())).thenReturn(5L);
        when(groupMemberMapper.findMaxMemberNoByGroupId(10L)).thenReturn(5);
        doAnswer(invocation -> {
            GroupMember member = invocation.getArgument(0);
            member.setId(77L);
            return null;
        }).when(groupMemberMapper).insertGroupMember(any(GroupMember.class));

        Object result = groupService.joinGroupAsPlayer(paramData);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        ArgumentCaptor<GroupMember> memberCaptor = ArgumentCaptor.forClass(GroupMember.class);
        verify(userMapper).updateUser(userCaptor.capture());
        verify(groupMemberMapper).insertGroupMember(memberCaptor.capture());

        assertThat(userCaptor.getValue().getStdtId()).hasSize(32).matches("[a-f0-9]{32}");
        assertThat(memberCaptor.getValue().getMemberType()).isEqualTo(MemberType.STUDENT);
        assertThat(memberCaptor.getValue().getStatus()).isEqualTo(MemberStatus.ACTIVE);
        assertThat(memberCaptor.getValue().getUserNo()).isEqualTo(2L);
        assertThat(memberCaptor.getValue().getStdtId()).hasSize(32).matches("[a-f0-9]{32}");
        assertThat(memberCaptor.getValue().getMemberNo()).isEqualTo(6);
        assertThat(memberCaptor.getValue().getCreatedBy()).isEqualTo(2L);

        @SuppressWarnings("unchecked")
        Map<String, Object> resultMap = (Map<String, Object>) result;
        assertThat(resultMap).containsKey("stdtId").containsEntry("memberId", 77L);
    }

    @Test
    void joinGroupAsPlayer_rejectsWhenGroupCapacityIsFull() {
        Map<String, Object> paramData = new LinkedHashMap<>();
        paramData.put("userNo", 2L);
        paramData.put("inviteCode", "ABC123");

        User player = User.builder()
                .userNo(2L)
                .email("student1@test.com")
                .status(UserStatus.ACTIVE)
                .build();
        GroupInfo groupInfo = GroupInfo.builder()
                .groupId(10L)
                .inviteCode("ABC123")
                .maxMemberCount(2)
                .useYn("Y")
                .build();

        when(userMapper.findByUserNo(2L)).thenReturn(player);
        when(groupInfoMapper.findByInviteCodeAndUseYnForUpdate("ABC123", "Y")).thenReturn(groupInfo);
        when(groupMemberMapper.countByGroupIdAndStatus(10L, MemberStatus.ACTIVE.name())).thenReturn(2L);

        assertThatThrownBy(() -> groupService.joinGroupAsPlayer(paramData))
                .isInstanceOf(IllegalStateException.class);

        verify(groupMemberMapper, never()).insertGroupMember(any(GroupMember.class));
    }

    @Test
    void joinGroupAsGuest_requiresVerifiedEmailAndConsumesVerificationAfterJoin() throws Exception {
        Map<String, Object> paramData = new LinkedHashMap<>();
        paramData.put("email", "guest@test.com");
        paramData.put("inviteCode", "abc123");
        paramData.put("nickname", "Guest");
        paramData.put("gender", "M");

        GroupInfo groupInfo = GroupInfo.builder()
                .groupId(10L)
                .inviteCode("ABC123")
                .maxMemberCount(40)
                .useYn("Y")
                .build();

        when(emailVerificationService.isVerified("guest@test.com")).thenReturn(true);
        when(groupInfoMapper.findByInviteCodeAndUseYnForUpdate("ABC123", "Y")).thenReturn(groupInfo);
        when(groupMemberMapper.countByGroupIdAndStatus(10L, MemberStatus.ACTIVE.name())).thenReturn(4L);
        when(groupMemberMapper.findMaxMemberNoByGroupId(10L)).thenReturn(4);
        doAnswer(invocation -> {
            GroupMember member = invocation.getArgument(0);
            member.setId(88L);
            return null;
        }).when(groupMemberMapper).insertGroupMember(any(GroupMember.class));

        Object result = groupService.joinGroupAsGuest(paramData);

        ArgumentCaptor<GroupMember> memberCaptor = ArgumentCaptor.forClass(GroupMember.class);
        verify(groupMemberMapper).insertGroupMember(memberCaptor.capture());
        verify(emailVerificationService).consumeVerification("guest@test.com");

        GroupMember savedMember = memberCaptor.getValue();
        assertThat(savedMember.getMemberType()).isEqualTo(MemberType.GUEST);
        assertThat(savedMember.getStatus()).isEqualTo(MemberStatus.ACTIVE);
        assertThat(savedMember.getUserNo()).isNull();
        assertThat(savedMember.getEmail()).isEqualTo("guest@test.com");
        assertThat(savedMember.getGender()).isEqualTo("M");
        assertThat(savedMember.getStdtId()).hasSize(32).matches("[a-f0-9]{32}");
        assertThat(savedMember.getMemberNo()).isEqualTo(5);
        assertThat(savedMember.getCreatedBy()).isEqualTo(0L);

        @SuppressWarnings("unchecked")
        Map<String, Object> resultMap = (Map<String, Object>) result;
        assertThat(resultMap).containsKey("stdtId").containsEntry("memberId", 88L);
    }
}
