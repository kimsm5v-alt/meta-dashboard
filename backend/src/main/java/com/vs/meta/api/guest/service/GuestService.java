package com.vs.meta.api.guest.service;

import com.vs.meta.common.utils.ConvertUtils;
import com.vs.meta.domain.enums.UserStatus;
import com.vs.meta.api.group.mapper.GroupMemberMapper;
import com.vs.meta.api.group.mapper.GroupQueryMapper;
import com.vs.meta.api.guest.mapper.GuestConversionLogMapper;
import com.vs.meta.api.member.mapper.UserMapper;
import com.vs.meta.domain.GuestConversionLog;
import com.vs.meta.domain.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class GuestService {

    private final GroupMemberMapper groupMemberMapper;
    private final GroupQueryMapper groupQueryMapper;
    private final GuestConversionLogMapper guestConversionLogMapper;
    private final UserMapper userMapper;

    @Transactional(readOnly = true)
    public Object findGuestRecordsByEmail(Map<String, Object> paramData) throws Exception {
        String email = (String) paramData.get("email");
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("email은 필수입니다.");
        }
        List<Map<String, Object>> records = groupQueryMapper.findGuestMembersByEmail(email);

        Map<String, Object> result = new HashMap<>();
        result.put("hasGuestRecords", !records.isEmpty());
        result.put("guestRecords", records);
        return result;
    }

    @Transactional
    public Object convertGuestToMember(Map<String, Object> paramData) throws Exception {
        Long userNo = ConvertUtils.toLong(paramData.get("userNo"));
        String email = (String) paramData.get("email");
        String mergeYn = (String) paramData.get("mergeYn");

        if (userNo == null) {
            throw new IllegalArgumentException("userNo는 필수입니다.");
        }
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("email은 필수입니다.");
        }
        if (paramData.get("memberId") == null) {
            throw new IllegalArgumentException("memberId는 필수입니다.");
        }

        if ("Y".equals(mergeYn)) {
            User user = userMapper.findByUserNo(userNo);
            if (user == null || user.getStatus() != UserStatus.ACTIVE) {
                throw new IllegalArgumentException("사용자를 찾을 수 없습니다: userNo=" + userNo);
            }

            if (user.getStdtId() == null) {
                String guestStdtId = (String) paramData.get("guestStdtId");
                user.assignStdtId(guestStdtId);
            }

            userMapper.updateUser(user);
            groupMemberMapper.updateGuestToStudent(email, userNo);
        }

        GuestConversionLog conversionLog = GuestConversionLog.builder()
                .memberId(Long.valueOf(paramData.get("memberId").toString()))
                .guestEmail(email)
                .convertedUserNo(userNo)
                .mergeYn(mergeYn)
                .convertedAt(LocalDateTime.now())
                .build();
        guestConversionLogMapper.insertConversionLog(conversionLog);

        log.info("게스트→회원 전환: userNo={}, email={}, mergeYn={}", userNo, email, mergeYn);
        return paramData;
    }

}
