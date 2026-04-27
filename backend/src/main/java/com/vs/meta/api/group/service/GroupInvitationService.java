package com.vs.meta.api.group.service;

import com.vs.meta.api.group.mapper.GroupInfoMapper;
import com.vs.meta.api.group.mapper.GroupInvitationMapper;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.api.notification.event.GroupInvitedEvent;
import com.vs.meta.common.utils.NcpMailSender;
import com.vs.meta.domain.GroupInfo;
import com.vs.meta.domain.GroupInvitation;
import com.vs.meta.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupInvitationService {

    private final GroupInvitationMapper groupInvitationMapper;
    private final GroupInfoMapper groupInfoMapper;
    private final UserMapper userMapper;
    private final NcpMailSender ncpMailSender;
    private final ApplicationEventPublisher eventPublisher;

    private static final int INVITATION_EXPIRE_DAYS = 7;

    /**
     * 이메일 초대 발송
     */
    @Transactional
    public Map<String, Object> sendInvitation(String claId, String email, Long userNo) {
        if (claId == null || claId.isBlank()) {
            throw new IllegalArgumentException("claId는 필수입니다.");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("이메일은 필수입니다.");
        }

        GroupInfo groupInfo = groupInfoMapper.findByClaId(claId);
        if (groupInfo == null || !"Y".equals(groupInfo.getUseYn())) {
            throw new IllegalArgumentException("그룹을 찾을 수 없습니다: claId=" + claId);
        }
        if (!groupInfo.getHostUserNo().equals(userNo)) {
            throw new IllegalStateException("초대 권한이 없습니다. 방장만 초대할 수 있습니다.");
        }

        Long groupId = groupInfo.getGroupId();

        // 중복 초대 체크 (같은 그룹+이메일, SENT 상태)
        GroupInvitation existing = groupInvitationMapper.findByGroupIdAndEmailAndStatus(groupId, email, "SENT");
        if (existing != null && !existing.isExpired()) {
            throw new IllegalArgumentException("이미 초대가 발송된 이메일입니다: " + email);
        }

        LocalDateTime now = LocalDateTime.now();
        GroupInvitation invitation = GroupInvitation.builder()
                .groupId(groupId)
                .email(email)
                .inviteCode(groupInfo.getInviteCode())
                .status("SENT")
                .sentBy(userNo)
                .sentAt(now)
                .expiresAt(now.plusDays(INVITATION_EXPIRE_DAYS))
                .createdBy(userNo)
                .updatedBy(userNo)
                .createdAt(now)
                .updatedAt(now)
                .build();
        groupInvitationMapper.insertInvitation(invitation);

        // 메일 발송
        ncpMailSender.sendGroupInvitation(email, groupInfo.getGroupNm(), groupInfo.getInviteCode());

        log.info("그룹 초대 발송: groupId={}, email={}, by={}", groupId, email, userNo);

        // S4: 해당 이메일의 기존 회원이 있으면 인앱 알림 발행 (미가입자는 이메일만)
        User invitee = userMapper.findByEmail(email);
        if (invitee != null && invitee.getUserNo() != null) {
            eventPublisher.publishEvent(new GroupInvitedEvent(
                    invitee.getUserNo(),
                    groupInfo.getGroupNm(),
                    groupInfo.getInviteCode()
            ));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("invitationId", invitation.getId());
        result.put("groupId", groupId);
        result.put("email", email);
        result.put("status", invitation.getStatus());
        result.put("sentAt", invitation.getSentAt());
        return result;
    }

    /**
     * 초대 목록 조회
     */
    @Transactional
    public List<Map<String, Object>> getInvitationList(String claId, Long userNo) {
        GroupInfo groupInfo = groupInfoMapper.findByClaId(claId);
        if (groupInfo == null || !"Y".equals(groupInfo.getUseYn())) {
            throw new IllegalArgumentException("그룹을 찾을 수 없습니다: claId=" + claId);
        }
        if (!groupInfo.getHostUserNo().equals(userNo)) {
            throw new IllegalStateException("조회 권한이 없습니다. 방장만 조회할 수 있습니다.");
        }

        Long groupId = groupInfo.getGroupId();

        // 만료 건 자동 처리
        groupInvitationMapper.expireOverdue();

        List<GroupInvitation> invitations = groupInvitationMapper.findByGroupId(groupId);
        return invitations.stream().map(inv -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", inv.getId());
            map.put("groupId", inv.getGroupId());
            map.put("email", inv.getEmail());
            map.put("status", inv.getStatus());
            map.put("sentAt", inv.getSentAt());
            return map;
        }).collect(Collectors.toList());
    }

    /**
     * 초대 취소
     */
    @Transactional
    public void cancelInvitation(Long invitationId, Long userNo) {
        GroupInvitation invitation = groupInvitationMapper.findById(invitationId);
        if (invitation == null) {
            throw new IllegalArgumentException("초대를 찾을 수 없습니다: id=" + invitationId);
        }

        GroupInfo groupInfo = groupInfoMapper.findGroupInfoById(invitation.getGroupId());
        if (groupInfo == null || !groupInfo.getHostUserNo().equals(userNo)) {
            throw new IllegalStateException("취소 권한이 없습니다. 방장만 취소할 수 있습니다.");
        }

        if (!"SENT".equals(invitation.getStatus())) {
            throw new IllegalStateException("발송 상태의 초대만 취소할 수 있습니다. 현재 상태: " + invitation.getStatus());
        }

        groupInvitationMapper.updateStatus(invitationId, "CANCELLED", userNo);
        log.info("그룹 초대 취소: invitationId={}, by={}", invitationId, userNo);
    }
}
