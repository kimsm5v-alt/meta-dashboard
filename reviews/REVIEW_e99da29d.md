# 코드 리뷰 - e99da29d

## 코드 복잡도 분석

**분석된 파일**: 1개 / 변경된 파일: 1개


### 정상 범위 (NONE)


**`drawpdfservice.java`** (other)

- 평균 복잡도: **0.235**

- 최대 복잡도: 0.470

- 청크 수: 16개

- 평균 사용처: 31.4곳


**권장사항:**

- 복잡도 정상 범위


---


## 변경 배경

이 커밋은 `DrawPdfService`에서 PDF 보고서 생성 시 `MEM_GENDER_NM` 필드에 접근할 때 발생할 수 있는 **NullPointerException(NPE)을 방지**하기 위한 null-safe 처리입니다. `DgnssMapper`에서 gender 관련 컬럼이 제거됨에 따라 Map에서 `MEM_GENDER_NM` 키가 존재하지 않거나 값이 null인 경우 `.toString()` 호출 시 NPE가 발생할 수 있어, `MapUtils.getString()`으로 기본값(`""`)을 반환하도록 변경되었습니다.

- **목적**: `MEM_GENDER_NM` 필드 null-safe 처리로 NPE 방지
- **도메인**: 비즈니스 로직 (PDF 보고서 생성)
- **변경 방향**: 직접 `.get().toString()` 방식에서 `MapUtils.getString()`을 사용한 null-safe 방식으로 개선

---

## [GOOD] 잘된 점

**문제 인식의 정확성**: `DgnssMapper`에서 gender 관련 컬럼이 제거된 상황에서 NPE 발생 가능성을 정확히 파악하고 선제적으로 대응했습니다. 실제 운영 환경에서 데이터가 누락된 경우 발생할 수 있는 장애를 사전에 차단한 점이 좋습니다.

**일관된 패턴 적용**: 4개 페이지(라인 2168, 2383, 2741, 3026)에서 동일한 패턴으로 모두 수정하여 일관성을 유지했습니다. PDF 보고서의 여러 페이지(Page 7, 8, 9, 10/11)에서 동일한 테이블 렌더링 로직이 사용되고 있음을 고려할 때, 모든 위치를 빠짐없이 수정한 것은 꼼꼼한 작업입니다.

**적절한 기본값 처리**: `MapUtils.getString()`의 세 번째 인자로 빈 문자열(`""`)을 전달하여, 값이 없을 때 PDF에 빈 셀로 표시되도록 처리했습니다. `null` 대신 빈 문자열을 사용함으로써 `drawTextC` 메서드에서 추가적인 NPE가 발생하지 않도록 한 점이 적절합니다.

---

## 변경사항 요약

`DrawPdfService.java`의 4개 위치에서 `dgnssReportLS.get(i).get("MEM_GENDER_NM").toString()`를 `MapUtils.getString(dgnssReportLS.get(i), "MEM_GENDER_NM", "")`로 변경하여 NPE를 방지했습니다.

---

## [ISSUE] 개선이 필요한 부분

### Critical (즉시 수정 필요)

없음

### High (우선 수정 권장)

없음

### Medium (개선 권장)

**1. 동일한 패턴의 다른 필드들도 null-safe 처리가 필요합니다**

변경된 코드 주변을 보면 `MEM_NM`, `CLASS_NO`, `COCH_DGNSS_QESITM01_MARK`, `COCH_DGNSS_QESITM02_MARK` 등 동일한 `dgnssReportLS.get(i).get("...").toString()` 패턴을 사용하는 다른 필드들이 여전히 존재합니다. `MEM_GENDER_NM`만 특별히 null-safe 처리가 필요한 이유가 `DgnssMapper`에서 gender 컬럼이 제거되었기 때문이라면, 이 변경은 적절합니다. 다만, 추후 다른 필드들도 유사한 문제가 발생할 가능성이 있으므로 전체적인 null-safe 리팩토링을 고려할 수 있습니다.

**2. `MEM_NM` 필드도 동일한 위험에 노출되어 있습니다**

변경된 각 블록에서 `MEM_NM`은 여전히 `.get().toString()` 방식으로 접근하고 있습니다(라인 2165, 2381, 2739, 3024). `MEM_GENDER_NM`과 동일한 데이터 소스에서 가져오는 필드라면 `MEM_NM`도 동일한 NPE 위험이 있습니다. 다만, 이름(`MEM_NM`)은 항상 존재하는 필드일 가능성이 높아 현재는 문제가 없을 수 있습니다. 이 부분은 해당 Mapper의 실제 반환 데이터 구조를 확인한 후 판단하는 것이 좋습니다.

---

## 주요 파일 분석

### `backend/src/main/java/com/vs/meta/api/dgnss/service/DrawPdfService.java`

**변경 내용:**
4개 페이지(Page 7, 8, 9, 10/11)의 PDF 테이블 렌더링 로직에서 `MEM_GENDER_NM` 필드 접근 방식을 null-safe하게 변경

**개선 제안:**

1. **`MEM_NM` 필드도 동일한 null-safe 패턴 적용 검토**
   - **위치 (라인 번호)**: 2165, 2381, 2739, 3024
   - **기존 코드**:
   ```java
   pioPdfVO.drawTextC(dgnssReportLS.get(i).get("MEM_NM").toString(), x[1], y[i] + textHeight, x[2] - x[1], "", fontSize);
   ```
   - **해결 방안 (수정 코드)**:
   ```java
   pioPdfVO.drawTextC(MapUtils.getString(dgnssReportLS.get(i), "MEM_NM", ""), x[1], y[i] + textHeight, x[2] - x[1], "", fontSize);
   ```
   > `read_file`로 각 위치 전후 ±20줄을 확인한 결과, `MEM_NM`은 `MEM_GENDER_NM`과 동일한 `dgnssReportLS` Map에서 가져오며, 동일한 루프 내에서 사용됩니다. `MapUtils.getString`으로 변경해도 인접 로직(`CLASS_NO` null 체크, `COCH_DGNSS_QESITM01_MARK` 등의 조건문)에 부작용이 없음을 확인했습니다. 다만, `MEM_NM`이 항상 존재하는 필드라면 현재 상태로도 무방하므로, 실제 Mapper 반환 데이터를 확인 후 적용을 권장합니다.

---

## 최종 평가

**결론**:
- [x] [OK] **승인 (Approved)** - Critical/High 이슈 없음

**종합 의견:**

이 커밋은 명확한 문제 인식(null 발생 가능성)에 기반하여 정확히 필요한 부분만 최소한으로 수정한 좋은 변경입니다. `MapUtils.getString()`을 사용한 null-safe 처리는 적절한 접근 방식이며, 4개 페이지에 일관되게 적용되어 코드의 안정성을 높였습니다. 동일한 패턴의 다른 필드(`MEM_NM`)에 대해서도 검토해볼 수 있으나, 현재 변경만으로도 충분한 가치가 있는 수정입니다. 승인합니다.