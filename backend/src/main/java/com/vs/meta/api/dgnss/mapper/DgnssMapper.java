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
    List<String> selectDgnssStdtList(Map<String, Object> param);
    // 교사) META 자기조절학습 result_info에 insert할 학생 ID 탐색
    List<String> selectTargetStList(Map<String, Object> param);
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
    void updateDgnssStatus(Map<String, Object> param);
    String selectStdtIdFromDgnssResultId(@Param("dgnssResultId") int dgnssResultId);
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
    List<String> selectStrFactor(Map<String, Object> param);
    List<String> selectWeakFactor(Map<String, Object> param);
    List<Map<String, Object>> selectStTotalReport(Map<String, Object> param);
    List<Map<String, Object>> selectTcDgnssNotSubmStList(Map<String, Object> param);
    void saveDgnssTextSave(Map<String, Object> param);
    List<Map<String, Object>> selectTcTrustInfoList(Map<String, Object> param);
    List<Map<String, Object>> selectLernEtcInfoList(Map<String, Object> param);
    List<Map<String, Object>> selectTcEtcInfoList(Map<String, Object> param);
    List<Integer> selectDgnssIdxList(Map<String, Object> param);
    List<Map<String, Object>> selectClassTotalReport(Map<String, Object> param);
    List<Map<String, Object>> selectClassLernReport(Map<String, Object> param);

    // 학생) 답 입력
    int updateStntAnswer(Map<String, Object> param);

    // 학생) META 자기조절학습 목록 조회
    List<Map<String, Object>> selectStntDgnssList(Map<String, Object> param);

    void updateSummaryFileUrl(Map<String, Object> param) throws Exception;

    List<Map<String, Object>> selectMakePdfTargetList(Map<String, Object> param);
}
