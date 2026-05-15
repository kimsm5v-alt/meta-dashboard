package com.vs.meta.api.dgnss.mapper;

import com.vs.meta.common.utils.PagingParam;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Mapper
public interface DgnssMapper {
    // 교사) META 자기조절학습 목록 전달
    List<Map<String, Object>> selectTcDgnssInfo(Map<String, Object> param);
    void deleteTargetStListResultInfo(List<String> stList);
    void deleteTargetStListAnswer(List<String> stList);
    // 교사) META 자기조절학습 마스터 INSERT
    void insertDgnssInfo(Map<String, Object> param);
    // 교사) META 자기조절학습 마스터 중복 체크
    int selectExistsDgnssInfo(Map<String, Object> param);
    // 교사) META 자기조절학습 마스터 진단 상태 변경
    void updateDgnssInfo(Map<String, Object> param);
    int selectActvStdtCnt(Map<String, Object> param);
    // 교사) UPDATE 할 META 자기조절학습 Info 테이블 검색
    Map<String, Object> selectTcDgnssInfoOne(Map<String, Object> param);
    // 교사) UPDATE 할 META 자기조절학습 Info 테이블 검색(dgnssId로 탐색)
    Map<String, Object> selectTcDgnssInfoOneWithDgnssId(Map<String, Object> param);
    // 교사) 학생들의 OMR 카드 정보 가져오기
    List<LinkedHashMap<String, Object>> selectStOmrInfo(Map<String, Object> param);
    // 교사) 제출한 모든 학생의 이름 가져오기
    List<String> selectSubmitStList(Map<String, Object> param);
    List<Long> selectSubmittedStudentUserNoListByDgnssId(@Param("dgnssId") int dgnssId);
    List<String> selectDgnssStdtList(Map<String, Object> param);
    // 교사) META 자기조절학습 result_info에 insert할 학생 ID 탐색
    List<String> selectTargetStList(Map<String, Object> param);
    List<String> selectEligibleTargetStListForOrd2(Map<String, Object> param);
    List<Map<String, Object>> selectTcDgnssStartPreview(Map<String, Object> param);
    List<Long> selectTargetStudentUserNoList(Map<String, Object> param);
    String selectTcId(Map<String, Object> param);
    // 교사) META 자기조절학습 학생 개인 답안(OMR) insert
    int insertDgnssOmr(Map<String, Object> param);
    // 교사) META 자기조절학습 result_info에 데이터 insert
    void insertDgnssResult(Map<String, Object> param);
    // 과거 omrIdx 제거(idx로)
    void deleteDgnssOmrIdx(int omrIdx);
    // 교사) META 자기조절학습 answer에 데이터 insert
    void insertDgnssAnswer(Map<String, Object> param);
    // 교사) META 자기조절학습 취소(마스터테이블 삭제)
    void deleteTcDgnssInfo(Map<String, Object> param);
    // 교사) META 자기조절학습 취소(상세테이블 삭제)
    void deleteTcDgnssResultInfo(Map<String, Object> param);
    void deleteTcDgnssAnswer(Map<String, Object> param);
    // 교사) META 자기조절학습 취소(LPA 분석결과 삭제) — info/result_info/answer 의 부모이므로 가장 먼저 제거
    void deleteTcDgnssLpaResult(Map<String, Object> param);
    List<Integer> selectOmrIdxList(Map<String, Object> param);
     // 학생) META 자기조절학습 문제 조회
    List<String> selectAllStdtList(Map<String, Object> param);
    // 학생) 자기진단 제출
    void updateStSubmit(int dgnssResultId);
    // 선생, 학생) TB_DGNSS_ANSWER 테이블에 ANSWER 컬럼 업데이트
    void updateDgnssAnswerJson(@Param("dgnssResultId") int dgnssResultId, @Param("sameAnswerCheck") boolean sameAnswerCheck);
    void updateDgnssAnswerJsonLearn(@Param("dgnssResultId") int dgnssResultId, @Param("sameAnswerCheck") boolean sameAnswerCheck);
    // 선생, 학생) 프로시저 실행을 위한 ANSWER_IDX 값 가져오기
    int selectAnswerIdx(int dgnssResultId);
    // 선생, 학생) 프로시저 실행
    void callProcMark(int answerIdx);
    // 학생) 약점 요인
    Map<String, Object> selectTcUserInfo(Map<String, Object> param);
    Map<String, Object> selectStUserInfo(Map<String, Object> param);
    List<Map<String, Object>> getDgnssReport(Map<String, Object> param);
    List<Map<String, Object>> getDgnssReportStudy(Map<String, Object> param);
    void updateFileUrl(Map<String, Object> param);
    // 교사용 분석표 용(자기조절)
    String getDgnssFirstTest(Map<String, Object> param);
    List<Map<String, Object>> getDgnssReportLS(Map<String, Object> param);
    List<Map<String, Object>> getDgnssReportSection(Map<String, Object> param);
    List<Map<String, Object>> getDgnssReportValidity(Map<String, Object> param);
    List<Map<String, Object>> getDgnssReportMem(Map<String, Object> param);
    List<Map<String, Object>> getDgnssReportStatByTest(Map<String, Object> param);
    void updateFileUrlTch(Map<String, Object> param);
    List<String> selectDgnssStdtListFromDgnssId(Map<String, Object> param);
    List<Long> selectStudentUserNosByStdtIdsInClass(@Param("claId") String claId, @Param("stdtIds") List<String> stdtIds);
    void updateDgnssStatus(Map<String, Object> param);
    String selectStdtIdFromDgnssResultId(@Param("dgnssResultId") int dgnssResultId);
    Map<String, Object> selectSubmitNotificationInfo(@Param("dgnssResultId") int dgnssResultId);
    String selectSubmitYnByDgnssResultId(@Param("dgnssResultId") int dgnssResultId);
    Map<String, Object> selectSubmitCompletionInfo(@Param("dgnssResultId") int dgnssResultId);
    /* META 자기조절학습 관련 */
    // 교사) 최근 META 자기조절학습 시작 여부(대시보드)
    String selectMetaStartYn(Map<String, Object> param);
    Map<String, Object> selectPastOmrInfo(Map<String, Object> param);
    void updateDgnssResult(Map<String, Object> param);
    void deleteDgnssOmr(Map<String, Object> param);
    List<Map> selectStQuesList(PagingParam<?> pagingParam);
    List<Map<String, Object>> selectStQuesListOrigin(Map<String, Object> param);
    void updateStStart(Map<String, Object> param);
    String selectPaperIdxFromResultId(Map<String, Object> param);
    LinkedHashMap<String, Object> selectStDgnssOmr(Map<String, Object> param);
    List<Map<String, Object>> selectDgnssAnswerReliability(Map<String, Object> param);
    List<Map<String, Object>> selectLernType2(Map<String, Object> param);
    List<Map<String, Object>> selectLernType3(Map<String, Object> param);
    List<Map<String, Object>> selectLernType4(Map<String, Object> param);
    List<Map<String, Object>> selectLernType5(Map<String, Object> param);
    List<Map<String, Object>> selectLernType6(Map<String, Object> param);
    List<Map<String, Object>> selectDgnssAnswerReportMotivate(Map<String, Object> param);
    List<Map<String, Object>> selectDgnssAnswerReportRecognition(Map<String, Object> param);
    List<Map<String, Object>> selectDgnssAnswerReportBehavior(Map<String, Object> param);
    Map<String, Object> selectTcDgnssDetailInfo(Map<String, Object> param);
    Map<String, Object> selectStInfo(Map<String, Object> param);
    List<Map<String, Object>> selectStLernAnalysis(Map<String, Object> param);
    String selectFirstDgnssResultId(Map<String, Object> param);
    String selectStAnalysis(Map<String, Object> param);
    List<Map<String, Object>> selectTcDgnssNotSubmStList(Map<String, Object> param);
    void saveDgnssTextSave(Map<String, Object> param);
    List<Map<String, Object>> selectTcTrustInfoList(Map<String, Object> param);
    List<Map<String, Object>> selectLernEtcInfoList(Map<String, Object> param);
    List<Map<String, Object>> selectTcEtcInfoList(Map<String, Object> param);
    List<Integer> selectDgnssIdxList(Map<String, Object> param);
    List<Map<String, Object>> selectClassTotalReport(Map<String, Object> param);
    int selectOrdNoByDgnssId(@Param("dgnssId") int dgnssId);
    List<String> selectClassStudentsWithoutResultInClassForOrd(Map<String, Object> param);
    List<Map<String, Object>> selectClassTotalReportFromOtherClasses(Map<String, Object> param);
    List<Map<String, Object>> selectClassStudentsSubmStatusFromOtherClasses(Map<String, Object> param);
    String selectClaIdByDgnssId(@Param("dgnssId") int dgnssId);
    List<Map<String, Object>> selectDgnssAnswerReliabilityFromOtherClasses(Map<String, Object> param);
    List<Map<String, Object>> selectLernType2FromOtherClasses(Map<String, Object> param);
    List<Map<String, Object>> selectLernType3FromOtherClasses(Map<String, Object> param);
    List<Map<String, Object>> selectLernType4FromOtherClasses(Map<String, Object> param);
    List<Map<String, Object>> selectLernType5FromOtherClasses(Map<String, Object> param);
    List<Map<String, Object>> selectLernType6FromOtherClasses(Map<String, Object> param);
    List<Map<String, Object>> selectDgnssAnswerReportMotivateFromOtherClasses(Map<String, Object> param);
    List<Map<String, Object>> selectDgnssAnswerReportRecognitionFromOtherClasses(Map<String, Object> param);
    List<Map<String, Object>> selectDgnssAnswerReportBehaviorFromOtherClasses(Map<String, Object> param);
    List<Map<String, Object>> selectClassLernReport(Map<String, Object> param);

    // 학생) 답 입력
    int updateStntAnswer(Map<String, Object> param);

    // 학생) META 자기조절학습 목록 조회
    List<Map<String, Object>> selectStntDgnssList(Map<String, Object> param);

    void updateSummaryFileUrl(Map<String, Object> param) throws Exception;

    List<Map<String, Object>> selectMakePdfTargetList(Map<String, Object> param);

    List<Map<String, Object>> selectLpaFactorScores(@Param("answerIdx") int answerIdx);

    void upsertDgnssLpaResult(Map<String, Object> param);

    List<Map<String, Object>> selectTcClassMetaStats(Map<String, Object> param);

    List<Map<String, Object>> selectTcClassFactorAverages(Map<String, Object> param);

    int countDgnssResultByDgnssIdAndStdtId(@Param("dgnssId") int dgnssId, @Param("stdtId") String stdtId);

    Map<String, Object> selectLpaResultByAnswerIdx(@Param("answerIdx") int answerIdx);

    // 교사) 샘플 엑셀용 OMR 목록 조회
    List<Map<String, Object>> selectOmrListForSampleExcel(@Param("dgnssId") int dgnssId);

    // 교사) dgnssId에 속한 유효 OMR_IDX 목록 조회
    List<Integer> selectValidOmrIdxSetByDgnssId(@Param("dgnssId") int dgnssId);

    // OMR_IDX 존재 여부 확인
    int existsOmrIdx(@Param("omrIdx") int omrIdx);

    // OMR 응답값 업데이트
    int updateOmrAnswers(Map<String, Object> param);

    // 교사) 샘플 엑셀 파일명용 검사 정보 조회
    Map<String, Object> selectDgnssInfoForExcelFilename(@Param("dgnssId") int dgnssId);
}
