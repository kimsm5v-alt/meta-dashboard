> [!IMPORTANT]
> **⚠️ 수동 검토 권장 (자가힐링 주의)**
>
> AI 자가힐링 결과물이 실제 의도와 다를 수 있으므로, **상세 리뷰 내용에 기반한 수동 점검**을 우선해 주시기 바랍니다. 자가힐링 기능을 활용하실 경우 최종 결과물을 신중하게 확인해 주세요.

# 코드 리뷰 - 2d51e4bf

## 코드 복잡도 분석

**분석된 파일**: 5개 / 변경된 파일: 5개


### 정상 범위 (NONE)


**`groupquerymapper.xml`** (other)

- 평균 복잡도: **0.239**

- 최대 복잡도: 0.471

- 청크 수: 2개

- 평균 사용처: 7.0곳


**권장사항:**

- 복잡도 정상 범위


**`groupservice.java`** (other)

- 평균 복잡도: **0.237**

- 최대 복잡도: 0.471

- 청크 수: 4개

- 평균 사용처: 18.8곳


**권장사항:**

- 복잡도 정상 범위


**`groupquerymapper.java`** (other)

- 평균 복잡도: **0.144**

- 최대 복잡도: 0.461

- 청크 수: 16개

- 평균 사용처: 11.2곳


**권장사항:**

- 복잡도 정상 범위


**`apiclient.ts`** (other)

- 평균 복잡도: **0.003**

- 최대 복잡도: 0.009

- 청크 수: 12개


**권장사항:**

- 복잡도 정상 범위


**`useprofilecheck.ts`** (other)

- 평균 복잡도: **0.002**

- 최대 복잡도: 0.008

- 청크 수: 6개


**권장사항:**

- 복잡도 정상 범위


---


## [STATUS] 심각도별 이슈 요약

### Critical (즉시 수정 필요)
- **코드/커밋 메시지 불일치**: RefreshToken 관련 파일이 커밋 메시지에는 삭제되었다고 명시되었지만 실제 파일 시스템에 존재함

### High (우선 수정 권장)
- **백엔드 호환성 문제**: GroupQueryMapper 인터페이스 시그니처 변경으로 인한 기존 코드 호환성 위험
- **타입 안정성 부재**: Map<String, Object> 반환 타입으로 인한 런타임 타입 캐스팅 위험

### Medium (개선 권장)
- **보안 검증 누락**: useProfileCheck 훅의 AuthContext 업데이트 시 인증 상태 재검증 부재
- **에러 처리 미흡**: 토큰 검색 실패 시 명확한 에러 핸들링 부재

### Low (참고 사항)
- **코드 중복 가능성**: myRole 계산 로직이 SQL과 Java 양쪽에 분산될 가능성
- **토큰 키 관리 복잡성**: 여러 키 순차 확인으로 인한 디버깅 어려움 증가

## 변경사항 요약
이 커밋은 SSO 통합 과정에서 그룹 상세 조회 기능을 개선하고 프론트엔드-백엔드 간 호환성을 높이는 수정사항을 포함합니다. 주요 변경사항은 1) 그룹 상세 조회 시 사용자의 역할(myRole)을 백엔드에서 계산하여 반환, 2) 프론트엔드의 토큰 관리 로직을 SSO SDK와 호환되게 확장, 3) 사용자 프로필 상태 확인 시 AuthContext 동기화 기능 추가입니다.

## 파일별 상세 분석

### backend/src/main/java/com/vs/meta/api/group/mapper/GroupQueryMapper.java
**변경 내용:**
- `findGroupDetail` 메서드 시그니처 변경: `Long groupId` → `@Param("groupId") Long groupId, @Param("userNo") Long userNo`

**[PROBLEM] 발견된 문제:**
1. **[호환성 위험]**: 인터페이스 시그니처 변경으로 인한 컴파일 오류 위험
   - **위치 (라인 번호)**: 라인 15
   - **기존 코드**: `Map<String, Object> findGroupDetail(@Param("groupId") Long groupId);`
   - **해결 방안 (수정 코드)**: 
   ```java
   // 기존 메서드를 오버로딩하여 호환성 유지
   Map<String, Object> findGroupDetail(@Param("groupId") Long groupId);
   Map<String, Object> findGroupDetailWithRole(@Param("groupId") Long groupId, @Param("userNo") Long userNo);
   ```
   - **위험도**: High
   - **영향**: 이 인터페이스를 사용하는 모든 컴포넌트가 즉시 컴파일 실패할 위험이 있음

2. **[타입 안정성]**: Map<String, Object> 반환 타입의 런타임 위험
   - **위치 (라인 번호)**: 라인 15
   - **기존 코드**: `Map<String, Object> findGroupDetail(@Param("groupId") Long groupId, @Param("userNo") Long userNo);`
   - **해결 방안 (수정 코드)**:
   ```java
   @Data
   public class GroupDetailDTO {
       private Long groupId;
       private String title;
       private String description;
       private Integer maxMemberCount;
       private String useYn;
       private LocalDateTime createdAt;
       private String hostNickname;
       private String myRole; // "HOST" 또는 "STUDENT"
   }
   
   GroupDetailDTO findGroupDetail(@Param("groupId") Long groupId, @Param("userNo") Long userNo);
   ```
   - **위험도**: Medium
   - **영향**: 타입 캐스팅 시 ClassCastException 발생 가능, 컴파일 타임 타입 검증 불가

### backend/src/main/resources/mapper/group/GroupQueryMapper.xml
**변경 내용:**
- SQL 쿼리에 `myRole` 컬럼 추가: `CASE WHEN gi.host_user_no = #{userNo} THEN 'HOST' ELSE 'STUDENT' END AS myRole`

**[GOOD] 잘된 점:**
- 역할 판단 로직을 데이터베이스 레벨에서 처리하여 성능 최적화
- 명확한 역할 값("HOST"/"STUDENT")으로 일관된 인터페이스 제공

### frontend/src/shared/hooks/useProfileCheck.ts
**변경 내용:**
- `useAuth` 훅 추가 import 및 사용
- 프로필 상태 확인 응답에 `userNo`, `roleCode` 등 추가 데이터 처리
- `updateUser`를 통한 AuthContext 동기화 로직 추가

**[PROBLEM] 발견된 문제:**
1. **[보안 검증]**: 인증되지 않은 상태에서 AuthContext 업데이트 가능성
   - **위치 (라인 번호)**: 라인 47-55
   - **기존 코드**:
   ```typescript
   if (data.registered && data.userNo) {
     updateUser({
       id: String(data.userNo),
       roleCode: data.roleCode,
       tcId: data.tcId ?? undefined,
       stdtId: data.stdtId ?? undefined,
     });
   }
   ```
   - **해결 방안 (수정 코드)**:
   ```typescript
   if (data.registered && data.userNo && isAuthenticated) {
     // 추가적으로 JWT 토큰 유효성 검증
     const token = getAuthTokens()?.authToken;
     if (token && validateToken(token)) {
       updateUser({
         id: String(data.userNo),
         roleCode: data.roleCode,
         tcId: data.tcId ?? undefined,
         stdtId: data.stdtId ?? undefined,
       });
     }
   }
   ```
   - **위험도**: Medium
   - **영향**: 인증되지 않은 사용자 또는 만료된 토큰으로 권한 상승 가능

### frontend/src/shared/services/apiClient.ts
**변경 내용:**
- 토큰 키 상수 배열화: `AUTH_TOKEN_KEYS = ['accessToken', 'auth_token']`
- `findToken` 헬퍼 함수 추가로 다중 키 순차 검색 구현

**[PROBLEM] 발견된 문제:**
1. **[토큰 우선순위]**: 키 검색 순서에 따른 보안 취약점
   - **위치 (라인 번호)**: 라인 18-24
   - **기존 코드**:
   ```typescript
   function findToken(keys: string[]): string | null {
     for (const key of keys) {
       const val = localStorage.getItem(key);
       if (val) return val;
     }
     return null;
   }
   ```
   - **해결 방안 (수정 코드)**:
   ```typescript
   function findToken(keys: string[]): string | null {
     // SSO SDK 토큰 우선, 레거시 토큰은 검증 후 사용
     for (const key of keys) {
       const val = localStorage.getItem(key);
       if (val) {
         if (key === 'accessToken' && !isValidSSOToken(val)) {
           continue; // 유효하지 않은 SSO 토큰은 스킵
         }
         return val;
       }
     }
     return null;
   }
   ```
   - **위험도**: Medium
   - **영향**: 만료되었거나 유효하지 않은 토큰이 우선적으로 사용될 수 있음

## 보안 분석
**발견된 보안 취약점:**
1. **인증 상태 검증 누락**
   - **공격 시나리오**: SSO 로그인 후 백엔드 API를 직접 호출하여 권한 없는 사용자 정보로 AuthContext 업데이트 시도
   - **수정 방법**: `useProfileCheck` 훅에서 AuthContext 업데이트 전에 현재 세션 토큰의 유효성을 재검증

2. **토큰 키 순차 검색 취약점**
   - **공격 시나리오**: localStorage에 'accessToken' 키로 악성 토큰 주입 시 우선적으로 사용됨
   - **수정 방법**: 토큰 검색 시 키별 우선순위와 유효성 검증 로직 추가

**보안 체크리스트:**
- [ ] 인증/인가 검증: 부분적 구현 (추가 검증 필요)
- [✓] 입력 검증 및 Sanitization: SQL 파라미터 바인딩 사용
- [✓] 민감 정보 보호: 토큰 localStorage 저장
- [ ] HTTPS/암호화 사용: 환경변수 의존적

## 버그 가능성 분석
**잠재적 버그:**
1. **컴파일 타임 오류**
   - **재현 조건**: GroupQueryMapper를 직접 참조하는 다른 컴포넌트 존재 시
   - **예상 결과**: `java.lang.NoSuchMethodError` 또는 컴파일 실패
   - **수정 방법**: 오버로딩 메서드 추가 또는 점진적 마이그레이션

2. **런타임 타입 캐스팅 오류**
   - **재현 조건**: SQL 쿼리 결과 컬럼명 변경 또는 타입 불일치 시
   - **예상 결과**: `java.lang.ClassCastException`
   - **수정 방법**: DTO 클래스 도입으로 타입 안정성 확보

**Edge Case 검증:**
- [✓] Null/Undefined 처리: `userNo` null 처리 구현됨
- [ ] 빈 배열/객체 처리: 그룹 멤버 리스트 빈 경우 검증 필요
- [ ] 경계값 (0, 음수, 최대값): `userNo` 음수값 검증 부재
- [✓] 동시성 문제: React 훅 내 취소 메커니즘 구현됨

## 성능 분석
**성능 이슈:**
1. **SQL 쿼리 복잡도 증가**
   - **영향**: 미미한 성능 저하 (CASE 문 추가)
   - **개선 방법**: `host_user_no` 컬럼에 인덱스 존재 여부 확인 및 필요 시 추가

**성능 체크리스트:**
- [✓] 불필요한 연산 제거: 역할 계산을 DB 레벨로 이동
- [ ] 캐싱 활용: 그룹 정보 캐싱 고려 가능
- [✓] 비동기 처리: React 훅 내 비동기 API 호출
- [✓] 메모리 효율성: 컴포넌트 언마운트 시 정리 로직 존재

## 코드 품질 평가
- **가독성**: 8/10 - 명확한 변수명과 주석 사용, but 타입 정보 부족
- **유지보수성**: 7/10 - 확장성 있으나 호환성 문제 존재
- **테스트 커버리지**: 평가 불가 - 테스트 파일 미제공
- **문서화**: 6/10 - 기본적인 주석 존재, but API 변경사항 문서화 부재

---

## 개선 제안 (우선순위별)

### 필수 (Must Fix)
1. **RefreshToken 파일 실제 삭체**: 커밋 메시지와 실제 코드 상태 불일치 해결
2. **GroupQueryMapper 호환성 문제**: 오버로딩 메서드 추가 또는 마이그레이션 계획 수립
3. **컴파일 및 빌드 확인**: 변경사항 적용 후 전체 프로젝트 빌드 테스트

### 권장 (Should Fix)
1. **DTO 클래스 도입**: Map<String, Object> 대신 타입 안전한 DTO 사용
2. **보안 검증 강화**: AuthContext 업데이트 전 토큰 유효성 재검증
3. **토큰 검증 로직 추가**: findToken 함수에 토큰 유효성 검사 포함

### 선택 (Nice to Have)
1. **API 버저닝**: 인터페이스 변경 시 API 버전 관리 고려
2. **상태 관리 최적화**: useProfileCheck 훅의 상태 관리 로직 리팩토링
3. **에러 핸들링 통일**: 일관된 에러 처리 패턴 적용

---

## 최종 평가

**종합 점수**: 65/100

**결론**: 
- [ ] [OK] **승인 (Approved)** - 문제 없음
- [ ] [WARN] **조건부 승인 (Approved with Comments)** - 경미한 이슈만 존재
- [x] [FIX] **수정 필요 (Changes Requested)** - 중요 이슈 수정 후 재검토
- [ ] [REJECT] **거부 (Rejected)** - 치명적 이슈로 인한 병합 불가

**핵심 코멘트:**
이 커밋은 SSO 통합 과정에서 필요한 기능적 개선을 포함하고 있으나, 몇 가지 중요한 문제점이 존재합니다. 가장 심각한 문제는 커밋 메시지와 실제 코드 상태의 불일치(RefreshToken 파일 삭제 누락)와 백엔드 인터페이스 변경으로 인한 호환성 위험입니다. 또한 보안 측면에서 추가 검증이 필요한 부분이 있습니다. 이러한 문제들이 해결되기 전에는 프로덕션 배포가 권장되지 않습니다.

**리뷰어 노트:**
- 검토 시간: 약 30분
- 우선 수정 항목:
  1. RefreshToken 파일 실제 삭제 및 커밋 메시지 정정
  2. GroupQueryMapper 인터페이스 호환성 보장
  3. 보안 검증 로직 강화 (AuthContext 업데이트 시 토큰 검증)