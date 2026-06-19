package com.vs.meta.api.sso.service;

import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.common.utils.IdGenerator;
import com.vs.meta.common.utils.PiiMasker;
import com.vs.meta.domain.User;
import com.vs.meta.domain.enums.UserStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * 그룹 동기화용 user 행 선제 생성 (group-from-idp 02 §7).
 *
 * <p>mypage 에서 그룹에 합류한 학생(또는 그룹 소유 교사)은 학심정에 로그인한 적 없는 상태로
 * 동기화에 도착할 수 있다. user 행이 없으면 group_member.user_no(FK)·stdt_id 를 채울 수 없어
 * 학급 명단/검사 대상자에서 누락되므로, 가명 식별자 매핑 행을 {@code provisioned='Y'} 로 선제 생성한다.
 *
 * <p>라이프사이클:
 * <ul>
 *   <li>첫 로그인(=동의) 시 {@link SsoUserRegistrationService} 가 기존 행 재사용 + provisioned='N' 전환</li>
 *   <li>멤버십 소멸 시 일간 전체 재동기화가 행 삭제 (보유 근거=멤버십)</li>
 *   <li>통합회원 purge 는 기존 DELETION 폴링 cascade 가 그대로 처리</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SsoUserProvisioningService {

    private final UserMapper userMapper;

    /**
     * sp_user_id 로 user 행 조회, 없으면 선제 생성.
     *
     * <p>호출 측 동기화 TX 에 참여(MANDATORY 아님 — 단독 호출도 허용).
     * 동시 로그인과의 race 로 INSERT 가 UNIQUE 충돌하면 재조회로 흡수.
     *
     * @param spUserId Auth publicUserId (UUID)
     * @param roleCode TEACHER(그룹 소유자) | STUDENT(멤버)
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public User ensureUser(String spUserId, String roleCode) {
        User existing = userMapper.findBySpUserId(spUserId);
        if (existing != null) {
            if (!roleCode.equals(existing.getRoleCode())) {
                // 역할 불일치는 변경하지 않고 로그만 — 로그인 기반 정보가 우선
                log.debug("[GROUP-SYNC] ensureUser 역할 불일치(무변경): spUserId={}, local={}, sync={}",
                        PiiMasker.maskUuid(spUserId), existing.getRoleCode(), roleCode);
            }
            return existing;
        }

        String tcId = IdGenerator.isTeacherRole(roleCode) ? IdGenerator.generateTcId() : null;
        String stdtId = "STUDENT".equals(roleCode) ? IdGenerator.generateStdtId() : null;

        User user = User.builder()
                .spUserId(spUserId)
                .roleCode(roleCode)
                .tcId(tcId)
                .stdtId(stdtId)
                .status(UserStatus.ACTIVE)
                .provisioned("Y")
                .createdBy(0L)
                .updatedBy(0L)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        try {
            userMapper.insertUser(user);
        } catch (org.springframework.dao.DuplicateKeyException e) {
            // 동시 첫 로그인과 race — 그 행을 그대로 사용
            log.info("[GROUP-SYNC] ensureUser INSERT race — 기존 행 재조회: spUserId={}",
                    PiiMasker.maskUuid(spUserId));
            return userMapper.findBySpUserId(spUserId);
        }

        log.info("[GROUP-SYNC] user 선제 생성(provisioned): userNo={}, spUserId={}, roleCode={}",
                user.getUserNo(), PiiMasker.maskUuid(spUserId), roleCode);
        return user;
    }
}
