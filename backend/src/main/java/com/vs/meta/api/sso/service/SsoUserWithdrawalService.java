package com.vs.meta.api.sso.service;

import com.vs.meta.api.group.mapper.GroupInfoMapper;
import com.vs.meta.api.group.mapper.GroupMemberMapper;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.common.utils.PiiMasker;
import com.vs.meta.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * SSO 회원 탈퇴 처리 서비스.
 *
 * <p>탈퇴 정책: <b>탈퇴 = 인격 분리</b>.
 * 옛 user row 는 status=WITHDRAWN + PII 마스킹으로 보존(이력/감사 + audit FK 무결성),
 * 옛 user_no 에 묶인 활성 관계(group_member, host group)는 cascade 로 정리.
 * 업무 기록(상담/메모/생기부/ai_conversation)은 그대로 보존 — 교사가 작성한 기록의 무결성 유지.
 *
 * <p>호출 진입점:
 * <ul>
 *   <li>{@code SsoUserResolveService} — 동일 이메일/다른 sp_user_id 재인입 감지 시</li>
 *   <li>(추후) IdP 탈퇴자 폴링 스케줄러 — IdP 가 제공하는 탈퇴 회원 목록 cascade</li>
 * </ul>
 *
 * <p>단일 트랜잭션 — 부분 성공으로 인한 정합성 깨짐 방지.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SsoUserWithdrawalService {

    private final UserMapper userMapper;
    private final GroupMemberMapper groupMemberMapper;
    private final GroupInfoMapper groupInfoMapper;

    /**
     * 학심정 user 탈퇴 처리.
     *
     * @param user   탈퇴 처리 대상 (이미 조회된 도메인 객체)
     * @param reason 탈퇴 사유 — 로그 추적용 (예: "SSO_REJOIN", "IDP_POLL")
     */
    @Transactional
    public void withdraw(User user, String reason) {
        if (user == null || user.getUserNo() == null) return;

        Long userNo = user.getUserNo();
        String maskedSpUserId = PiiMasker.maskUuid(user.getSpUserId());

        int userRows = userMapper.markWithdrawn(userNo);
        int memberRows = groupMemberMapper.withdrawByUserNo(userNo);
        int hostGroupRows = groupInfoMapper.deactivateByHostUserNo(userNo);

        log.info("SSO 탈퇴 처리 완료: userNo={}, spUserId={}, reason={}, userRows={}, memberRows={}, hostGroupRows={}",
                userNo, maskedSpUserId, reason, userRows, memberRows, hostGroupRows);
    }
}
