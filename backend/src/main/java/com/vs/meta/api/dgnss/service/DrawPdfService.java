package com.vs.meta.api.dgnss.service;

import com.vs.meta.api.dgnss.vo.PioPdfVO;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@AllArgsConstructor
public class DrawPdfService {

    public void addDgnssPage_DGNSS10(PioPdfVO pioPdfVO, PDDocument doc, PDPageContentStream cont, int page, Map<String, Object> userInfo, List<Map<String, Object>> dgnssReport3, List<Map<String, Object>> dgnssReport4, List<Map<String, Object>> dgnssReport5, List<Map<String, Object>> dgnssReportStudy) throws IOException {
        try {
            // 첫 페이지에서 캐시 초기화 및 선행 로드 (O(n) 순회를 1회로 제한)
            if (page == 1) {
                reportCacheMap.clear();
                if (dgnssReport3 != null) buildReportCache(dgnssReport3, 3);
                if (dgnssReport4 != null) buildReportCache(dgnssReport4, 4);
                if (dgnssReport5 != null) buildReportCache(dgnssReport5, 5);
            }

            // 대분류 점수 배열

            if (Integer.parseInt(userInfo.get("DGNSS_ORD").toString()) == 1 && (page == 21 || page == 22))
                pioPdfVO.drawPageBackground("template02", page, 2);
            else
                pioPdfVO.drawPageBackground("template02", page, 0);


            if (page > 1 && page != 24) {
                pioPdfVO.drawHeader(page, userInfo);
                pioPdfVO.drawFooter();
            }

            // cont.drawImage(pdImage, 0f, 0f, pdImage.getWidth(), pdImage.getHeight());

            if (page == 1) {
                float x = pioPdfVO.px2mm(298f);
                float width = pioPdfVO.px2mm(88f);
                float fontSize = 12f;
                float fontHeight = 10f;

                pioPdfVO.drawTextC((String) userInfo.get("MEM_NM"), x, pioPdfVO.px2mm(601f - fontHeight, "Y"), width, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                pioPdfVO.drawTextC((String) userInfo.get("RSPNS_DT_KO"), x, pioPdfVO.px2mm(633f - fontHeight, "Y"), width, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                pioPdfVO.drawTextC((String) userInfo.get("SCH_NM"), x, pioPdfVO.px2mm(665f - fontHeight, "Y"), width, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                pioPdfVO.drawTextC(userInfo.get("MEM_GRADE_NM") + " " + userInfo.get("CLASS_NM"), x, pioPdfVO.px2mm(695f - fontHeight, "Y"), width, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                pioPdfVO.drawTextC((String.valueOf(userInfo.getOrDefault("CLASS_NO", "")).isBlank() ? "-" : userInfo.get("CLASS_NO") + "번"), x, pioPdfVO.px2mm(727f - fontHeight, "Y"), width, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);

                // pioPdfVO.drawPicture("./assets/imgs/dgnss/logo/school_snu.png", 5f, 250f, 2*23.0f, 2*17.4f );
            }
            // 해석가이드 > 신뢰도(사회적 바람직성, 반응일관성)
            else if (page == 4) {
                float fontSize = 11f;
                float x = pioPdfVO.px2mm(182f);

                float y1 = pioPdfVO.px2mm(226f, "Y");
                float y2 = pioPdfVO.px2mm(256f, "Y");
                float y3 = pioPdfVO.px2mm(286f, "Y");

                // 사회적 바람직성
                if (userInfo.get("COCH_DGNSS_QESITM02_MARK").toString().equals("양호"))
                    pioPdfVO.drawText("양호", x, y1, "Pretendard SemiBold", fontSize, false, false, Color.BLACK, -0.53f);
                else if (userInfo.get("COCH_DGNSS_QESITM02_MARK").toString().equals("주의"))
                    pioPdfVO.drawText("주의", x, y1, "Pretendard SemiBold", fontSize, false, false, pioPdfVO.hexa2Color("#FF4800"), -0.53f);

                // 반응 일관성
                if (userInfo.get("COCH_DGNSS_QESITM01_MARK").toString().equals("양호"))
                    pioPdfVO.drawText("양호", x, y2, "Pretendard SemiBold", fontSize, false, false, Color.BLACK, -0.53f);
                else if (userInfo.get("COCH_DGNSS_QESITM01_MARK").toString().equals("주의"))
                    pioPdfVO.drawText("주의", x, y2, "Pretendard SemiBold", fontSize, false, false, pioPdfVO.hexa2Color("#FF4800"), -0.53f);

                // 연속 동일반응
                if (userInfo.get("REPEATED_RESPONSE_YN").toString().equals("양호"))
                    pioPdfVO.drawText("양호", x, y3, "Pretendard SemiBold", fontSize, false, false, Color.BLACK, -0.53f);
                else if (userInfo.get("REPEATED_RESPONSE_YN").toString().equals("주의"))
                    pioPdfVO.drawText("주의", x, y3, "Pretendard SemiBold", fontSize, false, false, pioPdfVO.hexa2Color("#FF4800"), -0.53f);

            }
            // 해석가이드 _ 종합결과(중분류 막대그래프)
            else if (page == 5) {
                if (userInfo.get("MEM_NM").toString().length() > 4) {
                    pioPdfVO.drawTextC(userInfo.get("MEM_NM").toString(), pioPdfVO.px2mm(108f), pioPdfVO.px2mm(158f, "Y"), pioPdfVO.px2mm(30f), "Pretendard SemiBold", 12f, false, false, Color.BLACK, -0.29f);
                } else {
                    pioPdfVO.drawTextC(userInfo.get("MEM_NM").toString(), pioPdfVO.px2mm(120f), pioPdfVO.px2mm(158f, "Y"), pioPdfVO.px2mm(30f), "Pretendard SemiBold", 12f, false, false, Color.BLACK, -0.29f);
                }

                float[] x = new float[11];
                float y = pioPdfVO.px2mm(402f, "Y");
                float width = pioPdfVO.px2mm(16f);
                float height = pioPdfVO.px2mm(171f);
                Color[] color = new Color[11];

                float[] score = new float[11];

                x[0] = pioPdfVO.px2mm(96f);
                x[1] = pioPdfVO.px2mm(129f);
                x[2] = pioPdfVO.px2mm(181f);
                x[3] = pioPdfVO.px2mm(214f);
                x[4] = pioPdfVO.px2mm(247f);
                x[5] = pioPdfVO.px2mm(297f);
                x[6] = pioPdfVO.px2mm(330f);
                x[7] = pioPdfVO.px2mm(381f);
                x[8] = pioPdfVO.px2mm(414f);
                x[9] = pioPdfVO.px2mm(445f);
                x[10] = pioPdfVO.px2mm(497f);

                color[0] = pioPdfVO.hexa2Color("#00D282");
                color[1] = pioPdfVO.hexa2Color("#00D282");

                color[2] = pioPdfVO.hexa2Color("#4BC1FF");
                color[3] = pioPdfVO.hexa2Color("#4BC1FF");
                color[4] = pioPdfVO.hexa2Color("#4BC1FF");

                color[5] = pioPdfVO.hexa2Color("#67A7FF");
                color[6] = pioPdfVO.hexa2Color("#67A7FF");

                color[7] = pioPdfVO.hexa2Color("#FF8DA9");
                color[8] = pioPdfVO.hexa2Color("#FF8DA9");
                color[9] = pioPdfVO.hexa2Color("#FF8DA9");

                color[10] = pioPdfVO.hexa2Color("#FF87D4");

                score[0] = Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, "01", "01", "0").get("T_SCORE").toString());
                score[1] = Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, "01", "02", "0").get("T_SCORE").toString());
                score[2] = Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, "02", "01", "0").get("T_SCORE").toString());
                score[3] = Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, "02", "02", "0").get("T_SCORE").toString());
                score[4] = Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, "02", "03", "0").get("T_SCORE").toString());
                score[5] = Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, "04", "01", "0").get("T_SCORE").toString());
                score[6] = Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, "04", "02", "0").get("T_SCORE").toString());
                score[7] = Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, "03", "01", "0").get("T_SCORE").toString());
                score[8] = Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, "03", "02", "0").get("T_SCORE").toString());
                score[9] = Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, "03", "03", "0").get("T_SCORE").toString());
                score[10] = Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, "05", "01", "0").get("T_SCORE").toString());

                for (int i = 0; i < x.length; i++) {
                    if (score[i] > 0)
                        pioPdfVO.drawBarChart_Vertical(x[i], y, width, (height * score[i] / 100.0f), color[i], color[i]);
                }
            } else if (page == 6) {
                float[] x = new float[6];
                float[] y = new float[7];
                float width = pioPdfVO.px2mm(45f);

                x[0] = pioPdfVO.px2mm(53f);
                x[1] = pioPdfVO.px2mm(122f);
                x[2] = pioPdfVO.px2mm(235f);
                x[3] = pioPdfVO.px2mm(317f);
                x[4] = pioPdfVO.px2mm(342f);
                x[5] = pioPdfVO.px2mm(366f);

                y[0] = pioPdfVO.px2mm(297f - 5.5f, "Y");
                y[1] = pioPdfVO.px2mm(319f - 5.5f, "Y");
                y[2] = pioPdfVO.px2mm(415f - 5.5f, "Y");
                y[3] = pioPdfVO.px2mm(419f - 5.5f, "Y");
                y[4] = pioPdfVO.px2mm(524f - 5.5f, "Y");
                y[5] = pioPdfVO.px2mm(529f - 5.5f, "Y");
                y[6] = pioPdfVO.px2mm(609f - 5.5f, "Y");

                if (userInfo.get("MEM_NM").toString().length() > 4) {
                    pioPdfVO.drawTextC(userInfo.get("MEM_NM").toString(), pioPdfVO.px2mm(108f), pioPdfVO.px2mm(158f, "Y"), pioPdfVO.px2mm(30f), "Pretendard SemiBold", 12f, false, false, Color.BLACK, -0.29f);
                } else {
                    pioPdfVO.drawTextC(userInfo.get("MEM_NM").toString(), pioPdfVO.px2mm(115f), pioPdfVO.px2mm(158f, "Y"), pioPdfVO.px2mm(30f), "Pretendard SemiBold", 12f, false, false, Color.BLACK, -0.29f);
                }

                // 학습재설계_메타인지(02-01)
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "02", "01", "0").get("T_RANK").toString(), x[2], y[0], width, "Pretendard Bold", 10f, true, false, getColorByTRank(pioPdfVO, getAnswerReportValue(dgnssReport4, 4, "02", "01", "0").get("T_RANK").toString()), -0.48f);

                // 학습재설계_학습기술(02-02)
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "02", "02", "0").get("T_RANK").toString(), x[2], y[1], width, "Pretendard Bold", 10f, true, false, getColorByTRank(pioPdfVO, getAnswerReportValue(dgnssReport4, 4, "02", "02", "0").get("T_RANK").toString()), -0.48f);

                // 긍정적 자아(01-01)
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "01", "01", "0").get("T_RANK").toString(), x[0], y[2], width, "Pretendard Bold", 10f, true, false, getColorByTRank(pioPdfVO, getAnswerReportValue(dgnssReport4, 4, "01", "01", "0").get("T_RANK").toString()), -0.48f);

                // 지지적 관계(02-03)
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "02", "03", "0").get("T_RANK").toString(), x[1], y[2], width, "Pretendard Bold", 10f, true, false, getColorByTRank(pioPdfVO, getAnswerReportValue(dgnssReport4, 4, "02", "03", "0").get("T_RANK").toString()), -0.48f);

                // 긍정적 공부 마음_학업열의(04-01)
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "04", "01", "0").get("T_RANK").toString(), x[3], y[3], width, "Pretendard Bold", 10f, true, false, getColorByTRank(pioPdfVO, getAnswerReportValue(dgnssReport4, 4, "04", "01", "0").get("T_RANK").toString()), -0.48f);

                // 긍정적 공부 마음_성장력(04-02)
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "04", "02", "0").get("T_RANK").toString(), x[5], y[3], width, "Pretendard Bold", 10f, true, false, getColorByTRank(pioPdfVO, getAnswerReportValue(dgnssReport4, 4, "04", "02", "0").get("T_RANK").toString()), -0.48f);

                // 학업 스트레스(03-01)
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "03", "01", "0").get("T_RANK").toString(), x[0], y[4], width, "Pretendard Bold", 10f, true, false, getColorByTRank(pioPdfVO, getAnswerReportValue(dgnssReport4, 4, "03", "01", "").get("T_RANK").toString(), true), -0.48f);

                // 학업 관계 스트레스(03-03)
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "03", "02", "0").get("T_RANK").toString(), x[1], y[4], width, "Pretendard Bold", 10f, true, false, getColorByTRank(pioPdfVO, getAnswerReportValue(dgnssReport4, 4, "03", "02", "").get("T_RANK").toString(), true), -0.48f);

                // 부정적 공부 마음_학업소진(05-01)
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "05", "01", "0").get("T_RANK").toString(), x[4], y[5], width, "Pretendard Bold", 10f, true, false, getColorByTRank(pioPdfVO, getAnswerReportValue(dgnssReport4, 4, "05", "01", "").get("T_RANK").toString(), true), -0.48f);

                // 학습재설계_자기정서조절(01-02-02)
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport5, 5, "01", "02", "02").get("T_RANK").toString(), x[2] + pioPdfVO.px2mm(4f), y[6], width, "Pretendard Bold", 10f, true, false, getColorByTRank(pioPdfVO, getAnswerReportValue(dgnssReport5, 5, "01", "02", "02").get("T_RANK").toString()), -0.48f);

            }
            // 해석 가이드(학습현황 점검)
            else if (page == 7) {
                float[] x = new float[5];
                float[] y1 = new float[2];

                float x2;
                float[] y2 = new float[5];


                String[] avgStudyTime = new String[5];

                if (userInfo.get("MEM_NM").toString().length() > 4) {
                    pioPdfVO.drawTextC(userInfo.get("MEM_NM").toString(), pioPdfVO.px2mm(200f), pioPdfVO.px2mm(164f, "Y"), pioPdfVO.px2mm(40f), "Pretendard", 16f, true, false, Color.BLACK);
                } else {
                    pioPdfVO.drawTextC(userInfo.get("MEM_NM").toString(), pioPdfVO.px2mm(208f), pioPdfVO.px2mm(164f, "Y"), pioPdfVO.px2mm(40f), "Pretendard", 16f, true, false, Color.BLACK);
                }

                x[0] = pioPdfVO.px2mm(61.5f);
                x[1] = pioPdfVO.px2mm(115f);
                x[2] = pioPdfVO.px2mm(169.5f);
                x[3] = pioPdfVO.px2mm(223.5f);
                x[4] = pioPdfVO.px2mm(277.5f);

                y1[0] = pioPdfVO.px2mm(286f, "Y");
                y1[1] = pioPdfVO.px2mm(385f, "Y");


                x2 = pioPdfVO.px2mm(291f);

                y2[0] = pioPdfVO.px2mm(492f, "Y");
                y2[1] = pioPdfVO.px2mm(514.4f, "Y");
                y2[2] = pioPdfVO.px2mm(536.8f, "Y");
                y2[3] = pioPdfVO.px2mm(559.2f, "Y");
                y2[4] = pioPdfVO.px2mm(581.6f, "Y");

                avgStudyTime[0] = "전혀 안함";
                avgStudyTime[1] = "1시간 미만";
                avgStudyTime[2] = "1시간 이상~2시간 미만";
                avgStudyTime[3] = "2시간 이상~3시간 미만";
                avgStudyTime[4] = "3시간 이상";

                String[] lsAns05FileName = new String[5];

                lsAns05FileName[0] = "./assets/imgs/dgnss/btn/btn_ans05_1.png";
                lsAns05FileName[1] = "./assets/imgs/dgnss/btn/btn_ans05_2.png";
                lsAns05FileName[2] = "./assets/imgs/dgnss/btn/btn_ans05_3.png";
                lsAns05FileName[3] = "./assets/imgs/dgnss/btn/btn_ans05_4.png";
                lsAns05FileName[4] = "./assets/imgs/dgnss/btn/btn_ans05_5.png";


                if (userInfo.get("LS_ANS01") != null && !StringUtils.isEmpty(userInfo.get("LS_ANS01").toString())) {
                    pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_check_p4.png", x[Integer.parseInt(userInfo.get("LS_ANS01").toString()) - 1], y1[0], pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                }

                if (userInfo.get("LS_ANS02") != null && !StringUtils.isEmpty(userInfo.get("LS_ANS02").toString())) {
                    pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_check_p4.png", x[Integer.parseInt(userInfo.get("LS_ANS02").toString()) - 1], y1[1], pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                }

                if (userInfo.get("LS_ANS03") != null && !StringUtils.isEmpty(userInfo.get("LS_ANS03").toString())) {
                    pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_check2.png", x2, y2[Integer.parseInt(userInfo.get("LS_ANS03").toString()) - 1], pioPdfVO.px2mm(14f), pioPdfVO.px2mm(14f));
                }

                if (userInfo.get("LS_ANS04") != null && !StringUtils.isEmpty(userInfo.get("LS_ANS04").toString())) {
                    pioPdfVO.drawTextC(avgStudyTime[Integer.parseInt(userInfo.get("LS_ANS04").toString()) - 1], pioPdfVO.px2mm(196f), pioPdfVO.px2mm(678f, "Y"), pioPdfVO.px2mm(98f), "Pretendard SemiBold", 11f);
                }

                if (userInfo.get("LS_ANS05") != null && !StringUtils.isEmpty(userInfo.get("LS_ANS05").toString())) {
                    pioPdfVO.drawPicture(lsAns05FileName[Integer.parseInt(userInfo.get("LS_ANS05").toString()) - 1], pioPdfVO.px2mm(35f), pioPdfVO.px2mm(792f, "Y"), pioPdfVO.px2mm(290f), pioPdfVO.px2mm(40f));
                }

            }
            // 8 : 자아강점 > 긍정적 자아(3)
            else if ((page >= 8 && page <= 14) || (page >= 16 && page <= 19)) {
                String class3 = "";
                String class4 = "";
                int class5Count = 0;
                Color class4Color = Color.BLACK;

                boolean reverse = page >= 16 && page <= 19;

                // 부정 측정 여부

                // 자아 강점_긍정적 자아
                if (page == 8) {
                    class3 = "01";
                    class4 = "01";

                    class5Count = 3;
                    class4Color = pioPdfVO.hexa2Color("#00D282");
                }
                //자아 강점_ 대인관계능력
                else if (page == 9) {
                    class3 = "01";
                    class4 = "02";

                    class5Count = 4;
                    class4Color = pioPdfVO.hexa2Color("#00D282");
                }
                // 학습디딤돌_메타인지
                else if (page == 10) {
                    class3 = "02";
                    class4 = "01";

                    class5Count = 3;
                    class4Color = pioPdfVO.hexa2Color("#4BC2FF");
                }
                // 학습디딤돌_학습기술
                else if (page == 11) {
                    class3 = "02";
                    class4 = "02";

                    class5Count = 5;
                    class4Color = pioPdfVO.hexa2Color("#4BC2FF");

                }
                // 학습디딤돌_지지적 관계
                else if (page == 12) {
                    class3 = "02";
                    class4 = "03";
                    class5Count = 4;
                    class4Color = pioPdfVO.hexa2Color("#4BC2FF");
                }
                // 긍정적 공부마음_학업열의
                else if (page == 13) {
                    class3 = "04";
                    class4 = "01";
                    class5Count = 3;
                    class4Color = pioPdfVO.hexa2Color("#67A7FF");
                }
                // 긍정적 공부마음_성장력
                else if (page == 14) {
                    class3 = "04";
                    class4 = "02";
                    class5Count = 3;
                    class4Color = pioPdfVO.hexa2Color("#67A7FF");
                }
                // 학습걸림돌_학업스트레스
                else if (page == 16) {
                    class3 = "03";
                    class4 = "01";
                    class5Count = 3;
                    class4Color = pioPdfVO.hexa2Color("#FF8DA9");
                }
                // 학습걸림돌_학업관계스트레스
                else if (page == 17) {
                    class3 = "03";
                    class4 = "02";
                    class5Count = 5;
                    class4Color = pioPdfVO.hexa2Color("#FF8DA9");
                }
                // 학습걸림돌_학습방해물
                else if (page == 18) {
                    class3 = "03";
                    class4 = "03";
                    class5Count = 2;
                    class4Color = pioPdfVO.hexa2Color("#FF8DA9");
                }
                // 학습걸림돌_학업관계스트레스
                else if (page == 19) {
                    class3 = "05";
                    class4 = "01";
                    class5Count = 3;
                    class4Color = pioPdfVO.hexa2Color("#FF87D4");
                }

                float x1 = pioPdfVO.px2mm(141);
                float width1 = pioPdfVO.px2mm(32f);
                float[] y1 = new float[6];

                // 중분류 MARK
                float x2 = pioPdfVO.px2mm(53f);
                float width2 = pioPdfVO.px2mm(16f);
                float[] y2 = new float[5];

                float x3 = pioPdfVO.px2mm(204.5f);
                float barWidth = pioPdfVO.px2mm(371f);
                float[] y3 = new float[5];

                float y2Height = 2f;
                float y3Height = 0f;

                if (class5Count == 2) {

                    y1[0] = pioPdfVO.px2mm(243f, "Y");
                    y1[1] = pioPdfVO.px2mm(263f, "Y");
                    y1[2] = pioPdfVO.px2mm(283f, "Y");

                    y2[0] = pioPdfVO.px2mm(352f - y2Height, "Y");
                    y2[1] = pioPdfVO.px2mm(420f - y2Height, "Y");

                    y3[0] = pioPdfVO.px2mm(333.5f - y3Height, "Y");
                    y3[1] = pioPdfVO.px2mm(402.5f - y3Height, "Y");


                } else if (class5Count == 3) {

                    y1[0] = pioPdfVO.px2mm(243f, "Y");
                    y1[1] = pioPdfVO.px2mm(263f, "Y");
                    y1[2] = pioPdfVO.px2mm(283f, "Y");
                    y1[3] = pioPdfVO.px2mm(303f, "Y");

                    y2[0] = pioPdfVO.px2mm(372f - y2Height, "Y");
                    y2[1] = pioPdfVO.px2mm(440f - y2Height, "Y");
                    y2[2] = pioPdfVO.px2mm(507f - y2Height, "Y");

                    y3[0] = pioPdfVO.px2mm(353.5f - y3Height, "Y");
                    y3[1] = pioPdfVO.px2mm(422.5f - y3Height, "Y");
                    y3[2] = pioPdfVO.px2mm(490.5f - y3Height, "Y");

                } else if (class5Count == 4) {
                    y1[0] = pioPdfVO.px2mm(243f, "Y");
                    y1[1] = pioPdfVO.px2mm(263f, "Y");
                    y1[2] = pioPdfVO.px2mm(283f, "Y");
                    y1[3] = pioPdfVO.px2mm(303f, "Y");
                    y1[4] = pioPdfVO.px2mm(323f, "Y");

                    y2[0] = pioPdfVO.px2mm(393f - y2Height, "Y");
                    y2[1] = pioPdfVO.px2mm(461f - y2Height, "Y");
                    y2[2] = pioPdfVO.px2mm(529f - y2Height, "Y");
                    y2[3] = pioPdfVO.px2mm(597f - y2Height, "Y");

                    y3[0] = pioPdfVO.px2mm(374.5f - y3Height, "Y");
                    y3[1] = pioPdfVO.px2mm(443.5f - y3Height, "Y");
                    y3[2] = pioPdfVO.px2mm(511.5f - y3Height, "Y");
                    y3[3] = pioPdfVO.px2mm(579.5f - y3Height, "Y");

                } else if (class5Count == 5) {

                    y1[0] = pioPdfVO.px2mm(243f, "Y");
                    y1[1] = pioPdfVO.px2mm(263f, "Y");
                    y1[2] = pioPdfVO.px2mm(283f, "Y");
                    y1[3] = pioPdfVO.px2mm(303f, "Y");
                    y1[4] = pioPdfVO.px2mm(323f, "Y");
                    y1[5] = pioPdfVO.px2mm(343f, "Y");

                    y2[0] = pioPdfVO.px2mm(412f - y2Height, "Y");
                    y2[1] = pioPdfVO.px2mm(480f - y2Height, "Y");
                    y2[2] = pioPdfVO.px2mm(548f - y2Height, "Y");
                    y2[3] = pioPdfVO.px2mm(616f - y2Height, "Y");
                    y2[4] = pioPdfVO.px2mm(684f - y2Height, "Y");

                    y3[0] = pioPdfVO.px2mm(394.5f - y3Height, "Y");
                    y3[1] = pioPdfVO.px2mm(462.5f - y3Height, "Y");
                    y3[2] = pioPdfVO.px2mm(530.5f - y3Height, "Y");
                    y3[3] = pioPdfVO.px2mm(598.5f - y3Height, "Y");
                    y3[4] = pioPdfVO.px2mm(666.5f - y3Height, "Y");
                }

                // pioPdfVO.setOpacity(0.80f);
                if (Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, class3, class4, "").get("T_SCORE").toString()) >= 0) {
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, class3, class4, "0").get("T_SCORE").toString() + "(" + getAnswerReportValue(dgnssReport4, 4, class3, class4, "0").get("P_RANK").toString() + ")", x1, y1[0], width1, "", 10.5f, true, false, Color.BLACK, -0.5f);
                    pioPdfVO.drawBarChart_Horizontal(x3, y1[0], barWidth * Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, class3, class4, "").get("T_SCORE").toString()) / 100f, pioPdfVO.px2mm(10f), Color.WHITE, class4Color);
                } else {
                    pioPdfVO.drawTextC("?", x1, y1[0], width1, "", 10.5f, true, false, Color.BLACK, -0.5f);
                }

                // pioPdfVO.setOpacity(1f);

                String tmpClass5 = "";

                for (int i = 0; i < class5Count; i++) {
                    tmpClass5 = StringUtils.leftPad(Integer.toString(i + 1), 2, "0");

                    // 한 번만 조회하여 변수에 저장
                    Map<String, Object> report5 = getAnswerReportValue(dgnssReport5, 5, class3, class4, tmpClass5);
                    float tScore = Float.parseFloat(report5.get("T_SCORE").toString());
                    String tRank = report5.get("T_RANK").toString();
                    String tScript = report5.get("T_SCRIPT").toString();
                    String pRank = report5.get("P_RANK").toString();

                    // 변인 T점수(백분위)
                    if (tScore >= 0)
                        pioPdfVO.drawTextC(report5.get("T_SCORE").toString() + "(" + pRank + ")", x1, y1[i + 1], width1, "", 10.5f, false, false, Color.BLACK, -0.5f);
                    else {
                        pioPdfVO.drawTextC("?", x1, y1[i + 1], width1, "", 10.5f, false, false, Color.BLACK, -0.5f);
                    }

                    // 변인 MARK
                    pioPdfVO.drawTextC(tRank, x2, y2[i], width2, "Pretendard Bold", 10f, true, false, getColorByTRank(pioPdfVO, tRank, reverse), -0.48f);

                    // 변인 T점수 가로바 차트
                    if (tScore > 0) {
                        pioPdfVO.setOpacity(0.65f);
                        pioPdfVO.drawBarChart_Horizontal(x3, y1[i + 1], barWidth * tScore / 100f, pioPdfVO.px2mm(10f), Color.white, pioPdfVO.hexa2Color("#9AA0A8"));
                        pioPdfVO.setOpacity(1f);
                    }
                    pioPdfVO.drawTextParagraph(tScript, pioPdfVO.px2mm(121f), y3[i], pioPdfVO.px2mm(438f), 147.4f, "", 9.5f, Color.BLACK, true, pioPdfVO.px2pt(-0.46f));
                }

                // 중분류 총평
                pioPdfVO.drawTextParagraph(getAnswerReportValue(dgnssReport4, 4, class3, class4, "0").get("T_SCRIPT").toString(), pioPdfVO.px2mm(30f), pioPdfVO.px2mm(753.5f, "Y"), pioPdfVO.px2mm(528f), 152.4f, "Pretendard Medium", 10.5f, Color.BLACK, true, pioPdfVO.px2pt(-0.5f));

            } else if (page == 15) {
                String class3 = "";

                String[] imgFile = new String[25];
                float[] x1 = new float[25];
                float[] y1 = new float[25];

                y1[0] = pioPdfVO.px2mm(175f, "Y");
                y1[1] = pioPdfVO.px2mm(200f, "Y");
                y1[2] = pioPdfVO.px2mm(225f, "Y");
                y1[3] = pioPdfVO.px2mm(250f, "Y");
                y1[4] = pioPdfVO.px2mm(275f, "Y");
                y1[5] = pioPdfVO.px2mm(300f, "Y");
                y1[6] = pioPdfVO.px2mm(325f, "Y");
                y1[7] = pioPdfVO.px2mm(360f, "Y");
                y1[8] = pioPdfVO.px2mm(385f, "Y");
                y1[9] = pioPdfVO.px2mm(410f, "Y");
                y1[10] = pioPdfVO.px2mm(435f, "Y");
                y1[11] = pioPdfVO.px2mm(460f, "Y");
                y1[12] = pioPdfVO.px2mm(485f, "Y");
                y1[13] = pioPdfVO.px2mm(510f, "Y");
                y1[14] = pioPdfVO.px2mm(534f, "Y");
                y1[15] = pioPdfVO.px2mm(559f, "Y");
                y1[16] = pioPdfVO.px2mm(585f, "Y");
                y1[17] = pioPdfVO.px2mm(610f, "Y");
                y1[18] = pioPdfVO.px2mm(635f, "Y");
                y1[19] = pioPdfVO.px2mm(684f, "Y");
                y1[20] = pioPdfVO.px2mm(709f, "Y");
                y1[21] = pioPdfVO.px2mm(734f, "Y");
                y1[22] = pioPdfVO.px2mm(759f, "Y");
                y1[23] = pioPdfVO.px2mm(784f, "Y");
                y1[24] = pioPdfVO.px2mm(809f, "Y");


                imgFile[0] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "01", "01", "01").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[1] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "01", "01", "02").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[2] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "01", "01", "03").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[3] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "01", "02", "01").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[4] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "01", "02", "02").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[5] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "01", "02", "03").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[6] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "01", "02", "04").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[7] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "02", "01", "01").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[8] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "02", "01", "02").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[9] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "02", "01", "03").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[10] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "02", "02", "01").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[11] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "02", "02", "02").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[12] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "02", "02", "03").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[13] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "02", "02", "04").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[14] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "02", "02", "05").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[15] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "02", "03", "01").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[16] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "02", "03", "02").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[17] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "02", "03", "03").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[18] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "02", "03", "04").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[19] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "04", "01", "01").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[20] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "04", "01", "02").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[21] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "04", "01", "03").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[22] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "04", "02", "01").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[23] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "04", "02", "02").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile[24] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "04", "02", "03").get("T_RANK").toString(), "dgnss10", false, page - 1);

                for (int i = 0; i < 25; i++) {
                    if (imgFile[i].contains("ico_mark_high"))
                        x1[i] = pioPdfVO.px2mm(385f);
                    else if (imgFile[i].contains("ico_mark_mid"))
                        x1[i] = pioPdfVO.px2mm(321f);
                    else if (imgFile[i].contains("ico_mark_low"))
                        x1[i] = pioPdfVO.px2mm(257f);
                    else
                        x1[i] = 0;
                }

                for (int i = 0; i < 25; i++)
                    pioPdfVO.drawPicture(imgFile[i], x1[i], y1[i], pioPdfVO.px2mm(14f), pioPdfVO.px2mm(14f));

                // 종합등급
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "01", "01", "0").get("T_RANK").toString(), pioPdfVO.px2mm(452f), pioPdfVO.px2mm(199f, "Y"), pioPdfVO.px2mm(34f), "Pretendard Medium", 10.5f, false, false, Color.BLACK, -0.5f);
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "01", "02", "0").get("T_RANK").toString(), pioPdfVO.px2mm(452f), pioPdfVO.px2mm(287f, "Y"), pioPdfVO.px2mm(34f), "Pretendard Medium", 10.5f, false, false, Color.BLACK, -0.5f);
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "02", "01", "0").get("T_RANK").toString(), pioPdfVO.px2mm(452f), pioPdfVO.px2mm(384f, "Y"), pioPdfVO.px2mm(34f), "Pretendard Medium", 10.5f, false, false, Color.BLACK, -0.5f);
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "02", "02", "0").get("T_RANK").toString(), pioPdfVO.px2mm(452f), pioPdfVO.px2mm(484f, "Y"), pioPdfVO.px2mm(34f), "Pretendard Medium", 10.5f, false, false, Color.BLACK, -0.5f);
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "02", "03", "0").get("T_RANK").toString(), pioPdfVO.px2mm(452f), pioPdfVO.px2mm(593f, "Y"), pioPdfVO.px2mm(34f), "Pretendard Medium", 10.5f, false, false, Color.BLACK, -0.5f);
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "04", "01", "0").get("T_RANK").toString(), pioPdfVO.px2mm(452f), pioPdfVO.px2mm(708f, "Y"), pioPdfVO.px2mm(34f), "Pretendard Medium", 10.5f, false, false, Color.BLACK, -0.5f);
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "04", "02", "0").get("T_RANK").toString(), pioPdfVO.px2mm(452f), pioPdfVO.px2mm(783f, "Y"), pioPdfVO.px2mm(34f), "Pretendard Medium", 10.5f, false, false, Color.BLACK, -0.5f);

                // 종합순위
                if (!getAnswerReportValue(dgnssReport4, 4, "01", "01", "0").get("RANK_TOTAL").toString().equals("-1"))
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "01", "01", "0").get("RANK_TOTAL").toString(), pioPdfVO.px2mm(536f), pioPdfVO.px2mm(199f, "Y"), pioPdfVO.px2mm(6f), "Pretendard Medium", 10.5f, false, false, Color.BLACK);

                if (!getAnswerReportValue(dgnssReport4, 4, "01", "02", "0").get("RANK_TOTAL").toString().equals("-1"))
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "01", "02", "0").get("RANK_TOTAL").toString(), pioPdfVO.px2mm(536f), pioPdfVO.px2mm(287f, "Y"), pioPdfVO.px2mm(6f), "Pretendard Medium", 10.5f, false, false, Color.BLACK);

                if (!getAnswerReportValue(dgnssReport4, 4, "02", "01", "0").get("RANK_TOTAL").toString().equals("-1"))
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "02", "01", "0").get("RANK_TOTAL").toString(), pioPdfVO.px2mm(536f), pioPdfVO.px2mm(384f, "Y"), pioPdfVO.px2mm(6f), "Pretendard Medium", 10.5f, false, false, Color.BLACK);

                if (!getAnswerReportValue(dgnssReport4, 4, "02", "02", "0").get("RANK_TOTAL").toString().equals("-1"))
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "02", "02", "0").get("RANK_TOTAL").toString(), pioPdfVO.px2mm(536f), pioPdfVO.px2mm(484f, "Y"), pioPdfVO.px2mm(6f), "Pretendard Medium", 10.5f, false, false, Color.BLACK);

                if (!getAnswerReportValue(dgnssReport4, 4, "02", "03", "0").get("RANK_TOTAL").toString().equals("-1"))
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "02", "03", "0").get("RANK_TOTAL").toString(), pioPdfVO.px2mm(536f), pioPdfVO.px2mm(593f, "Y"), pioPdfVO.px2mm(6f), "Pretendard Medium", 10.5f, false, false, Color.BLACK);

                if (!getAnswerReportValue(dgnssReport5, 5, "04", "01", "01").get("RANK_TOTAL").toString().equals("-1"))
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport5, 5, "04", "01", "01").get("RANK_TOTAL").toString(), pioPdfVO.px2mm(536f), pioPdfVO.px2mm(680f, "Y"), pioPdfVO.px2mm(6f), "Pretendard Medium", 10.5f, false, false, Color.BLACK);

                if (!getAnswerReportValue(dgnssReport5, 5, "04", "01", "02").get("RANK_TOTAL").toString().equals("-1"))
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport5, 5, "04", "01", "02").get("RANK_TOTAL").toString(), pioPdfVO.px2mm(536f), pioPdfVO.px2mm(705f, "Y"), pioPdfVO.px2mm(6f), "Pretendard Medium", 10.5f, false, false, Color.BLACK);

                if (!getAnswerReportValue(dgnssReport5, 5, "04", "01", "03").get("RANK_TOTAL").toString().equals("-1"))
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport5, 5, "04", "01", "03").get("RANK_TOTAL").toString(), pioPdfVO.px2mm(536f), pioPdfVO.px2mm(730f, "Y"), pioPdfVO.px2mm(6f), "Pretendard Medium", 10.5f, false, false, Color.BLACK);

                if (!getAnswerReportValue(dgnssReport5, 5, "04", "02", "01").get("RANK_TOTAL").toString().equals("-1"))
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport5, 5, "04", "02", "01").get("RANK_TOTAL").toString(), pioPdfVO.px2mm(536f), pioPdfVO.px2mm(755f, "Y"), pioPdfVO.px2mm(6f), "Pretendard Medium", 10.5f, false, false, Color.BLACK);

                if (!getAnswerReportValue(dgnssReport5, 5, "04", "02", "02").get("RANK_TOTAL").toString().equals("-1"))
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport5, 5, "04", "02", "02").get("RANK_TOTAL").toString(), pioPdfVO.px2mm(536f), pioPdfVO.px2mm(780f, "Y"), pioPdfVO.px2mm(6f), "Pretendard Medium", 10.5f, false, false, Color.BLACK);

                if (!getAnswerReportValue(dgnssReport5, 5, "04", "02", "03").get("RANK_TOTAL").toString().equals("-1"))
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport5, 5, "04", "02", "03").get("RANK_TOTAL").toString(), pioPdfVO.px2mm(536f), pioPdfVO.px2mm(805f, "Y"), pioPdfVO.px2mm(6f), "Pretendard Medium", 10.5f, false, false, Color.BLACK);

            } else if (page == 20) {
                String class3 = "";

                String[] imgFile = new String[13];
                float[] x1 = new float[13];
                float[] y1 = new float[13];

                y1[0] = pioPdfVO.px2mm(175f, "Y");
                y1[1] = pioPdfVO.px2mm(200f, "Y");
                y1[2] = pioPdfVO.px2mm(225f, "Y");
                y1[3] = pioPdfVO.px2mm(250f, "Y");
                y1[4] = pioPdfVO.px2mm(275f, "Y");
                y1[5] = pioPdfVO.px2mm(299f, "Y");
                y1[6] = pioPdfVO.px2mm(325f, "Y");
                y1[7] = pioPdfVO.px2mm(349f, "Y");
                y1[8] = pioPdfVO.px2mm(374f, "Y");
                y1[9] = pioPdfVO.px2mm(400f, "Y");
                y1[10] = pioPdfVO.px2mm(446f, "Y");
                y1[11] = pioPdfVO.px2mm(471f, "Y");
                y1[12] = pioPdfVO.px2mm(496f, "Y");

                imgFile[0] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "03", "01", "01").get("T_RANK").toString(), "dgnss10", true, page - 1);
                imgFile[1] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "03", "01", "02").get("T_RANK").toString(), "dgnss10", true, page - 1);
                imgFile[2] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "03", "01", "03").get("T_RANK").toString(), "dgnss10", true, page - 1);
                imgFile[3] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "03", "02", "01").get("T_RANK").toString(), "dgnss10", true, page - 1);
                imgFile[4] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "03", "02", "02").get("T_RANK").toString(), "dgnss10", true, page - 1);
                imgFile[5] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "03", "02", "03").get("T_RANK").toString(), "dgnss10", true, page - 1);
                imgFile[6] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "03", "02", "04").get("T_RANK").toString(), "dgnss10", true, page - 1);
                imgFile[7] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "03", "02", "05").get("T_RANK").toString(), "dgnss10", true, page - 1);
                imgFile[8] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "03", "03", "01").get("T_RANK").toString(), "dgnss10", true, page - 1);
                imgFile[9] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "03", "03", "02").get("T_RANK").toString(), "dgnss10", true, page - 1);
                imgFile[10] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "05", "01", "01").get("T_RANK").toString(), "dgnss10", true, page - 1);
                imgFile[11] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "05", "01", "02").get("T_RANK").toString(), "dgnss10", true, page - 1);
                imgFile[12] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, "05", "01", "03").get("T_RANK").toString(), "dgnss10", true, page - 1);

                for (int i = 0; i < 13; i++) {
                    if (imgFile[i].contains("ico_mark_high"))
                        x1[i] = pioPdfVO.px2mm(257f);
                    else if (imgFile[i].contains("ico_mark_mid"))
                        x1[i] = pioPdfVO.px2mm(321f);
                    else if (imgFile[i].contains("ico_mark_low"))
                        x1[i] = pioPdfVO.px2mm(385f);
                    else
                        x1[i] = 0;
                }

                for (int i = 0; i < 13; i++) {
                    pioPdfVO.drawPicture(imgFile[i], x1[i], y1[i], pioPdfVO.px2mm(14f), pioPdfVO.px2mm(14f));
                }

                // 종합등급
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "03", "01", "0").get("T_RANK").toString(), pioPdfVO.px2mm(452f), pioPdfVO.px2mm(199f, "Y"), pioPdfVO.px2mm(34f), "Pretendard Medium", 10.5f, false, false, Color.BLACK, -0.5f);
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "03", "02", "0").get("T_RANK").toString(), pioPdfVO.px2mm(452f), pioPdfVO.px2mm(299f, "Y"), pioPdfVO.px2mm(34f), "Pretendard Medium", 10.5f, false, false, Color.BLACK, -0.5f);
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "03", "03", "0").get("T_RANK").toString(), pioPdfVO.px2mm(452f), pioPdfVO.px2mm(386f, "Y"), pioPdfVO.px2mm(34f), "Pretendard Medium", 10.5f, false, false, Color.BLACK, -0.5f);
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "05", "01", "0").get("T_RANK").toString(), pioPdfVO.px2mm(452f), pioPdfVO.px2mm(470f, "Y"), pioPdfVO.px2mm(34f), "Pretendard Medium", 10.5f, false, false, Color.BLACK, -0.5f);

                // 종합순위
                if (!getAnswerReportValue(dgnssReport4, 4, "03", "01", "0").get("RANK_TOTAL").toString().equals("-1"))
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "03", "01", "0").get("RANK_TOTAL").toString(), pioPdfVO.px2mm(536f), pioPdfVO.px2mm(199f, "Y"), pioPdfVO.px2mm(6f), "Pretendard Medium", 10.5f, false, false, Color.BLACK);

                if (!getAnswerReportValue(dgnssReport4, 4, "03", "02", "0").get("RANK_TOTAL").toString().equals("-1"))
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "03", "02", "0").get("RANK_TOTAL").toString(), pioPdfVO.px2mm(536f), pioPdfVO.px2mm(299f, "Y"), pioPdfVO.px2mm(6f), "Pretendard Medium", 10.5f, false, false, Color.BLACK);

                if (!getAnswerReportValue(dgnssReport4, 4, "03", "03", "0").get("RANK_TOTAL").toString().equals("-1"))
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, "03", "03", "0").get("RANK_TOTAL").toString(), pioPdfVO.px2mm(536f), pioPdfVO.px2mm(386f, "Y"), pioPdfVO.px2mm(6f), "Pretendard Medium", 10.5f, false, false, Color.BLACK);


                if (!getAnswerReportValue(dgnssReport5, 5, "05", "01", "01").get("RANK_TOTAL").toString().equals("-1"))
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport5, 5, "05", "01", "01").get("RANK_TOTAL").toString(), pioPdfVO.px2mm(536f), pioPdfVO.px2mm(442f, "Y"), pioPdfVO.px2mm(6f), "Pretendard Medium", 10.5f, false, false, Color.BLACK);

                if (!getAnswerReportValue(dgnssReport5, 5, "05", "01", "02").get("RANK_TOTAL").toString().equals("-1"))
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport5, 5, "05", "01", "02").get("RANK_TOTAL").toString(), pioPdfVO.px2mm(536f), pioPdfVO.px2mm(467f, "Y"), pioPdfVO.px2mm(6f), "Pretendard Medium", 10.5f, false, false, Color.BLACK);

                if (!getAnswerReportValue(dgnssReport5, 5, "05", "01", "03").get("RANK_TOTAL").toString().equals("-1"))
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport5, 5, "05", "01", "03").get("RANK_TOTAL").toString(), pioPdfVO.px2mm(536f), pioPdfVO.px2mm(492f, "Y"), pioPdfVO.px2mm(6f), "Pretendard Medium", 10.5f, false, false, Color.BLACK);

            } else if (page == 21) {
                // 종합분석표  첫페이지

                int dataCount = 25;

                float xStart = pioPdfVO.px2mm(180f);      // 그래프 시작 위치
                float barWidth = pioPdfVO.px2mm(298f);      // 그래프 바 넓이

                float[] y = new float[dataCount];   // 테이블 각각 높이
                // float height = Double.valueOf(187.0 / 22.0).floatValue();   // 테이블 행 높이
                float height = Double.valueOf(pioPdfVO.px2mm(601f) / dataCount).floatValue();   // 테이블 행 높이

                int i = 0;

                y[0] = pioPdfVO.px2mm(238f, "Y");

                for (i = 1; i < dataCount; i++)
                    y[i] = y[i - 1] - height;

                // 기준선에서 텍스트 높이
                float textHeight = 3f;

                int dgnssOrd = Integer.parseInt(userInfo.get("DGNSS_ORD").toString());

                // 종합해석 1차, 2차 변화 X 좌표
                float[] x1 = new float[4];
                x1[0] = pioPdfVO.px2mm(488f);
                x1[1] = pioPdfVO.px2mm(520f);
                x1[2] = pioPdfVO.px2mm(548f);
                x1[3] = pioPdfVO.px2mm(556f);

                float x1Width = pioPdfVO.px2mm(14f);
                float x3Width = pioPdfVO.px2mm(12f);

                if (dgnssOrd == 1) {

                    pioPdfVO.drawText(userInfo.get("DGNSS_ORD").toString() + "차", pioPdfVO.px2mm(488f), pioPdfVO.px2mm(204.5f, "Y"), "Pretendard Medium", 9.5f, false, false, Color.BLACK);

                    float[] t_score5_1 = new float[7];
                    float[] t_score5_2 = new float[12];
                    float[] t_score5_3 = new float[6];

                    t_score5_1[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "01").get("T_SCORE").toString());
                    t_score5_1[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "02").get("T_SCORE").toString());
                    t_score5_1[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "03").get("T_SCORE").toString());
                    t_score5_1[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "01").get("T_SCORE").toString());
                    t_score5_1[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "02").get("T_SCORE").toString());
                    t_score5_1[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "03").get("T_SCORE").toString());
                    t_score5_1[6] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "04").get("T_SCORE").toString());

                    t_score5_2[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "01").get("T_SCORE").toString());
                    t_score5_2[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "02").get("T_SCORE").toString());
                    t_score5_2[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "03").get("T_SCORE").toString());
                    t_score5_2[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "01").get("T_SCORE").toString());
                    t_score5_2[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "02").get("T_SCORE").toString());
                    t_score5_2[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "03").get("T_SCORE").toString());
                    t_score5_2[6] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "04").get("T_SCORE").toString());
                    t_score5_2[7] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "05").get("T_SCORE").toString());
                    t_score5_2[8] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "03", "01").get("T_SCORE").toString());
                    t_score5_2[9] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "03", "02").get("T_SCORE").toString());
                    t_score5_2[10] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "03", "03").get("T_SCORE").toString());
                    t_score5_2[11] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "03", "04").get("T_SCORE").toString());

                    t_score5_3[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "01", "01").get("T_SCORE").toString());
                    t_score5_3[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "01", "02").get("T_SCORE").toString());
                    t_score5_3[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "01", "03").get("T_SCORE").toString());
                    t_score5_3[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "02", "01").get("T_SCORE").toString());
                    t_score5_3[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "02", "02").get("T_SCORE").toString());
                    t_score5_3[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "02", "03").get("T_SCORE").toString());

                    pioPdfVO.drawGraph01(t_score5_1, xStart, y[0] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#00D282"));
                    pioPdfVO.drawGraph01(t_score5_2, xStart, y[7] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#41BEFF"));
                    pioPdfVO.drawGraph01(t_score5_3, xStart, y[19] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#4F96FE"));


                    for (i = 0; i < 7; i++) {
                        if (t_score5_1[i] > 0)
                            pioPdfVO.drawTextC(Integer.toString((int) (t_score5_1[i])), x1[0], y[i] + textHeight, x1Width, "", 9.5f, false, false, Color.BLACK);
                    }

                    for (i = 0; i < 12; i++) {
                        if (t_score5_2[i] > 0)
                            pioPdfVO.drawTextC(Integer.toString((int) (t_score5_2[i])), x1[0], y[7 + i] + textHeight, x1Width, "", 9.5f, false, false, Color.BLACK);
                    }

                    for (i = 0; i < 6; i++) {
                        if (t_score5_3[i] > 0)
                            pioPdfVO.drawTextC(Integer.toString((int) (t_score5_3[i])), x1[0], y[19 + i] + textHeight, x1Width, "", 9.5f, false, false, Color.BLACK);
                    }

                } else {
                    pioPdfVO.drawText(userInfo.get("DGNSS_ORD_FIRST").toString() + "차", pioPdfVO.px2mm(488f), pioPdfVO.px2mm(204.5f, "Y"), "Pretendard Medium", 9.5f, false, false, Color.BLACK);
                    pioPdfVO.drawText(userInfo.get("DGNSS_ORD").toString() + "차", pioPdfVO.px2mm(519f), pioPdfVO.px2mm(204.5f, "Y"), "Pretendard Medium", 9.5f, false, false, Color.BLACK);


                    float[] t_score5_1_first = new float[7];
                    float[] t_score5_2_first = new float[12];
                    float[] t_score5_3_first = new float[6];

                    float[] t_score5_1 = new float[7];
                    float[] t_score5_2 = new float[12];
                    float[] t_score5_3 = new float[6];

                    float[] t_score5_1_gap = new float[7];
                    float[] t_score5_2_gap = new float[12];
                    float[] t_score5_3_gap = new float[6];


                    t_score5_1_first[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "01").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "02").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "03").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "01").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "02").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "03").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[6] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "04").get("T_SCORE_FIRST").toString());

                    t_score5_2_first[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "01").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "02").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "03").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "01").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "02").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "03").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[6] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "04").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[7] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "05").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[8] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "03", "01").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[9] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "03", "02").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[10] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "03", "03").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[11] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "03", "04").get("T_SCORE_FIRST").toString());

                    t_score5_3_first[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "01", "01").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "01", "02").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "01", "03").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "02", "01").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "02", "02").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "02", "03").get("T_SCORE_FIRST").toString());


                    t_score5_1_gap[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "01").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "02").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "03").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "01").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "02").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "03").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[6] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "04").get("T_SCORE_GAP").toString());

                    t_score5_2_gap[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "01").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "02").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "03").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "01").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "02").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "03").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[6] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "04").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[7] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "05").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[8] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "03", "01").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[9] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "03", "02").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[10] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "03", "03").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[11] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "03", "04").get("T_SCORE_GAP").toString());

                    t_score5_3_gap[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "01", "01").get("T_SCORE_GAP").toString());
                    t_score5_3_gap[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "01", "02").get("T_SCORE_GAP").toString());
                    t_score5_3_gap[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "01", "03").get("T_SCORE_GAP").toString());
                    t_score5_3_gap[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "02", "01").get("T_SCORE_GAP").toString());
                    t_score5_3_gap[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "02", "02").get("T_SCORE_GAP").toString());
                    t_score5_3_gap[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "02", "03").get("T_SCORE_GAP").toString());


                    t_score5_1[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "01").get("T_SCORE").toString());
                    t_score5_1[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "02").get("T_SCORE").toString());
                    t_score5_1[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "03").get("T_SCORE").toString());
                    t_score5_1[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "01").get("T_SCORE").toString());
                    t_score5_1[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "02").get("T_SCORE").toString());
                    t_score5_1[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "03").get("T_SCORE").toString());
                    t_score5_1[6] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "04").get("T_SCORE").toString());

                    t_score5_2[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "01").get("T_SCORE").toString());
                    t_score5_2[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "02").get("T_SCORE").toString());
                    t_score5_2[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "03").get("T_SCORE").toString());
                    t_score5_2[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "01").get("T_SCORE").toString());
                    t_score5_2[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "02").get("T_SCORE").toString());
                    t_score5_2[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "03").get("T_SCORE").toString());
                    t_score5_2[6] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "04").get("T_SCORE").toString());
                    t_score5_2[7] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "05").get("T_SCORE").toString());
                    t_score5_2[8] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "03", "01").get("T_SCORE").toString());
                    t_score5_2[9] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "03", "02").get("T_SCORE").toString());
                    t_score5_2[10] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "03", "03").get("T_SCORE").toString());
                    t_score5_2[11] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "03", "04").get("T_SCORE").toString());

                    t_score5_3[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "01", "01").get("T_SCORE").toString());
                    t_score5_3[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "01", "02").get("T_SCORE").toString());
                    t_score5_3[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "01", "03").get("T_SCORE").toString());
                    t_score5_3[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "02", "01").get("T_SCORE").toString());
                    t_score5_3[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "02", "02").get("T_SCORE").toString());
                    t_score5_3[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "04", "02", "03").get("T_SCORE").toString());

                    pioPdfVO.drawGraph01(t_score5_1_first, xStart, y[0] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#A9ADB2"));
                    pioPdfVO.drawGraph01(t_score5_2_first, xStart, y[7] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#A9ADB2"));
                    pioPdfVO.drawGraph01(t_score5_3_first, xStart, y[19] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#A9ADB2"));

                    pioPdfVO.drawGraph01(t_score5_1, xStart, y[0] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#00D282"));
                    pioPdfVO.drawGraph01(t_score5_2, xStart, y[7] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#41BEFF"));
                    pioPdfVO.drawGraph01(t_score5_3, xStart, y[19] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#4F96FE"));

                    for (i = 0; i < 7; i++) {

                        if (t_score5_1_first[i] > 0)
                            pioPdfVO.drawTextC(Integer.toString((int) (t_score5_1_first[i])), x1[0], y[i] + textHeight, x1Width, "", 9.5f, false, false, Color.BLACK);

                        if (t_score5_1[i] > 0)
                            pioPdfVO.drawTextC(Integer.toString((int) (t_score5_1[i])), x1[1], y[i] + textHeight, x1Width, "", 9.5f, false, false, Color.BLACK);


                        if (t_score5_1_first[i] > 0 && t_score5_1[i] > 0) {
                            if (t_score5_1_gap[i] < 0f) {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_down_red.png", x1[2], y[i] + textHeight, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                                pioPdfVO.drawTextC(Integer.toString((int) (t_score5_1_gap[i])), x1[3], y[i] + textHeight, x3Width, "", 9.5f, false, false, pioPdfVO.hexa2Color("#FF4800"));
                            } else if (t_score5_1_gap[i] == 0f) {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_maintain.png", pioPdfVO.px2mm(555f), y[i] + (height / 2f), pioPdfVO.px2mm(8f), pioPdfVO.px2mm(1f));
                            } else {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_up_blue.png", x1[2], y[i] + textHeight, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                                pioPdfVO.drawTextC(Integer.toString((int) (t_score5_1_gap[i])), x1[3], y[i] + textHeight, x3Width, "", 9.5f, false, false, pioPdfVO.hexa2Color("#0B9DFF"));
                            }
                        }

                    }

                    for (i = 0; i < 12; i++) {
                        if (t_score5_2_first[i] > 0)
                            pioPdfVO.drawTextC(Integer.toString((int) (t_score5_2_first[i])), x1[0], y[7 + i] + textHeight, x1Width, "", 9.5f, false, false, Color.BLACK);

                        if (t_score5_2[i] > 0)
                            pioPdfVO.drawTextC(Integer.toString((int) (t_score5_2[i])), x1[1], y[7 + i] + textHeight, x1Width, "", 9.5f, false, false, Color.BLACK);


                        if (t_score5_2_first[i] > 0 && t_score5_2[i] > 0) {
                            if (t_score5_2_gap[i] < 0f) {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_down_red.png", x1[2], y[7 + i] + textHeight, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                                pioPdfVO.drawTextC(Integer.toString((int) (t_score5_2_gap[i])), x1[3], y[7 + i] + textHeight, x3Width, "", 9.5f, false, false, pioPdfVO.hexa2Color("#FF4800"));
                            } else if (t_score5_2_gap[i] == 0f) {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_maintain.png", pioPdfVO.px2mm(555f), y[7 + i] + (height / 2f), pioPdfVO.px2mm(8f), pioPdfVO.px2mm(1f));
                            } else {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_up_blue.png", x1[2], y[7 + i] + textHeight, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                                pioPdfVO.drawTextC(Integer.toString((int) (t_score5_2_gap[i])), x1[3], y[7 + i] + textHeight, x3Width, "", 9.5f, false, false, pioPdfVO.hexa2Color("#0B9DFF"));
                            }
                        }
                    }

                    for (i = 0; i < 6; i++) {
                        if (t_score5_3_first[i] > 0)
                            pioPdfVO.drawTextC(Integer.toString((int) (t_score5_3_first[i])), x1[0], y[19 + i] + textHeight, x1Width, "", 9.5f, false, false, Color.BLACK);

                        if (t_score5_3[i] > 0)
                            pioPdfVO.drawTextC(Integer.toString((int) (t_score5_3[i])), x1[1], y[19 + i] + textHeight, x1Width, "", 9.5f, false, false, Color.BLACK);

                        if (t_score5_3_first[i] > 0 && t_score5_3[i] > 0) {
                            if (t_score5_3_gap[i] < 0) {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_down_red.png", x1[2], y[19 + i] + textHeight, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                                pioPdfVO.drawTextC(Integer.toString((int) (t_score5_3_gap[i])), x1[3], y[19 + i] + textHeight, x3Width, "", 9.5f, false, false, pioPdfVO.hexa2Color("#FF4800"));
                            } else if (t_score5_3_gap[i] == 0) {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_maintain.png", pioPdfVO.px2mm(555f), y[19 + i] + (height / 2f), pioPdfVO.px2mm(8f), pioPdfVO.px2mm(1f));
                            } else {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_up_blue.png", x1[2], y[19 + i] + textHeight, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                                pioPdfVO.drawTextC(Integer.toString((int) (t_score5_3_gap[i])), x1[3], y[19 + i] + textHeight, x3Width, "", 9.5f, false, false, pioPdfVO.hexa2Color("#0B9DFF"));
                            }
                        }
                    }
                }
            }
            // 종합분석표  두번째페이지 (학습걸림돌, 부정적 공부마음)
            else if (page == 22) {

                int dataCount = 13;

                float xStart = pioPdfVO.px2mm(180f);      // 그래프 시작 위치
                float barWidth = pioPdfVO.px2mm(298f);      // 그래프 바 넓이

                float[] y = new float[dataCount];   // 테이블 각각 높이
                // float height = Double.valueOf(187.0 / 22.0).floatValue();   // 테이블 행 높이
                float height = Double.valueOf(pioPdfVO.px2mm(313f) / dataCount).floatValue();   // 테이블 행 높이

                int i = 0;

                y[0] = pioPdfVO.px2mm(238f, "Y");

                for (i = 1; i < dataCount; i++)
                    y[i] = y[i - 1] - height;

                // 기준선에서 텍스트 높이
                float textHeight = 3f;

                int dgnssOrd = Integer.parseInt(userInfo.get("DGNSS_ORD").toString());

                // 종합해석 1차, 2차 변화 X 좌표
                float[] x1 = new float[4];
                x1[0] = pioPdfVO.px2mm(488f);
                x1[1] = pioPdfVO.px2mm(520f);
                x1[2] = pioPdfVO.px2mm(548f);
                x1[3] = pioPdfVO.px2mm(556f);
                //                 {164.5f, 176.7f, 187.75f, 190.73f};
                float x1Width = pioPdfVO.px2mm(12f);
                float x3Width = pioPdfVO.px2mm(12f);

                if (dgnssOrd == 1) {

                    pioPdfVO.drawPicture("./assets/imgs/dgnss/btn/btn_total_anal_10_1st.png", pioPdfVO.px2mm(185f), pioPdfVO.px2mm(815f, "Y"), pioPdfVO.px2mm(220f), pioPdfVO.px2mm(33f));

                    pioPdfVO.drawText(userInfo.get("DGNSS_ORD").toString() + "차", pioPdfVO.px2mm(488f), pioPdfVO.px2mm(204.5f, "Y"), "Pretendard Medium", 9.5f, false, false, Color.BLACK);

                    float[] t_score5_1 = new float[10];
                    float[] t_score5_2 = new float[3];

                    t_score5_1[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "01").get("T_SCORE").toString());
                    t_score5_1[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "02").get("T_SCORE").toString());
                    t_score5_1[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "03").get("T_SCORE").toString());
                    t_score5_1[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "01").get("T_SCORE").toString());
                    t_score5_1[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "02").get("T_SCORE").toString());
                    t_score5_1[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "03").get("T_SCORE").toString());
                    t_score5_1[6] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "04").get("T_SCORE").toString());
                    t_score5_1[7] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "05").get("T_SCORE").toString());
                    t_score5_1[8] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "03", "01").get("T_SCORE").toString());
                    t_score5_1[9] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "03", "02").get("T_SCORE").toString());

                    t_score5_2[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "05", "01", "01").get("T_SCORE").toString());
                    t_score5_2[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "05", "01", "02").get("T_SCORE").toString());
                    t_score5_2[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "05", "01", "03").get("T_SCORE").toString());

                    pioPdfVO.drawGraph01(t_score5_1, xStart, y[0] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#FF849F"));
                    pioPdfVO.drawGraph01(t_score5_2, xStart, y[10] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#FF87D4"));

                    for (i = 0; i < 10; i++) {
                        if (t_score5_1[i] > 0)
                            pioPdfVO.drawTextC(Integer.toString((int) (t_score5_1[i])), x1[0], y[i] + textHeight, x1Width, "", 9.5f, false, false, Color.BLACK);
                    }

                    for (i = 0; i < 3; i++) {
                        if (t_score5_2[i] > 0)
                            pioPdfVO.drawTextC(Integer.toString((int) (t_score5_2[i])), x1[0], y[10 + i] + textHeight, x1Width, "", 9.5f, false, false, Color.BLACK);
                    }

                    pioPdfVO.drawTextC(userInfo.get("DGNSS_ORD").toString() + "차 : " + userInfo.get("RSPNS_DT"), pioPdfVO.px2mm(211f), pioPdfVO.px2mm(803f, "Y"), pioPdfVO.px2mm(68f), "Pretendard Medium", 10f, false, false, Color.BLACK, -0.48f);
                } else {

                    pioPdfVO.drawPicture("./assets/imgs/dgnss/btn/btn_total_anal_10_nst.png", pioPdfVO.px2mm(185f), pioPdfVO.px2mm(815f, "Y"), pioPdfVO.px2mm(220f), pioPdfVO.px2mm(33f));

                    pioPdfVO.drawText(userInfo.get("DGNSS_ORD_FIRST").toString() + "차", pioPdfVO.px2mm(488f), pioPdfVO.px2mm(204.5f, "Y"), "Pretendard Medium", 9.5f, false, false, Color.BLACK);
                    pioPdfVO.drawText(userInfo.get("DGNSS_ORD").toString() + "차", pioPdfVO.px2mm(519f), pioPdfVO.px2mm(204.5f, "Y"), "Pretendard Medium", 9.5f, false, false, Color.BLACK);


                    float[] t_score5_1_first = new float[10];
                    float[] t_score5_2_first = new float[3];

                    float[] t_score5_1_gap = new float[10];
                    float[] t_score5_2_gap = new float[3];

                    float[] t_score5_1 = new float[10];
                    float[] t_score5_2 = new float[3];

                    t_score5_1_first[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "01").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "02").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "03").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "01").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "02").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "03").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[6] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "04").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[7] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "05").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[8] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "03", "01").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[9] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "03", "02").get("T_SCORE_FIRST").toString());

                    t_score5_2_first[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "05", "01", "01").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "05", "01", "02").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "05", "01", "03").get("T_SCORE_FIRST").toString());

                    t_score5_1_gap[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "01").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "02").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "03").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "01").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "02").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "03").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[6] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "04").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[7] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "05").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[8] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "03", "01").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[9] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "03", "02").get("T_SCORE_GAP").toString());

                    t_score5_2_gap[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "05", "01", "01").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "05", "01", "02").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "05", "01", "03").get("T_SCORE_GAP").toString());


                    t_score5_1[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "01").get("T_SCORE").toString());
                    t_score5_1[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "02").get("T_SCORE").toString());
                    t_score5_1[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "03").get("T_SCORE").toString());
                    t_score5_1[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "01").get("T_SCORE").toString());
                    t_score5_1[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "02").get("T_SCORE").toString());
                    t_score5_1[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "03").get("T_SCORE").toString());
                    t_score5_1[6] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "04").get("T_SCORE").toString());
                    t_score5_1[7] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "05").get("T_SCORE").toString());
                    t_score5_1[8] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "03", "01").get("T_SCORE").toString());
                    t_score5_1[9] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "03", "02").get("T_SCORE").toString());

                    t_score5_2[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "05", "01", "01").get("T_SCORE").toString());
                    t_score5_2[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "05", "01", "02").get("T_SCORE").toString());
                    t_score5_2[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "05", "01", "03").get("T_SCORE").toString());


                    pioPdfVO.drawGraph01(t_score5_1_first, xStart, y[0] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#A9ADB2"));
                    pioPdfVO.drawGraph01(t_score5_2_first, xStart, y[10] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#A9ADB2"));

                    pioPdfVO.drawGraph01(t_score5_1, xStart, y[0] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#FF849F"));
                    pioPdfVO.drawGraph01(t_score5_2, xStart, y[10] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#FF87D4"));

                    for (i = 0; i < 10; i++) {
                        if (t_score5_1_first[i] > 0)
                            pioPdfVO.drawTextC(Integer.toString((int) (t_score5_1_first[i])), x1[0], y[i] + textHeight, x1Width, "", 9.5f, false, false, Color.BLACK);

                        if (t_score5_1[i] > 0)
                            pioPdfVO.drawTextC(Integer.toString((int) (t_score5_1[i])), x1[1], y[i] + textHeight, x1Width, "", 9.5f, false, false, Color.BLACK);

                        if (t_score5_1_first[i] > 0 && t_score5_1[i] > 0) {
                            if (t_score5_1_gap[i] < 0f) {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_down_blue.png", x1[2], y[i] + textHeight, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                                pioPdfVO.drawTextC(Integer.toString((int) (t_score5_1_gap[i])), x1[3], y[i] + textHeight, x3Width, "", 9.5f, false, false, pioPdfVO.hexa2Color("#0B9DFF"));
                            } else if (t_score5_1_gap[i] == 0f) {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_maintain.png", pioPdfVO.px2mm(555f), y[i] + (height / 2), pioPdfVO.px2mm(8f), pioPdfVO.px2mm(1f));
                            } else {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_up_red.png", x1[2], y[i] + textHeight, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                                pioPdfVO.drawTextC(Integer.toString((int) (t_score5_1_gap[i])), x1[3], y[i] + textHeight, x3Width, "", 9.5f, false, false, pioPdfVO.hexa2Color("#FF4800"));
                            }
                        }

                    }

                    for (i = 0; i < 3; i++) {
                        if (t_score5_2_first[i] > 0)
                            pioPdfVO.drawTextC(Integer.toString((int) (t_score5_2_first[i])), x1[0], y[10 + i] + textHeight, x1Width, "", 9.5f, false, false, Color.BLACK);
                        else
                            pioPdfVO.drawTextC("?", x1[0], y[10 + i] + textHeight, x1Width, "", 9.5f, false, false, Color.BLACK);

                        if (t_score5_2[i] > 0)
                            pioPdfVO.drawTextC(Integer.toString((int) (t_score5_2[i])), x1[1], y[10 + i] + textHeight, x1Width, "", 9.5f, false, false, Color.BLACK);
                        else
                            pioPdfVO.drawTextC("?", x1[1], y[10 + i] + textHeight, x1Width, "", 9.5f, false, false, Color.BLACK);

                        if (t_score5_2_first[i] > 0 && t_score5_2[i] > 0) {
                            if (t_score5_2_gap[i] < 0f) {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_down_blue.png", x1[2], y[10 + i] + textHeight, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                                pioPdfVO.drawTextC(Integer.toString((int) (t_score5_2_gap[i])), x1[3], y[10 + i] + textHeight, x3Width, "", 9.5f, false, false, pioPdfVO.hexa2Color("#0B9DFF"));
                            } else if (t_score5_2_gap[i] == 0f) {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_maintain.png", pioPdfVO.px2mm(555f), y[10 + i] + (height / 2f), pioPdfVO.px2mm(8f), pioPdfVO.px2mm(1f));
                            } else {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_up_red.png", x1[2], y[10 + i] + textHeight, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                                pioPdfVO.drawTextC(Integer.toString((int) (t_score5_2_gap[i])), x1[3], y[10 + i] + textHeight, x3Width, "", 9.5f, false, false, pioPdfVO.hexa2Color("#FF4800"));
                            }
                        }
                    }

                    pioPdfVO.drawText(userInfo.get("DGNSS_ORD_FIRST").toString() + "차 : " + userInfo.get("RSPNS_DT_FIRST"), pioPdfVO.px2mm(211f), pioPdfVO.px2mm(803f, "Y"), "", 10f, false, false, pioPdfVO.hexa2Color("#A9ADB2"), -0.48f);
                    pioPdfVO.drawText(userInfo.get("DGNSS_ORD").toString() + "차 : " + userInfo.get("RSPNS_DT"), pioPdfVO.px2mm(310f), pioPdfVO.px2mm(803f, "Y"), "Pretendard Medium", 10f, false, false, Color.BLACK, -0.48f);

                }
            } else if (page == 23) {

                float[] x = new float[12];
                float[] x1 = new float[12];        // 낮음, 보통, 높음
                float[] y = new float[12];
                float width = pioPdfVO.px2mm(86f);

                x[0] = pioPdfVO.px2mm(123f);
                x[1] = pioPdfVO.px2mm(123f);
                x[2] = pioPdfVO.px2mm(123f);
                x[3] = pioPdfVO.px2mm(369f);
                x[4] = pioPdfVO.px2mm(369f);
                x[5] = pioPdfVO.px2mm(369f);
                x[6] = pioPdfVO.px2mm(123f);
                x[7] = pioPdfVO.px2mm(123f);
                x[8] = pioPdfVO.px2mm(123f);
                x[9] = pioPdfVO.px2mm(369f);
                x[10] = pioPdfVO.px2mm(369f);
                x[11] = pioPdfVO.px2mm(369f);

                y[0] = pioPdfVO.px2mm(285f, "Y");
                y[1] = pioPdfVO.px2mm(319f, "Y");
                y[2] = pioPdfVO.px2mm(352f, "Y");
                y[3] = pioPdfVO.px2mm(285f, "Y");
                y[4] = pioPdfVO.px2mm(319f, "Y");
                y[5] = pioPdfVO.px2mm(352f, "Y");

                y[6] = pioPdfVO.px2mm(387f, "Y");
                y[7] = pioPdfVO.px2mm(421f, "Y");
                y[8] = pioPdfVO.px2mm(454f, "Y");
                y[9] = pioPdfVO.px2mm(387f, "Y");
                y[10] = pioPdfVO.px2mm(421f, "Y");
                y[11] = pioPdfVO.px2mm(454f, "Y");

                for (int i = 0; i < 12; i++) {
                    pioPdfVO.drawTextC(dgnssReportStudy.get(i).get("SECTION_NM").toString(), x[i], y[i] + pioPdfVO.px2mm(4f), width, "Pretendard Medium", 10f, false, false, Color.BLACK);
                    // pioPdfVO.drawTextC(dgnssReportStudy.get(0).get("SECTION_NM").toString(), x[0], y[0], width, "", 10f, false, false, Color.BLACK);
                }

                String[] imgFile = new String[12];

                for (int i = 0; i < 12; i++) {
                    if ((i >= 0 && i <= 2) || (i >= 6 && i <= 8)) {
                        imgFile[i] = getMarkLevel3ImageFileName(dgnssReportStudy.get(i).get("T_RANK").toString(), "dgnss10", false, page - 1);

                        if (imgFile[i].contains("ico_mark_high"))
                            x1[i] = pioPdfVO.px2mm(303f);
                        else if (imgFile[i].contains("ico_mark_mid"))
                            x1[i] = pioPdfVO.px2mm(266f);
                        else if (imgFile[i].contains("ico_mark_low"))
                            x1[i] = pioPdfVO.px2mm(229f);
                        else
                            x1[i] = 0;
                    } else {
                        imgFile[i] = getMarkLevel3ImageFileName(dgnssReportStudy.get(i).get("T_RANK").toString(), "dgnss10", true, page - 1);

                        if (imgFile[i].contains("ico_mark_high"))
                            x1[i] = pioPdfVO.px2mm(475f);
                        else if (imgFile[i].contains("ico_mark_mid"))
                            x1[i] = pioPdfVO.px2mm(512f);
                        else if (imgFile[i].contains("ico_mark_low"))
                            x1[i] = pioPdfVO.px2mm(549f);
                        else
                            x1[i] = 0;
                    }
                }

                for (int i = 0; i < 12; i++)
                    pioPdfVO.drawPicture(imgFile[i], x1[i], y[i], pioPdfVO.px2mm(14f), pioPdfVO.px2mm(14f));

                // 공부마음 종합 분석

                float[] x2 = new float[3];
                float[] y2 = new float[3];
                String[] imgFile2 = new String[3];

                y2[0] = pioPdfVO.px2mm(736f, "Y");
                y2[1] = pioPdfVO.px2mm(770f, "Y");
                y2[2] = pioPdfVO.px2mm(804f, "Y");

                // 1. 학업열의 2. 성장력  3. 학업소진
                imgFile2[0] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport4, 4, "04", "01", "0").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile2[1] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport4, 4, "04", "02", "0").get("T_RANK").toString(), "dgnss10", false, page - 1);
                imgFile2[2] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport4, 4, "05", "01", "0").get("T_RANK").toString(), "dgnss10", true, page - 1);

                for (int i = 0; i < 3; i++) {
                    if (i < 2) {
                        if (imgFile2[i].contains("ico_mark_high"))
                            x2[i] = pioPdfVO.px2mm(497f);
                        else if (imgFile2[i].contains("ico_mark_mid"))
                            x2[i] = pioPdfVO.px2mm(357f);
                        else if (imgFile2[i].contains("ico_mark_low"))
                            x2[i] = pioPdfVO.px2mm(217f);
                        else
                            x2[i] = 0;
                    } else {
                        if (imgFile2[i].contains("ico_mark_high"))
                            x2[i] = pioPdfVO.px2mm(217f);
                        else if (imgFile2[i].contains("ico_mark_mid"))
                            x2[i] = pioPdfVO.px2mm(357f);
                        else if (imgFile2[i].contains("ico_mark_low"))
                            x2[i] = pioPdfVO.px2mm(497f);
                        else
                            x2[i] = 0;
                    }
                }

                for (int i = 0; i < 3; i++)
                    pioPdfVO.drawPicture(imgFile2[i], x2[i], y2[i], pioPdfVO.px2mm(14f), pioPdfVO.px2mm(14f));


            }
        } catch (NullPointerException e) {
            log.error("DGNSS10 페이지 생성 실패 - 데이터 누락: {}", e.getMessage());
        } catch (IOException e) {
            log.error("DGNSS10 페이지 생성 실패 - I/O 오류: {}", e.getMessage());
        } catch (Exception e) {
            log.error("DGNSS10 페이지 생성 실패 - 예상치 못한 오류: {}", e.getMessage());
        }
    }

    public void addDgnssPage_DGNSS20(PioPdfVO pioPdfVO, PDDocument doc, PDPageContentStream cont, int page, Map<String, Object> userInfo, List<Map<String, Object>> dgnssReport3, List<Map<String, Object>> dgnssReport4, List<Map<String, Object>> dgnssReport5) throws IOException {
        try {
            // 첫 페이지에서 캐시 초기화 및 선행 로드 (O(n) 순회를 1회로 제한)
            if (page == 1) {
                reportCacheMap.clear();
                if (dgnssReport3 != null) buildReportCache(dgnssReport3, 3);
                if (dgnssReport4 != null) buildReportCache(dgnssReport4, 4);
                if (dgnssReport5 != null) buildReportCache(dgnssReport5, 5);
            }

            // 대분류 점수 배열

            if (Integer.parseInt(userInfo.get("DGNSS_ORD").toString()) == 1 && (page == 16 || page == 17))
                pioPdfVO.drawPageBackground("template02", page, 2);
            else
                pioPdfVO.drawPageBackground("template02", page, 0);


            if (page > 1 && page != 18) {
                pioPdfVO.drawHeader(page, userInfo);
                pioPdfVO.drawFooter();
            }

            // cont.drawImage(pdImage, 0f, 0f, pdImage.getWidth(), pdImage.getHeight());

            if (page == 1) {
                //                float x = 87.02f;
                //                float width = 54.18f;
                //                float fontSize = 11.52f;
                //
                //                pioPdfVO.drawTextC((String)userInfo.get("MEM_NM"), x, 80f, width, "", fontSize, false, false, Color.BLACK);
                //                pioPdfVO.drawTextC((String)userInfo.get("RSPNS_DT_KO"), x, 70f, width, "", fontSize, false, false, Color.BLACK);
                //                pioPdfVO.drawTextC( (String)userInfo.get("SCH_NM"), x, 60f, width, "", fontSize, false, false, Color.BLACK);
                //                pioPdfVO.drawTextC((String)userInfo.get("MEM_GRADE_NM") + " " +  (String)userInfo.get("CLASS_NM") + " " + (String)userInfo.get("CLASS_NO"), x, 50f, width, "", fontSize, false, false, Color.BLACK);
                //                pioPdfVO.drawTextC("", x, 40f, width, "", fontSize, false, false, Color.BLACK);

                // pioPdfVO.drawPicture("./assets/imgs/dgnss/logo/school_snu.png", 5f, 250f, 2*23.0f, 2*17.4f );


                float x = pioPdfVO.px2mm(298f);
                float width = pioPdfVO.px2mm(88f);
                float fontSize = 12f;
                float fontHeight = 10f;

                // 이름
                pioPdfVO.drawTextC((String) userInfo.get("MEM_NM"), x, pioPdfVO.px2mm(600f - fontHeight, "Y"), width, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                // 검사일
                pioPdfVO.drawTextC((String) userInfo.get("RSPNS_DT_KO"), x, pioPdfVO.px2mm(632f - fontHeight, "Y"), width, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                // 학교
                pioPdfVO.drawTextC((String) userInfo.get("SCH_NM"), x, pioPdfVO.px2mm(663f - fontHeight, "Y"), width, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                // 학급
                pioPdfVO.drawTextC(userInfo.get("MEM_GRADE_NM") + " " + userInfo.get("CLASS_NM"), x, pioPdfVO.px2mm(695f - fontHeight, "Y"), width, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                // 번호(현재는 해석전문가)
                pioPdfVO.drawTextC((String.valueOf(userInfo.getOrDefault("CLASS_NO", "")).isBlank() ? "-" : userInfo.get("CLASS_NO") + "번"), x, pioPdfVO.px2mm(727f - fontHeight, "Y"), width, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);


            } else if (page == 4) {
                float fontSize = 11f;
                float x = pioPdfVO.px2mm(177f);

                float y1 = pioPdfVO.px2mm(225f, "Y");
                float y2 = pioPdfVO.px2mm(255f, "Y");
                float y3 = pioPdfVO.px2mm(285f, "Y");

                // 사회적 바람직성
                if (userInfo.get("COCH_DGNSS_QESITM02_MARK").toString().equals("양호"))
                    pioPdfVO.drawText("양호", x, y1, "Pretendard SemiBold", fontSize, false, false, Color.BLACK, -0.53f);
                else if (userInfo.get("COCH_DGNSS_QESITM02_MARK").toString().equals("주의"))
                    pioPdfVO.drawText("주의", x, y1, "Pretendard SemiBold", fontSize, false, false, pioPdfVO.hexa2Color("#FF4800"), -0.53f);

                // 반응 일관성
                if (userInfo.get("COCH_DGNSS_QESITM01_MARK").toString().equals("양호"))
                    pioPdfVO.drawText("양호", x, y2, "Pretendard SemiBold", fontSize, false, false, Color.BLACK, -0.53f);
                else if (userInfo.get("COCH_DGNSS_QESITM01_MARK").toString().equals("주의"))
                    pioPdfVO.drawText("주의", x, y2, "Pretendard SemiBold", fontSize, false, false, pioPdfVO.hexa2Color("#FF4800"), -0.53f);

                // 연속 동일반응
                if (userInfo.get("REPEATED_RESPONSE_YN").toString().equals("양호"))
                    pioPdfVO.drawText("양호", x, y3, "Pretendard SemiBold", fontSize, false, false, Color.BLACK, -0.53f);
                else if (userInfo.get("REPEATED_RESPONSE_YN").toString().equals("주의"))
                    pioPdfVO.drawText("주의", x, y3, "Pretendard SemiBold", fontSize, false, false, pioPdfVO.hexa2Color("#FF4800"), -0.53f);


            }
            // 해석가이드
            else if (page == 5) {
                float[] x = new float[5];
                float[] y1 = new float[2];

                float x2;
                float[] y2 = new float[5];


                String[] avgStudyTime = new String[5];

                if (userInfo.get("MEM_NM").toString().length() > 4) {
                    pioPdfVO.drawTextC(userInfo.get("MEM_NM").toString(), pioPdfVO.px2mm(195f), pioPdfVO.px2mm(164f, "Y"), pioPdfVO.px2mm(40f), "Pretendard", 16f, true, false, Color.BLACK);
                } else {
                    pioPdfVO.drawTextC(userInfo.get("MEM_NM").toString(), pioPdfVO.px2mm(207f), pioPdfVO.px2mm(164f, "Y"), pioPdfVO.px2mm(40f), "Pretendard", 16f, true, false, Color.BLACK);
                }

                x[0] = pioPdfVO.px2mm(61.5f);
                x[1] = pioPdfVO.px2mm(115f);
                x[2] = pioPdfVO.px2mm(169.5f);
                x[3] = pioPdfVO.px2mm(223.5f);
                x[4] = pioPdfVO.px2mm(277.5f);

                y1[0] = pioPdfVO.px2mm(286f, "Y");
                y1[1] = pioPdfVO.px2mm(385f, "Y");


                x2 = pioPdfVO.px2mm(291f);

                y2[0] = pioPdfVO.px2mm(492f, "Y");
                y2[1] = pioPdfVO.px2mm(514.4f, "Y");
                y2[2] = pioPdfVO.px2mm(536.8f, "Y");
                y2[3] = pioPdfVO.px2mm(559.2f, "Y");
                y2[4] = pioPdfVO.px2mm(581.6f, "Y");

                avgStudyTime[0] = "전혀 안함";
                avgStudyTime[1] = "1시간 미만";
                avgStudyTime[2] = "1시간 이상~2시간 미만";
                avgStudyTime[3] = "2시간 이상~3시간 미만";
                avgStudyTime[4] = "3시간 이상";

                String[] lsAns05FileName = new String[5];

                lsAns05FileName[0] = "./assets/imgs/dgnss/btn/btn_ans05_1.png";
                lsAns05FileName[1] = "./assets/imgs/dgnss/btn/btn_ans05_2.png";
                lsAns05FileName[2] = "./assets/imgs/dgnss/btn/btn_ans05_3.png";
                lsAns05FileName[3] = "./assets/imgs/dgnss/btn/btn_ans05_4.png";
                lsAns05FileName[4] = "./assets/imgs/dgnss/btn/btn_ans05_5.png";


                if (userInfo.get("LS_ANS01") != null && !StringUtils.isEmpty(userInfo.get("LS_ANS01").toString())) {
                    pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_check_p4.png", x[Integer.parseInt(userInfo.get("LS_ANS01").toString()) - 1], y1[0], pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                }

                if (userInfo.get("LS_ANS02") != null && !StringUtils.isEmpty(userInfo.get("LS_ANS02").toString())) {
                    pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_check_p4.png", x[Integer.parseInt(userInfo.get("LS_ANS02").toString()) - 1], y1[1], pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                }

                if (userInfo.get("LS_ANS03") != null && !StringUtils.isEmpty(userInfo.get("LS_ANS03").toString())) {
                    pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_check2.png", x2, y2[Integer.parseInt(userInfo.get("LS_ANS03").toString()) - 1], pioPdfVO.px2mm(14f), pioPdfVO.px2mm(14f));
                }

                if (userInfo.get("LS_ANS04") != null && !StringUtils.isEmpty(userInfo.get("LS_ANS04").toString())) {
                    pioPdfVO.drawTextC(avgStudyTime[Integer.parseInt(userInfo.get("LS_ANS04").toString()) - 1], pioPdfVO.px2mm(196f), pioPdfVO.px2mm(678f, "Y"), pioPdfVO.px2mm(98f), "Pretendard SemiBold", 11f);
                }

                if (userInfo.get("LS_ANS05") != null && !StringUtils.isEmpty(userInfo.get("LS_ANS05").toString())) {
                    pioPdfVO.drawPicture(lsAns05FileName[Integer.parseInt(userInfo.get("LS_ANS05").toString()) - 1], pioPdfVO.px2mm(35f), pioPdfVO.px2mm(792f, "Y"), pioPdfVO.px2mm(290f), pioPdfVO.px2mm(40f));
                }
            }
            // 해석가이드 종합결과
            else if (page == 6) {
                pioPdfVO.drawTextC(userInfo.get("MEM_NM").toString(), pioPdfVO.px2mm(117f), pioPdfVO.px2mm(158f, "Y"), pioPdfVO.px2mm(30f), "Pretendard Semibold", 12f, false, false, Color.BLACK);

                float[] t_score4 = new float[6];

                t_score4[0] = Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, "01", "01", "0").get("T_SCORE").toString());
                t_score4[1] = Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, "01", "02", "0").get("T_SCORE").toString());
                t_score4[2] = Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, "02", "01", "0").get("T_SCORE").toString());
                t_score4[3] = Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, "02", "02", "0").get("T_SCORE").toString());
                t_score4[4] = Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, "03", "01", "0").get("T_SCORE").toString());
                t_score4[5] = Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, "03", "02", "0").get("T_SCORE").toString());

                pioPdfVO.drawRadarChart(t_score4, pioPdfVO.px2mm(295f), pioPdfVO.px2mm(370f, "Y"), pioPdfVO.px2mm(118f), pioPdfVO.hexa2Color("#FF9D00"), pioPdfVO.hexa2Color("#FFFCC9"), 0.4f);

                pioPdfVO.setOpacity(1f);

                // 대분류 등급
                pioPdfVO.drawPicture(getMarkImageFileName(getAnswerReportValue(dgnssReport3, 3, "01", "0", "0").get("T_RANK").toString()), pioPdfVO.px2mm(70f), pioPdfVO.px2mm(680f, "Y"), pioPdfVO.px2mm(70f), pioPdfVO.px2mm(70f));
                pioPdfVO.drawPicture(getMarkImageFileName(getAnswerReportValue(dgnssReport3, 3, "02", "0", "0").get("T_RANK").toString()), pioPdfVO.px2mm(260f), pioPdfVO.px2mm(680f, "Y"), pioPdfVO.px2mm(70f), pioPdfVO.px2mm(70f));
                pioPdfVO.drawPicture(getMarkImageFileName(getAnswerReportValue(dgnssReport3, 3, "03", "0", "0").get("T_RANK").toString()), pioPdfVO.px2mm(450f), pioPdfVO.px2mm(680f, "Y"), pioPdfVO.px2mm(70f), pioPdfVO.px2mm(70f));

                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport3, 3, "01", "0", "0").get("T_SCORE").toString() + "(" + getAnswerReportValue(dgnssReport3, 3, "01", "0", "0").get("P_RANK").toString() + ")", pioPdfVO.px2mm(70f), pioPdfVO.px2mm(660f, "Y"), pioPdfVO.px2mm(70f));
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport3, 3, "02", "0", "0").get("T_SCORE").toString() + "(" + getAnswerReportValue(dgnssReport3, 3, "02", "0", "0").get("P_RANK").toString() + ")", pioPdfVO.px2mm(260f), pioPdfVO.px2mm(660f, "Y"), pioPdfVO.px2mm(70f));
                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport3, 3, "03", "0", "0").get("T_SCORE").toString() + "(" + getAnswerReportValue(dgnssReport3, 3, "03", "0", "0").get("P_RANK").toString() + ")", pioPdfVO.px2mm(450f), pioPdfVO.px2mm(660f, "Y"), pioPdfVO.px2mm(70f));

                String[] t_script3 = new String[3];

                t_script3[0] = getAnswerReportValue(dgnssReport3, 3, "01", "0", "0").get("T_SCRIPT").toString();
                t_script3[1] = getAnswerReportValue(dgnssReport3, 3, "02", "0", "0").get("T_SCRIPT").toString();
                t_script3[2] = getAnswerReportValue(dgnssReport3, 3, "03", "0", "0").get("T_SCRIPT").toString();

                pioPdfVO.drawTextParagraph(t_script3[0], pioPdfVO.px2mm(25f), pioPdfVO.px2mm(740f, "Y"), pioPdfVO.px2mm(157f), 150, "", 9f, Color.BLACK, true, pioPdfVO.px2pt(-0.43f));
                pioPdfVO.drawTextParagraph(t_script3[1], pioPdfVO.px2mm(214.8f), pioPdfVO.px2mm(740f, "Y"), pioPdfVO.px2mm(157f), 150, "", 9f, Color.BLACK, true, pioPdfVO.px2pt(-0.43f));
                pioPdfVO.drawTextParagraph(t_script3[2], pioPdfVO.px2mm(405f), pioPdfVO.px2mm(740f, "Y"), pioPdfVO.px2mm(157f), 150, "", 9f, Color.BLACK, true, pioPdfVO.px2pt(-0.43f));

            }
            // 7 : 동기전략 > 학습원동력 , 8 : 동기전략 > 정서조절 10 인지전략 > 메타인지  11 인지전략 > 인지적 학습기술 13 행동전략 > 행동적 학스비술
            else if (page == 7 || page == 8 || page == 10 || page == 11 || page == 13 || page == 14) {
                String class3 = "";
                String class4 = "";

                int class5Count = 0;
                Color class4Color = Color.BLACK;


                if (page == 7) {
                    class3 = "01";
                    class4 = "01";

                    class5Count = 3;
                    class4Color = pioPdfVO.hexa2Color("#B2A7F9");
                } else if (page == 8) {
                    class3 = "01";
                    class4 = "02";

                    class5Count = 3;
                    class4Color = pioPdfVO.hexa2Color("#B2A7F9");
                } else if (page == 10) {
                    class3 = "02";
                    class4 = "01";

                    class5Count = 3;
                    class4Color = pioPdfVO.hexa2Color("#10DAFF");

                } else if (page == 11) {
                    class3 = "02";
                    class4 = "02";

                    class5Count = 3;
                    class4Color = pioPdfVO.hexa2Color("#10DAFF");
                } else if (page == 13) {
                    class3 = "03";
                    class4 = "01";

                    class5Count = 3;
                    class4Color = pioPdfVO.hexa2Color("#FF8A94");
                } else if (page == 14) {
                    class3 = "03";
                    class4 = "02";

                    class5Count = 5;
                    class4Color = pioPdfVO.hexa2Color("#FF8A94");
                }

                float x1 = pioPdfVO.px2mm(142f);
                float width1 = pioPdfVO.px2mm(30f);
                float[] y1 = new float[6];

                // 중분류 MARK
                float x2 = pioPdfVO.px2mm(53f);
                float width2 = pioPdfVO.px2mm(16f);
                float[] y2 = new float[5];

                float x3 = pioPdfVO.px2mm(204.5f);
                float barWidth = pioPdfVO.px2mm(371f);
                float[] y3 = new float[5];

                float y3Height = 0f;     // 4f -> 0f

                if (class5Count == 3) {

                    y1[0] = pioPdfVO.px2mm(243f, "Y");
                    y1[1] = pioPdfVO.px2mm(263f, "Y");
                    y1[2] = pioPdfVO.px2mm(283f, "Y");
                    y1[3] = pioPdfVO.px2mm(303f, "Y");

                    y2[0] = pioPdfVO.px2mm(370f, "Y");
                    y2[1] = pioPdfVO.px2mm(438f, "Y");
                    y2[2] = pioPdfVO.px2mm(506f, "Y");

                    y3[0] = pioPdfVO.px2mm(354f - y3Height, "Y");
                    y3[1] = pioPdfVO.px2mm(423f - y3Height, "Y");
                    y3[2] = pioPdfVO.px2mm(491f - y3Height, "Y");

                } else if (class5Count == 5) {

                    y1[0] = pioPdfVO.px2mm(243f, "Y");
                    y1[1] = pioPdfVO.px2mm(263f, "Y");
                    y1[2] = pioPdfVO.px2mm(283f, "Y");
                    y1[3] = pioPdfVO.px2mm(303f, "Y");
                    y1[4] = pioPdfVO.px2mm(323f, "Y");
                    y1[5] = pioPdfVO.px2mm(343f, "Y");

                    y2[0] = pioPdfVO.px2mm(410f, "Y");
                    y2[1] = pioPdfVO.px2mm(478f, "Y");
                    y2[2] = pioPdfVO.px2mm(546f, "Y");
                    y2[3] = pioPdfVO.px2mm(614f, "Y");
                    y2[4] = pioPdfVO.px2mm(682f, "Y");

                    y3[0] = pioPdfVO.px2mm(395f - y3Height, "Y");
                    y3[1] = pioPdfVO.px2mm(463f - y3Height, "Y");
                    y3[2] = pioPdfVO.px2mm(531f - y3Height, "Y");
                    y3[3] = pioPdfVO.px2mm(599f - y3Height, "Y");
                    y3[4] = pioPdfVO.px2mm(667f - y3Height, "Y");
                }

                // 대분류 등급()
                //                 pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, class3, class4, "0").get("T_SCORE").toString() + "(" + getAnswerReportValue(dgnssReport4, 4, class3, class4, "0").get("P_RANK").toString() + ")", 38f, y1[0], 26f);

                if (Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, class3, class4, "0").get("T_SCORE").toString()) >= 0) {
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport4, 4, class3, class4, "0").get("T_SCORE").toString() + "(" + getAnswerReportValue(dgnssReport4, 4, class3, class4, "0").get("P_RANK").toString() + ")", x1, y1[0], width1, "", 10.5f, true, false, Color.BLACK, -0.5f);
                    pioPdfVO.drawBarChart_Horizontal(x3, y1[0], barWidth * Float.parseFloat(getAnswerReportValue(dgnssReport4, 4, class3, class4, "").get("T_SCORE").toString()) / 100f, pioPdfVO.px2mm(10f), Color.WHITE, class4Color);
                } else {
                    pioPdfVO.drawTextC("?", x1, y1[0], width1, "", 10.5f, true, false, Color.BLACK, -0.5f);
                }

                String tmpClass5 = "";

                for (int i = 0; i < class5Count; i++) {

                    tmpClass5 = StringUtils.leftPad(Integer.toString(i + 1), 2, "0");

                    // 변인 T점수(백분위)
                    if (Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, class3, class4, tmpClass5).get("T_SCORE").toString()) >= 0)
                        pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport5, 5, class3, class4, tmpClass5).get("T_SCORE").toString() + "(" + getAnswerReportValue(dgnssReport5, 5, class3, class4, tmpClass5).get("P_RANK").toString() + ")", x1, y1[i + 1], width1, "", 10.5f, false, false, Color.BLACK, -0.5f);
                    else {
                        pioPdfVO.drawTextC("?", x1, y1[i + 1], width1, "", 10.5f, false, false, Color.BLACK, -0.5f);
                    }

                    // 변인 MARK
                    pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport5, 5, class3, class4, tmpClass5).get("T_RANK").toString(), x2, y2[i], width2, "Pretendard Bold", 10f, true, false, getColorByTRank(pioPdfVO, getAnswerReportValue(dgnssReport5, 5, class3, class4, tmpClass5).get("T_RANK").toString()), -0.48f);

                    // 변인 T점수 가로바 차트
                    if (Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, class3, class4, tmpClass5).get("T_SCORE").toString()) > 0) {
                        pioPdfVO.setOpacity(0.65f);
                        pioPdfVO.drawBarChart_Horizontal(x3, y1[i + 1], barWidth * Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, class3, class4, tmpClass5).get("T_SCORE").toString()) / 100f, pioPdfVO.px2mm(10f), Color.white, pioPdfVO.hexa2Color("#9AA0A8"));
                        pioPdfVO.setOpacity(1f);
                    }

                    pioPdfVO.drawTextParagraph(getAnswerReportValue(dgnssReport5, 5, class3, class4, tmpClass5).get("T_SCRIPT").toString(), pioPdfVO.px2mm(121f), y3[i], pioPdfVO.px2mm(438f), 147.4f, "", 9.5f, Color.BLACK, true, pioPdfVO.px2pt(-0.46f));
                }

                // 중분류 총평
                pioPdfVO.drawTextParagraph(getAnswerReportValue(dgnssReport4, 4, class3, class4, "0").get("T_SCRIPT").toString(), pioPdfVO.px2mm(30f), pioPdfVO.px2mm(753.5f, "Y"), pioPdfVO.px2mm(528f), 152.4f, "Pretendard Medium", 10.5f, Color.BLACK, true, pioPdfVO.px2pt(-0.5f));

            }
            //  행동전략 강점 및 보완점
            else if (page == 9 || page == 12) {

                String class3 = "";

                if (page == 9) {
                    class3 = "01";
                } else if (page == 12) {
                    class3 = "02";
                }

                String[] imgFile = new String[6];
                float[] x = new float[6];

                imgFile[0] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, class3, "01", "01").get("T_RANK").toString(), "dgnss20", false, page - 1);
                imgFile[1] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, class3, "01", "02").get("T_RANK").toString(), "dgnss20", false, page - 1);
                imgFile[2] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, class3, "01", "03").get("T_RANK").toString(), "dgnss20", false, page - 1);
                imgFile[3] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, class3, "02", "01").get("T_RANK").toString(), "dgnss20", false, page - 1);
                imgFile[4] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, class3, "02", "02").get("T_RANK").toString(), "dgnss20", false, page - 1);
                imgFile[5] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, class3, "02", "03").get("T_RANK").toString(), "dgnss20", false, page - 1);

                for (int i = 0; i < 6; i++) {
                    if (imgFile[i].contains("ico_mark_high"))
                        x[i] = pioPdfVO.px2mm(278f);
                    else if (imgFile[i].contains("ico_mark_mid"))
                        x[i] = pioPdfVO.px2mm(383f);
                    else if (imgFile[i].contains("ico_mark_low"))
                        x[i] = pioPdfVO.px2mm(488f);
                    else
                        x[i] = 0;
                }

                // 강점 성장기대, 보완점을 마크한다.
                if (page == 9) {
                    pioPdfVO.drawPicture(imgFile[0], x[0], pioPdfVO.px2mm(275f, "Y"), pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                    pioPdfVO.drawPicture(imgFile[1], x[1], pioPdfVO.px2mm(309f, "Y"), pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                    pioPdfVO.drawPicture(imgFile[2], x[2], pioPdfVO.px2mm(343f, "Y"), pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                    pioPdfVO.drawPicture(imgFile[3], x[3], pioPdfVO.px2mm(377f, "Y"), pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                    pioPdfVO.drawPicture(imgFile[4], x[4], pioPdfVO.px2mm(412f, "Y"), pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                    pioPdfVO.drawPicture(imgFile[5], x[5], pioPdfVO.px2mm(446f, "Y"), pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                } else if (page == 12) {
                    pioPdfVO.drawPicture(imgFile[0], x[0], pioPdfVO.px2mm(264f, "Y"), pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                    pioPdfVO.drawPicture(imgFile[1], x[1], pioPdfVO.px2mm(298f, "Y"), pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                    pioPdfVO.drawPicture(imgFile[2], x[2], pioPdfVO.px2mm(332f, "Y"), pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                    pioPdfVO.drawPicture(imgFile[3], x[3], pioPdfVO.px2mm(367f, "Y"), pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                    pioPdfVO.drawPicture(imgFile[4], x[4], pioPdfVO.px2mm(401f, "Y"), pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                    pioPdfVO.drawPicture(imgFile[5], x[5], pioPdfVO.px2mm(435f, "Y"), pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                }

                // 학습습관
                pioPdfVO.drawPicture(getHabitImageFileName(class3, "01", "01", getAnswerReportValue(dgnssReport5, 5, class3, "01", "01").get("T_RANK").toString()), pioPdfVO.px2mm(81f), pioPdfVO.px2mm(690f, "Y"), pioPdfVO.px2mm(135f), pioPdfVO.px2mm(95f));
                pioPdfVO.drawPicture(getHabitImageFileName(class3, "01", "02", getAnswerReportValue(dgnssReport5, 5, class3, "01", "02").get("T_RANK").toString()), pioPdfVO.px2mm(228f), pioPdfVO.px2mm(690f, "Y"), pioPdfVO.px2mm(135f), pioPdfVO.px2mm(95f));
                pioPdfVO.drawPicture(getHabitImageFileName(class3, "01", "03", getAnswerReportValue(dgnssReport5, 5, class3, "01", "03").get("T_RANK").toString()), pioPdfVO.px2mm(375f), pioPdfVO.px2mm(690f, "Y"), pioPdfVO.px2mm(135f), pioPdfVO.px2mm(95f));

                pioPdfVO.drawPicture(getHabitImageFileName(class3, "02", "01", getAnswerReportValue(dgnssReport5, 5, class3, "02", "01").get("T_RANK").toString()), pioPdfVO.px2mm(81f), pioPdfVO.px2mm(795f, "Y"), pioPdfVO.px2mm(135f), pioPdfVO.px2mm(95f));
                pioPdfVO.drawPicture(getHabitImageFileName(class3, "02", "02", getAnswerReportValue(dgnssReport5, 5, class3, "02", "02").get("T_RANK").toString()), pioPdfVO.px2mm(228f), pioPdfVO.px2mm(795f, "Y"), pioPdfVO.px2mm(135f), pioPdfVO.px2mm(95f));
                pioPdfVO.drawPicture(getHabitImageFileName(class3, "02", "03", getAnswerReportValue(dgnssReport5, 5, class3, "02", "03").get("T_RANK").toString()), pioPdfVO.px2mm(375f), pioPdfVO.px2mm(795f, "Y"), pioPdfVO.px2mm(135f), pioPdfVO.px2mm(95f));


            }
            // 행동전략 강점 및 보완점
            else if (page == 15) {

                String class3 = "03";

                String[] imgFile = new String[8];
                float[] x = new float[8];

                imgFile[0] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, class3, "01", "01").get("T_RANK").toString(), "dgnss20", false, page - 1);
                imgFile[1] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, class3, "01", "02").get("T_RANK").toString(), "dgnss20", false, page - 1);
                imgFile[2] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, class3, "01", "03").get("T_RANK").toString(), "dgnss20", false, page - 1);
                imgFile[3] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, class3, "02", "01").get("T_RANK").toString(), "dgnss20", false, page - 1);
                imgFile[4] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, class3, "02", "02").get("T_RANK").toString(), "dgnss20", false, page - 1);
                imgFile[5] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, class3, "02", "03").get("T_RANK").toString(), "dgnss20", false, page - 1);
                imgFile[6] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, class3, "02", "04").get("T_RANK").toString(), "dgnss20", false, page - 1);
                imgFile[7] = getMarkLevel3ImageFileName(getAnswerReportValue(dgnssReport5, 5, class3, "02", "05").get("T_RANK").toString(), "dgnss20", false, page - 1);

                float[] y2 = new float[8];

                y2[0] = pioPdfVO.px2mm(243f, "Y");
                y2[1] = pioPdfVO.px2mm(273f, "Y");
                y2[2] = pioPdfVO.px2mm(304f, "Y");
                y2[3] = pioPdfVO.px2mm(335f, "Y");
                y2[4] = pioPdfVO.px2mm(365f, "Y");
                y2[5] = pioPdfVO.px2mm(393f, "Y");
                y2[6] = pioPdfVO.px2mm(425f, "Y");
                y2[7] = pioPdfVO.px2mm(455f, "Y");

                for (int i = 0; i < 8; i++) {

                    if (imgFile[i].contains("ico_mark_high"))
                        x[i] = pioPdfVO.px2mm(278f);
                    else if (imgFile[i].contains("ico_mark_mid"))
                        x[i] = pioPdfVO.px2mm(383f);
                    else if (imgFile[i].contains("ico_mark_low"))
                        x[i] = pioPdfVO.px2mm(488f);
                    else
                        x[i] = 0;
                }

                // 강점 성장기대, 보완점을 마크한다.
                for (int i = 0; i < 8; i++)
                    pioPdfVO.drawPicture(imgFile[i], x[i], y2[i], pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));


                // 학습습관
                pioPdfVO.drawPicture(getHabitImageFileName(class3, "01", "01", getAnswerReportValue(dgnssReport5, 5, class3, "01", "01").get("T_RANK").toString()), pioPdfVO.px2mm(41f), pioPdfVO.px2mm(690f, "Y"), pioPdfVO.px2mm(120f), pioPdfVO.px2mm(95f));
                pioPdfVO.drawPicture(getHabitImageFileName(class3, "01", "02", getAnswerReportValue(dgnssReport5, 5, class3, "01", "02").get("T_RANK").toString()), pioPdfVO.px2mm(171f), pioPdfVO.px2mm(690f, "Y"), pioPdfVO.px2mm(120f), pioPdfVO.px2mm(95f));
                pioPdfVO.drawPicture(getHabitImageFileName(class3, "01", "03", getAnswerReportValue(dgnssReport5, 5, class3, "01", "03").get("T_RANK").toString()), pioPdfVO.px2mm(301f), pioPdfVO.px2mm(690f, "Y"), pioPdfVO.px2mm(120f), pioPdfVO.px2mm(95f));

                pioPdfVO.drawPicture(getHabitImageFileName(class3, "02", "01", getAnswerReportValue(dgnssReport5, 5, class3, "02", "01").get("T_RANK").toString()), pioPdfVO.px2mm(431f), pioPdfVO.px2mm(690f, "Y"), pioPdfVO.px2mm(120f), pioPdfVO.px2mm(95f));
                pioPdfVO.drawPicture(getHabitImageFileName(class3, "02", "02", getAnswerReportValue(dgnssReport5, 5, class3, "02", "02").get("T_RANK").toString()), pioPdfVO.px2mm(41f), pioPdfVO.px2mm(795f, "Y"), pioPdfVO.px2mm(120f), pioPdfVO.px2mm(95f));
                pioPdfVO.drawPicture(getHabitImageFileName(class3, "02", "03", getAnswerReportValue(dgnssReport5, 5, class3, "02", "03").get("T_RANK").toString()), pioPdfVO.px2mm(171f), pioPdfVO.px2mm(795f, "Y"), pioPdfVO.px2mm(120f), pioPdfVO.px2mm(95f));
                pioPdfVO.drawPicture(getHabitImageFileName(class3, "02", "04", getAnswerReportValue(dgnssReport5, 5, class3, "02", "04").get("T_RANK").toString()), pioPdfVO.px2mm(301f), pioPdfVO.px2mm(795f, "Y"), pioPdfVO.px2mm(120f), pioPdfVO.px2mm(95f));
                pioPdfVO.drawPicture(getHabitImageFileName(class3, "02", "05", getAnswerReportValue(dgnssReport5, 5, class3, "02", "05").get("T_RANK").toString()), pioPdfVO.px2mm(431f), pioPdfVO.px2mm(795f, "Y"), pioPdfVO.px2mm(120f), pioPdfVO.px2mm(95f));
            }
            // 종합 해석
            else if (page == 16) {

                // 종합분석표(대분류 T점수

                float xStart = pioPdfVO.px2mm(180.5f);        // 그래프 시작 위치
                float barWidth = pioPdfVO.px2mm(298f);      // 그래프 바 넓이

                float[] y = new float[23];   // 테이블 각각 높이
                float height = pioPdfVO.px2mm(Double.valueOf(578f / 24.0).floatValue());   // 테이블 행 높이


                int i = 0;

                y[0] = pioPdfVO.px2mm(238f, "Y");
                for (i = 1; i < 23; i++)
                    y[i] = y[i - 1] - height;

                // 기준선에서 텍스트 높이
                float textHeight = 3f;

                int dgnssOrd = Integer.parseInt(userInfo.get("DGNSS_ORD").toString());

                pioPdfVO.drawBarChart_Horizontal(xStart, y[0] + pioPdfVO.px2mm(7f), barWidth * Float.parseFloat(getAnswerReportValue(dgnssReport3, 3, "01", "0", "0").get("T_SCORE").toString()) / 100.0f, pioPdfVO.px2mm(10f), Color.white, pioPdfVO.hexa2Color("#B2A7F9"));
                pioPdfVO.drawBarChart_Horizontal(xStart, y[7] + pioPdfVO.px2mm(7f), barWidth * Float.parseFloat(getAnswerReportValue(dgnssReport3, 3, "02", "0", "0").get("T_SCORE").toString()) / 100.0f, pioPdfVO.px2mm(10f), Color.white, pioPdfVO.hexa2Color("#10DAFF"));
                pioPdfVO.drawBarChart_Horizontal(xStart, y[14] + pioPdfVO.px2mm(7f), barWidth * Float.parseFloat(getAnswerReportValue(dgnssReport3, 3, "03", "0", "0").get("T_SCORE").toString()) / 100.0f, pioPdfVO.px2mm(10f), Color.white, pioPdfVO.hexa2Color("#FF8A94"));

                // 종합해석 1차, 2차 변화 X 좌표
                float[] x1 = new float[4];

                x1[0] = pioPdfVO.px2mm(488f);
                x1[1] = pioPdfVO.px2mm(520f);
                x1[2] = pioPdfVO.px2mm(548f);
                x1[3] = pioPdfVO.px2mm(556f);

                float x3Width = 4.74f;

                if (dgnssOrd == 1) {

                    pioPdfVO.drawPicture("./assets/imgs/dgnss/btn/btn_total_anal_20_1st.png", pioPdfVO.px2mm(185f), pioPdfVO.px2mm(815f, "Y"), pioPdfVO.px2mm(220f), pioPdfVO.px2mm(33f));
                    pioPdfVO.drawText(userInfo.get("DGNSS_ORD").toString() + "차", pioPdfVO.px2mm(488f), pioPdfVO.px2mm(206f, "Y"), "Pretendard Medium", 9.5f, false, false, Color.BLACK, -0.46f);

                    float[] t_score5_1 = new float[6];
                    float[] t_score5_2 = new float[6];
                    float[] t_score5_3 = new float[8];

                    t_score5_1[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "01").get("T_SCORE").toString());
                    t_score5_1[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "02").get("T_SCORE").toString());
                    t_score5_1[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "03").get("T_SCORE").toString());
                    t_score5_1[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "01").get("T_SCORE").toString());
                    t_score5_1[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "02").get("T_SCORE").toString());
                    t_score5_1[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "03").get("T_SCORE").toString());

                    t_score5_2[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "01").get("T_SCORE").toString());
                    t_score5_2[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "02").get("T_SCORE").toString());
                    t_score5_2[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "03").get("T_SCORE").toString());
                    t_score5_2[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "01").get("T_SCORE").toString());
                    t_score5_2[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "02").get("T_SCORE").toString());
                    t_score5_2[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "03").get("T_SCORE").toString());

                    t_score5_3[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "01").get("T_SCORE").toString());
                    t_score5_3[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "02").get("T_SCORE").toString());
                    t_score5_3[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "03").get("T_SCORE").toString());
                    t_score5_3[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "01").get("T_SCORE").toString());
                    t_score5_3[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "02").get("T_SCORE").toString());
                    t_score5_3[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "03").get("T_SCORE").toString());
                    t_score5_3[6] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "04").get("T_SCORE").toString());
                    t_score5_3[7] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "05").get("T_SCORE").toString());

                    pioPdfVO.drawGraph01(t_score5_1, xStart, y[1] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#9F91F8"));
                    pioPdfVO.drawGraph01(t_score5_2, xStart, y[8] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#00CEF4"));
                    pioPdfVO.drawGraph01(t_score5_3, xStart, y[15] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#FF8A94"));

                    // 대분류 점수
                    if (!getAnswerReportValue(dgnssReport3, 3, "01", "0", "0").get("T_SCORE").toString().equals("-1"))
                        pioPdfVO.drawText(getAnswerReportValue(dgnssReport3, 3, "01", "0", "0").get("T_SCORE").toString(), x1[0], y[0] + textHeight, "", 9f, true, false);
                    else
                        pioPdfVO.drawText("?", x1[0], y[0] + textHeight, "", 9f, true, false);

                    if (!getAnswerReportValue(dgnssReport3, 3, "02", "0", "0").get("T_SCORE").toString().equals("-1"))
                        pioPdfVO.drawText(getAnswerReportValue(dgnssReport3, 3, "02", "0", "0").get("T_SCORE").toString(), x1[0], y[7] + textHeight, "", 9f, true, false);
                    else
                        pioPdfVO.drawText("?", x1[0], y[7] + textHeight, "", 9f, true, false);

                    if (!getAnswerReportValue(dgnssReport3, 3, "03", "0", "0").get("T_SCORE").toString().equals("-1"))
                        pioPdfVO.drawText(getAnswerReportValue(dgnssReport3, 3, "03", "0", "0").get("T_SCORE").toString(), x1[0], y[14] + textHeight, "", 9f, true, false);
                    else
                        pioPdfVO.drawText("?", x1[0], y[14] + textHeight, "", 9f, true, false);

                    Map<String, Object> dgnssReport;
                    int j = 1;
                    for (i = 0; i < dgnssReport5.size(); i++) {
                        dgnssReport = dgnssReport5.get(i);

                        if (j == 7 || j == 14)
                            j = j + 1;

                        if (!dgnssReport.get("T_SCORE").toString().equals("-1"))
                            pioPdfVO.drawTextC(dgnssReport.get("T_SCORE").toString(), x1[0], y[j] + textHeight, pioPdfVO.px2mm(12f));
                        else
                            pioPdfVO.drawTextC("?", x1[0], y[j] + textHeight, pioPdfVO.px2mm(12f));

                        j = j + 1;
                    }

                    pioPdfVO.drawTextC(userInfo.get("DGNSS_ORD").toString() + "차 : " + userInfo.get("RSPNS_DT"), pioPdfVO.px2mm(211f), pioPdfVO.px2mm(802f, "Y"), pioPdfVO.px2mm(68f), "Pretendard", 10f, false, false, Color.black, -0.48f);

                } else {

                    pioPdfVO.drawPicture("./assets/imgs/dgnss/btn/btn_total_anal_20_1st.png", pioPdfVO.px2mm(185f), pioPdfVO.px2mm(815f, "Y"), pioPdfVO.px2mm(220f), pioPdfVO.px2mm(33f));

                    pioPdfVO.drawText(userInfo.get("DGNSS_ORD_FIRST").toString() + "차", pioPdfVO.px2mm(488f), pioPdfVO.px2mm(206f, "Y"), "Pretendard Medium", 9.5f, false, false, Color.BLACK, -0.46f);
                    pioPdfVO.drawText(userInfo.get("DGNSS_ORD").toString() + "차", pioPdfVO.px2mm(519f), pioPdfVO.px2mm(206f, "Y"), "Pretendard Medium", 9.5f, false, false, Color.BLACK, -0.46f);


                    float[] t_score5_1_first = new float[6];
                    float[] t_score5_2_first = new float[6];
                    float[] t_score5_3_first = new float[8];

                    float[] t_score5_1 = new float[6];
                    float[] t_score5_2 = new float[6];
                    float[] t_score5_3 = new float[8];


                    t_score5_1_first[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "01").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "02").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "03").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "01").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "02").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "03").get("T_SCORE_FIRST").toString());

                    t_score5_2_first[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "01").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "02").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "03").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "01").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "02").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "03").get("T_SCORE_FIRST").toString());

                    t_score5_3_first[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "01").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "02").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "03").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "01").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "02").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "03").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[6] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "04").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[7] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "05").get("T_SCORE_FIRST").toString());


                    t_score5_1[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "01").get("T_SCORE").toString());
                    t_score5_1[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "02").get("T_SCORE").toString());
                    t_score5_1[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "01", "03").get("T_SCORE").toString());
                    t_score5_1[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "01").get("T_SCORE").toString());
                    t_score5_1[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "02").get("T_SCORE").toString());
                    t_score5_1[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "01", "02", "03").get("T_SCORE").toString());

                    t_score5_2[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "01").get("T_SCORE").toString());
                    t_score5_2[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "02").get("T_SCORE").toString());
                    t_score5_2[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "01", "03").get("T_SCORE").toString());
                    t_score5_2[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "01").get("T_SCORE").toString());
                    t_score5_2[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "02").get("T_SCORE").toString());
                    t_score5_2[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "02", "02", "03").get("T_SCORE").toString());

                    t_score5_3[0] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "01").get("T_SCORE").toString());
                    t_score5_3[1] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "02").get("T_SCORE").toString());
                    t_score5_3[2] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "01", "03").get("T_SCORE").toString());
                    t_score5_3[3] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "01").get("T_SCORE").toString());
                    t_score5_3[4] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "02").get("T_SCORE").toString());
                    t_score5_3[5] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "03").get("T_SCORE").toString());
                    t_score5_3[6] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "04").get("T_SCORE").toString());
                    t_score5_3[7] = Float.parseFloat(getAnswerReportValue(dgnssReport5, 5, "03", "02", "05").get("T_SCORE").toString());

                    pioPdfVO.drawGraph01(t_score5_1_first, xStart, y[1] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#A9ADB2"));
                    pioPdfVO.drawGraph01(t_score5_2_first, xStart, y[8] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#A9ADB2"));
                    pioPdfVO.drawGraph01(t_score5_3_first, xStart, y[15] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#A9ADB2"));

                    pioPdfVO.drawGraph01(t_score5_1, xStart, y[1] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#9F91F8"));
                    pioPdfVO.drawGraph01(t_score5_2, xStart, y[8] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#00CEF4"));
                    pioPdfVO.drawGraph01(t_score5_3, xStart, y[15] + (height / 2f), barWidth, height, 1, 1, pioPdfVO.hexa2Color("#FF8A94"));

                    // 대분류 점수
                    if (!getAnswerReportValue(dgnssReport3, 3, "01", "0", "0").get("T_SCORE_FIRST").toString().equals("-1"))
                        pioPdfVO.drawText(getAnswerReportValue(dgnssReport3, 3, "01", "0", "0").get("T_SCORE_FIRST").toString(), x1[0], y[0] + textHeight, "Pretendard", 9.5f, true, false);
                    else
                        pioPdfVO.drawText("?", x1[0], y[0] + textHeight, "Pretendard", 9.5f, true, false);

                    if (!getAnswerReportValue(dgnssReport3, 3, "02", "0", "0").get("T_SCORE_FIRST").toString().equals("-1"))
                        pioPdfVO.drawText(getAnswerReportValue(dgnssReport3, 3, "02", "0", "0").get("T_SCORE_FIRST").toString(), x1[0], y[7] + textHeight, "Pretendard", 9.5f, true, false);
                    else
                        pioPdfVO.drawText("?", x1[0], y[7] + textHeight, "Pretendard", 9.5f, true, false);

                    if (!getAnswerReportValue(dgnssReport3, 3, "03", "0", "0").get("T_SCORE_FIRST").toString().equals("-1"))
                        pioPdfVO.drawText(getAnswerReportValue(dgnssReport3, 3, "03", "0", "0").get("T_SCORE_FIRST").toString(), x1[0], y[14] + textHeight, "Pretendard", 9.5f, true, false);
                    else
                        pioPdfVO.drawText("?", x1[0], y[14] + textHeight, "Pretendard", 9.5f, true, false);

                    if (!getAnswerReportValue(dgnssReport3, 3, "01", "0", "0").get("T_SCORE").toString().equals("-1"))
                        pioPdfVO.drawText(getAnswerReportValue(dgnssReport3, 3, "01", "0", "0").get("T_SCORE").toString(), x1[1], y[0] + textHeight, "Pretendard", 9.5f, true, false);
                    else
                        pioPdfVO.drawText("?", x1[1], y[0] + textHeight, "Pretendard", 9.5f, true, false);

                    if (!getAnswerReportValue(dgnssReport3, 3, "02", "0", "0").get("T_SCORE").toString().equals("-1"))
                        pioPdfVO.drawText(getAnswerReportValue(dgnssReport3, 3, "02", "0", "0").get("T_SCORE").toString(), x1[1], y[7] + textHeight, "Pretendard", 9.5f, true, false);
                    else
                        pioPdfVO.drawText("?", x1[1], y[7] + textHeight, "Pretendard", 9.5f, true, false);

                    if (!getAnswerReportValue(dgnssReport3, 3, "03", "0", "0").get("T_SCORE").toString().equals("-1"))
                        pioPdfVO.drawText(getAnswerReportValue(dgnssReport3, 3, "03", "0", "0").get("T_SCORE").toString(), x1[1], y[14] + textHeight, "Pretendard", 9.5f, true, false);
                    else
                        pioPdfVO.drawText("?", x1[1], y[14] + textHeight, "Pretendard", 9.5f, true, false);

                    //   0 , 7 , 17
                    for (i = 0; i < 3; i++) {
                        if (!getAnswerReportValue(dgnssReport3, 3, StringUtils.leftPad(Integer.toString(i + 1), 2, "0"), "0", "0").get("T_SCORE").toString().equals("-1") && !getAnswerReportValue(dgnssReport3, 3, StringUtils.leftPad(Integer.toString(i + 1), 2, "0"), "0", "0").get("T_SCORE_FIRST").toString().equals("-1")) {
                            if (getAnswerReportValue(dgnssReport3, 3, StringUtils.leftPad(Integer.toString(i + 1), 2, "0"), "0", "0").get("T_SCORE_GAP").toString().contains("-")) {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_down_red.png", x1[2], y[7 * i] + textHeight, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport3, 3, StringUtils.leftPad(Integer.toString(i + 1), 2, "0"), "0", "0").get("T_SCORE_GAP").toString(), x1[3], y[7 * i] + textHeight, x3Width, "", 9.5f, true, false, pioPdfVO.hexa2Color("#FF4800"));
                            } else if (getAnswerReportValue(dgnssReport3, 3, StringUtils.leftPad(Integer.toString(i + 1), 2, "0"), "0", "0").get("T_SCORE_GAP").toString().equals("0")) {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_maintain.png", pioPdfVO.px2mm(555f), y[7 * i] + (height / 2f), pioPdfVO.px2mm(7f), pioPdfVO.px2mm(1f));
                            } else {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_up_blue.png", x1[2], y[7 * i] + textHeight, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                                pioPdfVO.drawTextC(getAnswerReportValue(dgnssReport3, 3, StringUtils.leftPad(Integer.toString(i + 1), 2, "0"), "0", "0").get("T_SCORE_GAP").toString(), x1[3], y[7 * i] + textHeight, x3Width, "", 9.5f, true, false, pioPdfVO.hexa2Color("#0B9DFF"));
                            }
                        }
                    }

                    Map<String, Object> dgnssReport;
                    int j = 1;
                    for (i = 0; i < dgnssReport5.size(); i++) {
                        dgnssReport = dgnssReport5.get(i);

                        if (j == 7 || j == 14)
                            j = j + 1;

                        if (!dgnssReport.get("T_SCORE_FIRST").toString().equals("-1"))
                            pioPdfVO.drawText(dgnssReport.get("T_SCORE_FIRST").toString(), x1[0], y[j] + textHeight);
                        else
                            pioPdfVO.drawText("?", x1[0], y[j] + textHeight);

                        if (!dgnssReport.get("T_SCORE").toString().equals("-1"))
                            pioPdfVO.drawText(dgnssReport.get("T_SCORE").toString(), x1[1], y[j] + textHeight);
                        else
                            pioPdfVO.drawText("?", x1[1], y[j] + textHeight);

                        if (!dgnssReport.get("T_SCORE_FIRST").toString().equals("-1") && !dgnssReport.get("T_SCORE").toString().equals("-1")) {
                            if (dgnssReport.get("T_SCORE_GAP").toString().contains("-")) {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_down_red.png", x1[2], y[j] + textHeight, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                                pioPdfVO.drawTextC(dgnssReport.get("T_SCORE_GAP").toString(), x1[3], y[j] + textHeight, x3Width, "", 9.12f, false, false, pioPdfVO.hexa2Color("#FF4800"));
                            } else if (dgnssReport.get("T_SCORE_GAP").toString().equals("0")) {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_maintain.png", pioPdfVO.px2mm(555f), y[j] + (height / 2f), pioPdfVO.px2mm(7f), pioPdfVO.px2mm(1f));
                            } else {
                                pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_up_blue.png", x1[2], y[j] + textHeight, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                                pioPdfVO.drawTextC(dgnssReport.get("T_SCORE_GAP").toString(), x1[3], y[j] + textHeight, x3Width, "", 9.12f, false, false, pioPdfVO.hexa2Color("#0B9DFF"));
                            }
                        }

                        j = j + 1;
                    }


                    pioPdfVO.drawTextC(userInfo.get("DGNSS_ORD_FIRST").toString() + "차 : " + userInfo.get("RSPNS_DT_FIRST"), pioPdfVO.px2mm(211f), pioPdfVO.px2mm(802f, "Y"), pioPdfVO.px2mm(68f), "Pretendard Medium", 10f, false, false, pioPdfVO.hexa2Color("#A9ADB2"), -0.48f);
                    pioPdfVO.drawTextC(userInfo.get("DGNSS_ORD").toString() + "차 : " + userInfo.get("RSPNS_DT"), pioPdfVO.px2mm(310f), pioPdfVO.px2mm(802f, "Y"), pioPdfVO.px2mm(72f), "Pretendard", 10f, false, false, Color.black, -0.48f);


                }
            }
            // 종합 해석 02. 척도조합 해석
            else if (page == 17) {
                int dgnssOrd = Integer.parseInt(userInfo.get("DGNSS_ORD").toString());

                // 보통 #00D282 높음, 매우 높음 #0B9DFF   낮음, 매우 낮음 #FF4800
                String[] score4_first = new String[6];
                String[] score4 = new String[6];
                int[] tscore_gap = new int[6];


                float[] x1 = new float[3];

                x1[0] = pioPdfVO.px2mm(102f);
                x1[1] = pioPdfVO.px2mm(380f);
                x1[2] = pioPdfVO.px2mm(428f);


                float[] x = new float[4];

                // 2차시 변구
                x[0] = pioPdfVO.px2mm(63f);
                x[1] = pioPdfVO.px2mm(142f);
                x[2] = pioPdfVO.px2mm(378f);
                x[3] = pioPdfVO.px2mm(485f);

                float[] y = new float[6];

                y[0] = pioPdfVO.px2mm(492f, "Y");
                y[1] = pioPdfVO.px2mm(293f, "Y");
                y[2] = pioPdfVO.px2mm(342f, "Y");
                y[3] = pioPdfVO.px2mm(391f, "Y");
                y[4] = pioPdfVO.px2mm(440f, "Y");
                y[5] = pioPdfVO.px2mm(489f, "Y");

                float alignWidth = pioPdfVO.px2mm(74f);

                Map<String, Object> dgnssReport;

                for (int i = 0; i < dgnssReport4.size(); i++) {
                    dgnssReport = dgnssReport4.get(i);

                    if (dgnssReport.get("T_RANK").toString().equals("?"))
                        score4[i] = dgnssReport.get("T_RANK").toString();
                    else
                        score4[i] = dgnssReport.get("T_RANK").toString() + " " + dgnssReport.get("T_SCORE").toString() + "(" + dgnssReport.get("P_RANK").toString() + ")";

                    if (dgnssOrd > 1) {
                        if (dgnssReport.get("T_RANK_FIRST").toString().equals("?"))
                            score4_first[i] = dgnssReport.get("T_RANK_FIRST").toString();
                        else
                            score4_first[i] = dgnssReport.get("T_RANK_FIRST").toString() + " " + dgnssReport.get("T_SCORE_FIRST").toString() + "(" + dgnssReport.get("P_RANK_FIRST").toString() + ")";

                        tscore_gap[i] = Integer.parseInt(dgnssReport.get("T_SCORE_GAP").toString());

                    }
                }

                if (dgnssOrd == 1) {
                    for (int i = 0; i < 6; i++) {
                        if (i == 0) {
                            pioPdfVO.drawTextC(userInfo.get("DGNSS_ORD").toString() + "차", x1[0], y[i] + 7f, alignWidth, "", 11f, false, false, Color.BLACK, pioPdfVO.px2pt(-0.53f));
                            pioPdfVO.drawTextC(score4[i], x1[0], y[i], alignWidth, "Pretendard SemiBold", 10f, false, false, getColorByTRank(pioPdfVO, score4[i]));
                        } else {
                            pioPdfVO.drawTextC(userInfo.get("DGNSS_ORD").toString() + "차", x1[1], y[i] + 2.2f, alignWidth, "", 9.5f, false, false, Color.BLACK);
                            pioPdfVO.drawTextC(score4[i], x1[2], y[i] + 2.2f, alignWidth, "Pretendard SemiBold", 9.5f, false, false, getColorByTRank(pioPdfVO, score4[i]));
                        }
                    }

                } else {
                    for (int i = 0; i < 6; i++) {
                        if (i == 0) {
                            pioPdfVO.drawTextC(userInfo.get("DGNSS_ORD_FIRST").toString() + "차", x[0], y[i] + 7f, alignWidth, "", 11f, false, false, Color.BLACK, -0.46f);
                            pioPdfVO.drawTextC(score4_first[i], x[0], y[i], alignWidth, "Pretendard Semibold", 10f, false, false, getColorByTRank(pioPdfVO, score4_first[i]));
                        } else {
                            pioPdfVO.drawTextC(userInfo.get("DGNSS_ORD_FIRST").toString() + "차", x[2], y[i] + 7.5f, alignWidth, "", 9.5f, false, false, Color.BLACK, -0.46f);
                            pioPdfVO.drawTextC(score4_first[i], x[2], y[i] + 2.5f, alignWidth, "Pretendard SemiBold", 9.5f, false, false, getColorByTRank(pioPdfVO, score4_first[i]));
                        }

                        if (i == 0) {
                            pioPdfVO.drawTextC(userInfo.get("DGNSS_ORD").toString() + "차", x[1], y[i] + 7f, alignWidth, "", 11f, false, false, Color.BLACK);
                            pioPdfVO.drawTextC(score4[i], x[1], y[i], alignWidth, "Pretendard SemiBold", 10f, false, false, getColorByTRank(pioPdfVO, score4[i]));
                        } else {
                            pioPdfVO.drawTextC(userInfo.get("DGNSS_ORD").toString() + "차", x[3], y[i] + 7.5f, alignWidth, "", 9.5f, false, false, Color.BLACK);
                            pioPdfVO.drawTextC(score4[i], x[3], y[i] + 2.5f, alignWidth, "Pretendard SemiBold", 9.5f, true, false, getColorByTRank(pioPdfVO, score4[i]));

                            if (!score4[i].equals("?") && !score4_first[i].equals("?")) {
                                if (tscore_gap[i] < 0)
                                    pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_more.png", pioPdfVO.px2mm(459f), y[i], pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                                else if (tscore_gap[i] == 0)
                                    pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_equal.png", pioPdfVO.px2mm(459f), y[i], pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                                else
                                    pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_less.png", pioPdfVO.px2mm(459f), y[i], pioPdfVO.px2mm(20f), pioPdfVO.px2mm(20f));
                            }

                        }

                    }
                }
            }

        } catch (NullPointerException e) {
            log.error("DGNSS20 페이지 생성 실패 - 데이터 누락: {}", e.getMessage());
        } catch (IOException e) {
            log.error("DGNSS20 페이지 생성 실패 - I/O 오류: {}", e.getMessage());
        } catch (Exception e) {
            log.error("DGNSS20 페이지 생성 실패 - 예상치 못한 오류: {}", e.getMessage());
        }

    }

    public void addDgnssPage_DGNSS20_COCH(PioPdfVO pioPdfVO, PDDocument doc, PDPageContentStream cont, int page, Map<String, Object> testInfo, List<Map<String, Object>> dgnssReportLS, List<Map<String, Object>> dgnssReportSection, List<Map<String, Object>> dgnssReportValidity, List<Map<String, Object>> dgnssReportMem, List<Map<String, Object>> dgnssReportStat3, List<Map<String, Object>> dgnssReportStat5) throws IOException {
        // 첫 페이지에서 캐시 초기화 (요청별 격리)
        if (page == 1) {
            reportCacheMap.clear();
        }
        float[] x = new float[15];
        float[] y = new float[31];

        float height = pioPdfVO.px2mm(20f);
        float textHeight = pioPdfVO.px2mm(6f);
        float fontSize = 9.5f;
        y[0] = pioPdfVO.px2mm(234f, "Y");

        float bgPadding = pioPdfVO.px2mm(0.5f);
        Color redBg = pioPdfVO.hexa2Color("#FFC7B2");
        Color yellowBg = pioPdfVO.hexa2Color("#FFEE99");
        Color redText = pioPdfVO.hexa2Color("#FF4800");
        boolean isVivaClassNickName = StringUtils.isNotEmpty(MapUtils.getString(testInfo, "clsType", "")) && StringUtils.equals("5", MapUtils.getString(testInfo, "clsType", ""));
        for (int i = 1; i < 31; i++)
            y[i] = y[i - 1] - height;

        try {

            if (page > 1 && page != 13) {
                pioPdfVO.drawHeaderCoch(page, testInfo, isVivaClassNickName);
                pioPdfVO.drawFooter();
            }


            if (page == 1) {
                float x1 = pioPdfVO.px2mm(296f);
                float width1 = pioPdfVO.px2mm(88f);
                float fontSize1 = 12f;

                // 검사일
                pioPdfVO.drawTextC((String) testInfo.get("TEST_DT_KO"), x1, pioPdfVO.px2mm(651f, "Y"), width1, "Pretendard Medium", fontSize1, false, false, Color.BLACK, -0.58f);
                // 학교
                pioPdfVO.drawTextC((String) testInfo.get("SCH_NM"), x1, pioPdfVO.px2mm(682f, "Y"), width1, "Pretendard Medium", fontSize1, false, false, Color.BLACK, -0.58f);
                // 학급
                if (isVivaClassNickName) {
                    pioPdfVO.drawTextC((String) testInfo.get("nickNameClass"), x1, pioPdfVO.px2mm(714f, "Y"), width1, "Pretendard Medium", fontSize1, false, false, Color.BLACK, -0.58f);
                } else {
                    pioPdfVO.drawTextC(testInfo.get("MEM_GRADE_NM") + " " + testInfo.get("CLASS_NM"), x1, pioPdfVO.px2mm(714f, "Y"), width1, "Pretendard Medium", fontSize1, false, false, Color.BLACK, -0.58f);
                }
            }
            // 검사결과(신뢰도 지표, 학습현황)
            else if (page == 5) {

                x[0] = pioPdfVO.px2mm(15f);
                x[1] = pioPdfVO.px2mm(44f);
                x[2] = pioPdfVO.px2mm(106f);
                x[3] = pioPdfVO.px2mm(134f);
                x[4] = pioPdfVO.px2mm(172f);
                x[5] = pioPdfVO.px2mm(202f);
                x[6] = pioPdfVO.px2mm(254f);
                x[7] = pioPdfVO.px2mm(314f);
                x[8] = pioPdfVO.px2mm(374f);
                x[9] = pioPdfVO.px2mm(445f);
                x[10] = pioPdfVO.px2mm(510f);
                x[11] = pioPdfVO.px2mm(575f);

                for (int i = 0; i < dgnssReportLS.size(); i++) {

                    if (dgnssReportLS.get(i).get("CLASS_NO") == null)
                        pioPdfVO.drawTextC("-", x[0], y[i] + textHeight, x[1] - x[0], "", fontSize);
                    else
                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("CLASS_NO").toString(), x[0], y[i] + textHeight, x[1] - x[0], "", fontSize);

                    if (dgnssReportLS.get(i).get("COCH_DGNSS_QESITM01_MARK").toString().equals("주의") || dgnssReportLS.get(i).get("COCH_DGNSS_QESITM02_MARK").toString().equals("주의") || StringUtils.equals("주의", dgnssReportLS.get(i).get("REPEATED_RESPONSE_YN").toString())) {
                        pioPdfVO.drawRectangle(x[1], y[i], x[2] - x[1], height, Color.BLACK, redBg, 1f);
                    }

                    pioPdfVO.drawTextC(dgnssReportLS.get(i).get("MEM_NM").toString(), x[1], y[i] + textHeight, x[2] - x[1], "", fontSize);

                    pioPdfVO.drawTextC(MapUtils.getString(dgnssReportLS.get(i), "MEM_GENDER_NM", ""), x[2], y[i] + textHeight, x[3] - x[2], "", fontSize);

                    if (dgnssReportLS.get(i).get("COCH_DGNSS_QESITM02_MARK").toString().equals("주의")) {
                        pioPdfVO.drawRectangle(x[3], y[i], x[4] - x[3], height, Color.BLACK, redBg);
                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("COCH_DGNSS_QESITM02_MARK").toString(), x[3], y[i] + textHeight, x[4] - x[3], "", fontSize, false, false, redText);
                    } else {
                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("COCH_DGNSS_QESITM02_MARK").toString(), x[3], y[i] + textHeight, x[4] - x[3], "", fontSize);
                    }

                    if (dgnssReportLS.get(i).get("COCH_DGNSS_QESITM01_MARK").toString().equals("주의")) {
                        pioPdfVO.drawRectangle(x[4], y[i], x[5] - x[4], height, Color.BLACK, redBg);
                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("COCH_DGNSS_QESITM01_MARK").toString(), x[4], y[i] + textHeight, x[5] - x[4], "", fontSize, false, false, redText);
                    } else {
                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("COCH_DGNSS_QESITM01_MARK").toString(), x[4], y[i] + textHeight, x[5] - x[4], "", fontSize);
                    }

                    // 무응답수(10건 이상이면 red)
                    // AIDT에서는 무응답이 없기때문에 연속동일반응으로 대체
                    //                    if(Integer.parseInt(dgnssReportLS.get(i).get("NO_ANS_CNT").toString()) >= 10) {
                    //                        pioPdfVO.drawRectangle(x[5], y[i], x[6] - x[5], height, Color.BLACK, redBg);
                    //                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("NO_ANS_CNT").toString(), x[5], y[i] + textHeight, x[6] - x[5], "", fontSize, false, false, redText);
                    //                    }else{
                    //                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("NO_ANS_CNT").toString(), x[5], y[i] + textHeight, x[6] - x[5], "", fontSize);
                    //                    }

                    // 연속동일반응
                    if (StringUtils.equals("주의", dgnssReportLS.get(i).get("REPEATED_RESPONSE_YN").toString())) {
                        pioPdfVO.drawRectangle(x[5], y[i], x[6] - x[5], height, Color.BLACK, redBg);
                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("REPEATED_RESPONSE_YN").toString(), x[5], y[i] + textHeight, x[6] - x[5], "", fontSize, false, false, redText);
                    } else {
                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("REPEATED_RESPONSE_YN").toString(), x[5], y[i] + textHeight, x[6] - x[5], "", fontSize);
                    }

                    // 학업성취도
                    if (dgnssReportLS.get(i).get("LS_ANS01").toString().equals("1")) {
                        pioPdfVO.drawRectangle(x[6], y[i], x[7] - x[6], height, Color.BLACK, redBg);
                        pioPdfVO.drawTextC("매우 낮음", x[6], y[i] + textHeight, x[7] - x[6], "", fontSize, false, false, redText);
                    } else if (dgnssReportLS.get(i).get("LS_ANS01").toString().equals("2")) {
                        pioPdfVO.drawRectangle(x[6], y[i], x[7] - x[6], height, Color.BLACK, yellowBg);
                        pioPdfVO.drawTextC("낮음", x[6], y[i] + textHeight, x[7] - x[6], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS01").toString().equals("3")) {
                        pioPdfVO.drawTextC("보통", x[6], y[i] + textHeight, x[7] - x[6], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS01").toString().equals("4")) {
                        pioPdfVO.drawTextC("높음", x[6], y[i] + textHeight, x[7] - x[6], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS01").toString().equals("5")) {
                        pioPdfVO.drawTextC("매우 높음", x[6], y[i] + textHeight, x[7] - x[6], "", fontSize);
                    }

                    // 성적만족도
                    if (dgnssReportLS.get(i).get("LS_ANS02").toString().equals("1")) {
                        pioPdfVO.drawRectangle(x[7], y[i], x[8] - x[7], height, Color.BLACK, redBg);
                        pioPdfVO.drawTextC("매우 낮음", x[7], y[i] + textHeight, x[8] - x[7], "", fontSize, false, false, redText);
                    } else if (dgnssReportLS.get(i).get("LS_ANS02").toString().equals("2")) {
                        pioPdfVO.drawRectangle(x[7], y[i], x[8] - x[7], height, Color.BLACK, yellowBg);
                        pioPdfVO.drawTextC("낮음", x[7], y[i] + textHeight, x[8] - x[7], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS02").toString().equals("3")) {
                        pioPdfVO.drawTextC("보통", x[7], y[i] + textHeight, x[8] - x[7], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS02").toString().equals("4")) {
                        pioPdfVO.drawTextC("높음", x[7], y[i] + textHeight, x[8] - x[7], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS02").toString().equals("5")) {
                        pioPdfVO.drawTextC("매우 높음", x[7], y[i] + textHeight, x[8] - x[7], "", fontSize);
                    }

                    // 공부이유
                    if (dgnssReportLS.get(i).get("LS_ANS03").toString().equals("1")) {
                        pioPdfVO.drawTextC("흥미를 느껴서", x[8], y[i] + textHeight, x[9] - x[8], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS03").toString().equals("2")) {
                        pioPdfVO.drawTextC("미래를 위해서", x[8], y[i] + textHeight, x[9] - x[8], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS03").toString().equals("3")) {
                        pioPdfVO.drawTextC("대학 진학", x[8], y[i] + textHeight, x[9] - x[8], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS03").toString().equals("4")) {
                        pioPdfVO.drawTextC("주변 기대 때문에", x[8], y[i] + textHeight, x[9] - x[8], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS03").toString().equals("5")) {
                        pioPdfVO.drawTextC("모르겠음", x[8], y[i] + textHeight, x[9] - x[8], "", fontSize);
                    }

                    // 1일 혼공 시간
                    if (dgnssReportLS.get(i).get("LS_ANS04").toString().equals("1")) {
                        pioPdfVO.drawTextC("전혀 안함", x[9], y[i] + textHeight, x[10] - x[9], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS04").toString().equals("2")) {
                        pioPdfVO.drawTextC("1시간 미만", x[9], y[i] + textHeight, x[10] - x[9], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS04").toString().equals("3")) {
                        pioPdfVO.drawTextC("1~2시간", x[9], y[i] + textHeight, x[10] - x[9], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS04").toString().equals("4")) {
                        pioPdfVO.drawTextC("2~3시간", x[9], y[i] + textHeight, x[10] - x[9], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS04").toString().equals("5")) {
                        pioPdfVO.drawTextC("3시간 이상", x[9], y[i] + textHeight, x[10] - x[9], "", fontSize);
                    }

                    // 학습고민 상담
                    if (dgnssReportLS.get(i).get("LS_ANS05").toString().equals("1")) {
                        pioPdfVO.drawTextC("친구", x[10], y[i] + textHeight, x[11] - x[10], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS05").toString().equals("2")) {
                        pioPdfVO.drawTextC("선생님", x[10], y[i] + textHeight, x[11] - x[10], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS05").toString().equals("3")) {
                        pioPdfVO.drawTextC("가족", x[10], y[i] + textHeight, x[11] - x[10], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS05").toString().equals("4")) {
                        pioPdfVO.drawTextC("상담 전문가", x[10], y[i] + textHeight, x[11] - x[10], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS05").toString().equals("5")) {
                        pioPdfVO.drawTextC("기타", x[10], y[i] + textHeight, x[11] - x[10], "", fontSize);
                    }
                }

            }
            // 검사 결과 : 동기전략(학습원동력, 정서조절)
            else if (page == 6 || page == 7 || page == 8 || page == 9) {
                int[] tScore = new int[10];
                int tScoreCnt = 0;

                if (page == 6 || page == 7) {

                    tScoreCnt = 8;

                    x[0] = pioPdfVO.px2mm(15f);
                    x[1] = pioPdfVO.px2mm(44f);
                    x[2] = pioPdfVO.px2mm(106f);
                    x[3] = pioPdfVO.px2mm(134f);
                    x[4] = pioPdfVO.px2mm(174f);
                    x[5] = pioPdfVO.px2mm(234f);
                    x[6] = pioPdfVO.px2mm(294f);
                    x[7] = pioPdfVO.px2mm(354f);
                    x[8] = pioPdfVO.px2mm(394f);
                    x[9] = pioPdfVO.px2mm(454f);
                    x[10] = pioPdfVO.px2mm(514f);
                    x[11] = pioPdfVO.px2mm(575f);
                } else if (page == 8) {
                    tScoreCnt = 10;

                    x[0] = pioPdfVO.px2mm(15f);
                    x[1] = pioPdfVO.px2mm(44f);
                    x[2] = pioPdfVO.px2mm(106f);
                    x[3] = pioPdfVO.px2mm(134f);
                    x[4] = pioPdfVO.px2mm(166f);
                    x[5] = pioPdfVO.px2mm(213f);
                    x[6] = pioPdfVO.px2mm(260f);
                    x[7] = pioPdfVO.px2mm(307f);
                    x[8] = pioPdfVO.px2mm(339f);
                    x[9] = pioPdfVO.px2mm(386f);
                    x[10] = pioPdfVO.px2mm(433f);
                    x[11] = pioPdfVO.px2mm(480f);
                    x[12] = pioPdfVO.px2mm(527f);
                    x[13] = pioPdfVO.px2mm(575f);
                } else if (page == 9) {
                    tScoreCnt = 9;

                    x[0] = pioPdfVO.px2mm(15f);
                    x[1] = pioPdfVO.px2mm(44f);
                    x[2] = pioPdfVO.px2mm(108f);
                    x[3] = pioPdfVO.px2mm(136f);
                    x[4] = pioPdfVO.px2mm(166f);
                    x[5] = pioPdfVO.px2mm(224f);
                    x[6] = pioPdfVO.px2mm(282f);
                    x[7] = pioPdfVO.px2mm(312f);
                    x[8] = pioPdfVO.px2mm(370f);
                    x[9] = pioPdfVO.px2mm(428f);
                    x[10] = pioPdfVO.px2mm(458f);
                    x[11] = pioPdfVO.px2mm(516f);
                    x[12] = pioPdfVO.px2mm(575f);
                }

                for (int i = 0; i < dgnssReportLS.size(); i++) {
                    if (page == 6) {
                        tScore[0] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_01").toString());
                        tScore[1] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_01_01").toString());
                        tScore[2] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_01_02").toString());
                        tScore[3] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_01_03").toString());

                        tScore[4] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_02").toString());
                        tScore[5] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_02_01").toString());
                        tScore[6] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_02_02").toString());
                        tScore[7] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_02_03").toString());
                    } else if (page == 7) {
                        tScore[0] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_01").toString());
                        tScore[1] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_01_01").toString());
                        tScore[2] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_01_02").toString());
                        tScore[3] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_01_03").toString());

                        tScore[4] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_02").toString());
                        tScore[5] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_02_01").toString());
                        tScore[6] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_02_02").toString());
                        tScore[7] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_02_03").toString());
                    } else if (page == 8) {
                        tScore[0] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_01").toString());
                        tScore[1] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_01_01").toString());
                        tScore[2] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_01_02").toString());
                        tScore[3] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_01_03").toString());

                        tScore[4] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_02").toString());
                        tScore[5] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_02_01").toString());
                        tScore[6] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_02_02").toString());
                        tScore[7] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_02_03").toString());
                        tScore[8] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_02_04").toString());
                        tScore[9] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_02_05").toString());
                    } else if (page == 9) {
                        tScore[0] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01").toString());
                        tScore[1] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_01").toString());
                        tScore[2] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_02").toString());
                        tScore[3] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02").toString());
                        tScore[4] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_01").toString());
                        tScore[5] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_02").toString());
                        tScore[6] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03").toString());
                        tScore[7] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_01").toString());
                        tScore[8] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_02").toString());
                    }

                    if (dgnssReportLS.get(i).get("CLASS_NO") == null)
                        pioPdfVO.drawTextC("-", x[0], y[i] + textHeight, x[1] - x[0], "", fontSize);
                    else
                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("CLASS_NO").toString(), x[0], y[i] + textHeight, x[1] - x[0], "", fontSize);

                    if (dgnssReportLS.get(i).get("COCH_DGNSS_QESITM01_MARK").toString().equals("주의") || dgnssReportLS.get(i).get("COCH_DGNSS_QESITM02_MARK").toString().equals("주의") || StringUtils.equals("주의", dgnssReportLS.get(i).get("REPEATED_RESPONSE_YN").toString()))
                        pioPdfVO.drawRectangle(x[1], y[i], x[2] - x[1], height, Color.BLACK, redBg);

                    pioPdfVO.drawTextC(dgnssReportLS.get(i).get("MEM_NM").toString(), x[1], y[i] + textHeight, x[2] - x[1], "", fontSize);

                    pioPdfVO.drawTextC(MapUtils.getString(dgnssReportLS.get(i), "MEM_GENDER_NM", ""), x[2], y[i] + textHeight, x[3] - x[2], "", fontSize);


                    for (int j = 0; j < tScoreCnt; j++) {
                        if (tScore[j] < 0) {
                            pioPdfVO.drawTextC("?", x[j + 3], y[i] + textHeight, x[j + 4] - x[j + 3], "", fontSize);
                        } else {
                            if (tScore[j] < 30) {
                                pioPdfVO.drawRectangle(x[j + 3], y[i], x[j + 4] - x[j + 3], height, Color.BLACK, redBg);
                            } else if (tScore[j] >= 30 && tScore[j] < 40) {
                                pioPdfVO.drawRectangle(x[j + 3], y[i], x[j + 4] - x[j + 3], height, Color.BLACK, yellowBg);
                            }
                            pioPdfVO.drawTextC(String.valueOf(tScore[j]), x[j + 3], y[i] + textHeight, x[j + 4] - x[j + 3], "", fontSize);
                        }
                    }

                }

            }
            // 상담 지도가 필요한 학생
            else if (page == 10) {

                float x10 = pioPdfVO.px2mm(156f);
                float x10_width = pioPdfVO.px2mm(410f);
                float[] y10 = new float[9];

                String[] memList = new String[9];


                memList[0] = dgnssReportMem.get(0).get("QESITM02_MEM").toString();
                memList[1] = dgnssReportMem.get(0).get("QESITM01_MEM").toString();
                memList[2] = dgnssReportMem.get(0).get("REPEATED_RESPONSE_YN").toString();

                memList[3] = dgnssReportMem.get(0).get("SECTION_MEM_01_01").toString();
                memList[4] = dgnssReportMem.get(0).get("SECTION_MEM_01_02").toString();
                memList[5] = dgnssReportMem.get(0).get("SECTION_MEM_02_01").toString();
                memList[6] = dgnssReportMem.get(0).get("SECTION_MEM_02_02").toString();
                memList[7] = dgnssReportMem.get(0).get("SECTION_MEM_03_01").toString();
                memList[8] = dgnssReportMem.get(0).get("SECTION_MEM_03_02").toString();

                float y10textHeight = 17f;

                y10[0] = pioPdfVO.px2mm(221f + y10textHeight, "Y");
                y10[1] = pioPdfVO.px2mm(278f + y10textHeight, "Y");
                y10[2] = pioPdfVO.px2mm(335f + y10textHeight, "Y");
                y10[3] = pioPdfVO.px2mm(421f + y10textHeight, "Y");
                y10[4] = pioPdfVO.px2mm(476f + y10textHeight, "Y");
                y10[5] = pioPdfVO.px2mm(561f + y10textHeight, "Y");
                y10[6] = pioPdfVO.px2mm(617f + y10textHeight, "Y");
                y10[7] = pioPdfVO.px2mm(702f + y10textHeight, "Y");
                y10[8] = pioPdfVO.px2mm(758f + y10textHeight, "Y");

                for (int i = 0; i < 9; i++) {
                    pioPdfVO.drawTextParagraph(memList[i], x10, y10[i], x10_width, 150, "", 10.3f, Color.BLACK, true, -0.49f);
                }

            }
            // 종합해석(반평균 분석)
            else if (page == 11) {
                // 종합분석표(대분류 T점수)

                float xStart = pioPdfVO.px2mm(180.5f);      // 그래프 시작 위치
                float barWidth = pioPdfVO.px2mm(298f);      // 그래프 바 넓이

                float[] y11 = new float[23];   // 테이블 각각 높이
                float height11 = pioPdfVO.px2mm(24f);   // 테이블 행 높이

                int i = 0;

                y11[0] = pioPdfVO.px2mm(238f, "Y");
                for (i = 1; i < 23; i++)
                    y11[i] = y11[i - 1] - height11;

                // 기준선에서 텍스트 높이
                float textHeight11 = 3f;

                int testOrd = Integer.parseInt(testInfo.get("TEST_ORD").toString());

                pioPdfVO.drawBarChart_Horizontal(xStart, y11[0] + pioPdfVO.px2mm(7f), barWidth * Float.parseFloat(getAnswerReportValue(dgnssReportStat3, 3, "01", "0", "0").get("T_SCORE").toString()) / 100.0f, pioPdfVO.px2mm(10f), Color.white, pioPdfVO.hexa2Color("#B2A7F9"));
                pioPdfVO.drawBarChart_Horizontal(xStart, y11[7] + pioPdfVO.px2mm(7f), barWidth * Float.parseFloat(getAnswerReportValue(dgnssReportStat3, 3, "02", "0", "0").get("T_SCORE").toString()) / 100.0f, pioPdfVO.px2mm(10f), Color.white, pioPdfVO.hexa2Color("#10DAFF"));
                pioPdfVO.drawBarChart_Horizontal(xStart, y11[14] + pioPdfVO.px2mm(7f), barWidth * Float.parseFloat(getAnswerReportValue(dgnssReportStat3, 3, "03", "0", "0").get("T_SCORE").toString()) / 100.0f, pioPdfVO.px2mm(10f), Color.white, pioPdfVO.hexa2Color("#FF8A94"));

                // 종합해석 1차, 2차 변화 X 좌표
                float[] x1 = new float[4];

                x1[0] = pioPdfVO.px2mm(488f);
                x1[1] = pioPdfVO.px2mm(520f);
                x1[2] = pioPdfVO.px2mm(548f);
                x1[3] = pioPdfVO.px2mm(556f);

                float x3Width = 4.74f;

                if (testOrd == 1) {

                    pioPdfVO.drawPicture("./assets/imgs/dgnss/btn/btn_total_anal_20_1st.png", pioPdfVO.px2mm(185f), pioPdfVO.px2mm(815f, "Y"), pioPdfVO.px2mm(220f), pioPdfVO.px2mm(33f));

                    pioPdfVO.drawText(testInfo.get("TEST_ORD").toString() + "차", pioPdfVO.px2mm(488f), pioPdfVO.px2mm(206f, "Y"), "Pretendard Medium", 9.5f, false, false, Color.BLACK, -0.46f);

                    float[] t_score5_1 = new float[6];
                    float[] t_score5_2 = new float[6];
                    float[] t_score5_3 = new float[8];

                    t_score5_1[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "01").get("T_SCORE").toString());
                    t_score5_1[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "02").get("T_SCORE").toString());
                    t_score5_1[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "03").get("T_SCORE").toString());
                    t_score5_1[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "01").get("T_SCORE").toString());
                    t_score5_1[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "02").get("T_SCORE").toString());
                    t_score5_1[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "03").get("T_SCORE").toString());

                    t_score5_2[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "01").get("T_SCORE").toString());
                    t_score5_2[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "02").get("T_SCORE").toString());
                    t_score5_2[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "03").get("T_SCORE").toString());
                    t_score5_2[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "01").get("T_SCORE").toString());
                    t_score5_2[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "02").get("T_SCORE").toString());
                    t_score5_2[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "03").get("T_SCORE").toString());

                    t_score5_3[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "01").get("T_SCORE").toString());
                    t_score5_3[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "02").get("T_SCORE").toString());
                    t_score5_3[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "03").get("T_SCORE").toString());
                    t_score5_3[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "01").get("T_SCORE").toString());
                    t_score5_3[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "02").get("T_SCORE").toString());
                    t_score5_3[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "03").get("T_SCORE").toString());
                    t_score5_3[6] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "04").get("T_SCORE").toString());
                    t_score5_3[7] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "05").get("T_SCORE").toString());

                    pioPdfVO.drawGraph01(t_score5_1, xStart, y11[1] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#6B30F8"));
                    pioPdfVO.drawGraph01(t_score5_2, xStart, y11[8] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#41BEFF"));
                    pioPdfVO.drawGraph01(t_score5_3, xStart, y11[15] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#FF8A94"));

                    // 대분류 점수
                    pioPdfVO.drawText(getAnswerReportValue(dgnssReportStat3, 3, "01", "0", "0").get("T_SCORE").toString(), x1[0], y11[0] + textHeight11, "", 9f, true, false);
                    pioPdfVO.drawText(getAnswerReportValue(dgnssReportStat3, 3, "02", "0", "0").get("T_SCORE").toString(), x1[0], y11[7] + textHeight11, "", 9f, true, false);
                    pioPdfVO.drawText(getAnswerReportValue(dgnssReportStat3, 3, "03", "0", "0").get("T_SCORE").toString(), x1[0], y11[14] + textHeight11, "", 9f, true, false);

                    Map<String, Object> dgnssReport;
                    int j = 1;
                    for (i = 0; i < dgnssReportStat5.size(); i++) {
                        dgnssReport = dgnssReportStat5.get(i);

                        if (j == 7 || j == 14)
                            j = j + 1;

                        pioPdfVO.drawTextC(dgnssReport.get("T_SCORE").toString(), x1[0], y11[j] + textHeight11, pioPdfVO.px2mm(12f));

                        j = j + 1;
                    }

                    pioPdfVO.drawTextC(testInfo.get("TEST_ORD").toString() + "차 : " + testInfo.get("TEST_DT"), pioPdfVO.px2mm(211f), pioPdfVO.px2mm(802f, "Y"), pioPdfVO.px2mm(68f), "Pretendard", 10f, false, false, Color.black, -0.48f);

                } else {
                    pioPdfVO.drawPicture("./assets/imgs/dgnss/btn/btn_total_anal_20_nst.png", pioPdfVO.px2mm(185f), pioPdfVO.px2mm(815f, "Y"), pioPdfVO.px2mm(220f), pioPdfVO.px2mm(33f));

                    pioPdfVO.drawText(testInfo.get("TEST_ORD_FIRST").toString() + "차", pioPdfVO.px2mm(488f), pioPdfVO.px2mm(206f, "Y"), "Pretendard Medium", 9.5f, false, false, Color.BLACK, -0.46f);
                    pioPdfVO.drawText(testInfo.get("TEST_ORD").toString() + "차", pioPdfVO.px2mm(519f), pioPdfVO.px2mm(206f, "Y"), "Pretendard Medium", 9.5f, false, false, Color.BLACK, -0.46f);


                    float[] t_score5_1_first = new float[6];
                    float[] t_score5_2_first = new float[6];
                    float[] t_score5_3_first = new float[8];

                    float[] t_score5_1 = new float[6];
                    float[] t_score5_2 = new float[6];
                    float[] t_score5_3 = new float[8];


                    t_score5_1_first[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "01").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "02").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "03").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "01").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "02").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "03").get("T_SCORE_FIRST").toString());

                    t_score5_2_first[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "01").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "02").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "03").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "01").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "02").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "03").get("T_SCORE_FIRST").toString());

                    t_score5_3_first[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "01").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "02").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "03").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "01").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "02").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "03").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[6] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "04").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[7] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "05").get("T_SCORE_FIRST").toString());


                    t_score5_1[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "01").get("T_SCORE").toString());
                    t_score5_1[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "02").get("T_SCORE").toString());
                    t_score5_1[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "03").get("T_SCORE").toString());
                    t_score5_1[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "01").get("T_SCORE").toString());
                    t_score5_1[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "02").get("T_SCORE").toString());
                    t_score5_1[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "03").get("T_SCORE").toString());

                    t_score5_2[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "01").get("T_SCORE").toString());
                    t_score5_2[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "02").get("T_SCORE").toString());
                    t_score5_2[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "03").get("T_SCORE").toString());
                    t_score5_2[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "01").get("T_SCORE").toString());
                    t_score5_2[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "02").get("T_SCORE").toString());
                    t_score5_2[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "03").get("T_SCORE").toString());

                    t_score5_3[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "01").get("T_SCORE").toString());
                    t_score5_3[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "02").get("T_SCORE").toString());
                    t_score5_3[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "03").get("T_SCORE").toString());
                    t_score5_3[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "01").get("T_SCORE").toString());
                    t_score5_3[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "02").get("T_SCORE").toString());
                    t_score5_3[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "03").get("T_SCORE").toString());
                    t_score5_3[6] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "04").get("T_SCORE").toString());
                    t_score5_3[7] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "05").get("T_SCORE").toString());

                    pioPdfVO.drawGraph01(t_score5_1_first, xStart, y11[1] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#A9ADB2"));
                    pioPdfVO.drawGraph01(t_score5_2_first, xStart, y11[8] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#A9ADB2"));
                    pioPdfVO.drawGraph01(t_score5_3_first, xStart, y11[15] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#A9ADB2"));

                    pioPdfVO.drawGraph01(t_score5_1, xStart, y11[1] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#6B30F8"));
                    pioPdfVO.drawGraph01(t_score5_2, xStart, y11[8] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#41BEFF"));
                    pioPdfVO.drawGraph01(t_score5_3, xStart, y11[15] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#FF8A94"));

                    // 대분류 점수
                    pioPdfVO.drawText(getAnswerReportValue(dgnssReportStat3, 3, "01", "0", "0").get("T_SCORE_FIRST").toString(), x1[0], y11[0] + textHeight11, "Pretendard", 9.5f, true, false);
                    pioPdfVO.drawText(getAnswerReportValue(dgnssReportStat3, 3, "02", "0", "0").get("T_SCORE_FIRST").toString(), x1[0], y11[7] + textHeight11, "Pretendard", 9.5f, true, false);
                    pioPdfVO.drawText(getAnswerReportValue(dgnssReportStat3, 3, "03", "0", "0").get("T_SCORE_FIRST").toString(), x1[0], y11[14] + textHeight11, "Pretendard", 9.5f, true, false);

                    pioPdfVO.drawText(getAnswerReportValue(dgnssReportStat3, 3, "01", "0", "0").get("T_SCORE").toString(), x1[1], y11[0] + textHeight11, "Pretendard", 9.5f, true, false);
                    pioPdfVO.drawText(getAnswerReportValue(dgnssReportStat3, 3, "02", "0", "0").get("T_SCORE").toString(), x1[1], y11[7] + textHeight11, "Pretendard", 9.5f, true, false);
                    pioPdfVO.drawText(getAnswerReportValue(dgnssReportStat3, 3, "03", "0", "0").get("T_SCORE").toString(), x1[1], y11[14] + textHeight11, "Pretendard", 9.5f, true, false);


                    //   0 , 7 , 17
                    for (i = 0; i < 3; i++) {
                        if (getAnswerReportValue(dgnssReportStat3, 3, StringUtils.leftPad(Integer.toString(i + 1), 2, "0"), "0", "0").get("T_SCORE_GAP").toString().contains("-")) {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_down_red.png", x1[2], y11[7 * i] + textHeight11, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                            pioPdfVO.drawTextC(getAnswerReportValue(dgnssReportStat3, 3, StringUtils.leftPad(Integer.toString(i + 1), 2, "0"), "0", "0").get("T_SCORE_GAP").toString(), x1[3], y11[7 * i] + textHeight11, x3Width, "", 9.5f, true, false, pioPdfVO.hexa2Color("#FF4800"));
                        } else if (getAnswerReportValue(dgnssReportStat3, 3, StringUtils.leftPad(Integer.toString(i + 1), 2, "0"), "0", "0").get("T_SCORE_GAP").toString().equals("0")) {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_maintain.png", pioPdfVO.px2mm(555f), y11[7 * i] + (height11 / 2f), pioPdfVO.px2mm(8f), pioPdfVO.px2mm(1f));
                        } else {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_up_blue.png", x1[2], y11[7 * i] + textHeight11, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                            pioPdfVO.drawTextC(getAnswerReportValue(dgnssReportStat3, 3, StringUtils.leftPad(Integer.toString(i + 1), 2, "0"), "0", "0").get("T_SCORE_GAP").toString(), x1[3], y11[7 * i] + textHeight11, x3Width, "", 9.5f, true, false, pioPdfVO.hexa2Color("#0B9DFF"));
                        }
                    }

                    Map<String, Object> dgnssReport;
                    int j = 1;
                    for (i = 0; i < dgnssReportStat5.size(); i++) {
                        dgnssReport = dgnssReportStat5.get(i);

                        if (j == 7 || j == 14)
                            j = j + 1;

                        pioPdfVO.drawText(dgnssReport.get("T_SCORE_FIRST").toString(), x1[0], y11[j] + textHeight11);
                        pioPdfVO.drawText(dgnssReport.get("T_SCORE").toString(), x1[1], y11[j] + textHeight11);

                        if (dgnssReport.get("T_SCORE_GAP").toString().contains("-")) {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_down_red.png", x1[2], y11[j] + textHeight11, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                            pioPdfVO.drawTextC(dgnssReport.get("T_SCORE_GAP").toString(), x1[3], y11[j] + textHeight11, x3Width, "", 9.12f, false, false, pioPdfVO.hexa2Color("#FF4800"));
                        } else if (dgnssReport.get("T_SCORE_GAP").toString().equals("0")) {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_maintain.png", pioPdfVO.px2mm(555f), y11[j] + (height11 / 2f), pioPdfVO.px2mm(8f), pioPdfVO.px2mm(1f));
                        } else {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_up_blue.png", x1[2], y11[j] + textHeight11, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                            pioPdfVO.drawTextC(dgnssReport.get("T_SCORE_GAP").toString(), x1[3], y11[j] + textHeight11, x3Width, "", 9.12f, false, false, pioPdfVO.hexa2Color("#0B9DFF"));
                        }

                        j = j + 1;
                    }


                    pioPdfVO.drawTextC(testInfo.get("TEST_ORD_FIRST").toString() + "차 : " + testInfo.get("TEST_DT_FIRST"), pioPdfVO.px2mm(211f), pioPdfVO.px2mm(802f, "Y"), pioPdfVO.px2mm(68f), "Pretendard Medium", 10f, false, false, pioPdfVO.hexa2Color("#A9ADB2"), -0.48f);
                    pioPdfVO.drawTextC(testInfo.get("TEST_ORD").toString() + "차 : " + testInfo.get("TEST_DT"), pioPdfVO.px2mm(309f), pioPdfVO.px2mm(802f, "Y"), pioPdfVO.px2mm(72f), "Pretendard", 10f, false, false, Color.black, -0.48f);


                }


            }

        } catch (NullPointerException e) {
            log.error("DGNSS20 COCH 페이지 생성 실패 - 데이터 누락: {}", e.getMessage());
        } catch (IOException e) {
            log.error("DGNSS20 COCH 페이지 생성 실패 - I/O 오류: {}", e.getMessage());
        } catch (Exception e) {
            log.error("DGNSS20 COCH 페이지 생성 실패 - 예상치 못한 오류: {}", e.getMessage());
        }

    }


    public void addDgnssPage_DGNSS10_COCH(PioPdfVO pioPdfVO, PDDocument doc, PDPageContentStream cont, int page, Map<String, Object> testInfo, List<Map<String, Object>> dgnssReportLS, List<Map<String, Object>> dgnssReportSection, List<Map<String, Object>> dgnssReportValidity, List<Map<String, Object>> dgnssReportMem, List<Map<String, Object>> dgnssReportStat3, List<Map<String, Object>> dgnssReportStat5) throws IOException {
        // 첫 페이지에서 캐시 초기화 (요청별 격리)
        if (page == 1) {
            reportCacheMap.clear();
        }
        float[] x = new float[17];
        float[] y = new float[30];

        float height = pioPdfVO.px2mm(20f);
        float textHeight = pioPdfVO.px2mm(6f);
        float fontSize = 9.5f;
        y[0] = pioPdfVO.px2mm(234f, "Y");

        float bgPadding = pioPdfVO.px2mm(0.5f);
        Color redBg = pioPdfVO.hexa2Color("#FFC7B2");
        Color yellowBg = pioPdfVO.hexa2Color("#FFEE99");
        Color redText = pioPdfVO.hexa2Color("#FF4800");
        boolean isVivaClassNickName = StringUtils.isNotEmpty(MapUtils.getString(testInfo, "clsType", "")) && StringUtils.equals("5", MapUtils.getString(testInfo, "clsType", ""));
        for (int i = 1; i < 30; i++)
            y[i] = y[i - 1] - height;

        try {

            if (page > 1 && page != 19) {
                pioPdfVO.drawHeaderCoch(page, testInfo, isVivaClassNickName);
                pioPdfVO.drawFooter();
            }

            if (page == 1) {
                float x1 = pioPdfVO.px2mm(296f);
                float width1 = pioPdfVO.px2mm(88f);
                float fontSize1 = 12f;

                pioPdfVO.drawTextC((String) testInfo.get("TEST_DT_KO"), x1, pioPdfVO.px2mm(651f, "Y"), width1, "Pretendard Medium", fontSize1, false, false, Color.BLACK, -0.58f);
                pioPdfVO.drawTextC((String) testInfo.get("SCH_NM"), x1, pioPdfVO.px2mm(682f, "Y"), width1, "Pretendard Medium", fontSize1, false, false, Color.BLACK, -0.58f);
                if (isVivaClassNickName) {
                    pioPdfVO.drawTextC((String) testInfo.get("nickNameClass"), x1, pioPdfVO.px2mm(714f, "Y"), width1, "Pretendard Medium", fontSize1, false, false, Color.BLACK, -0.58f);
                } else {
                    pioPdfVO.drawTextC(testInfo.get("MEM_GRADE_NM") + " " + testInfo.get("CLASS_NM"), x1, pioPdfVO.px2mm(714f, "Y"), width1, "Pretendard Medium", fontSize1, false, false, Color.BLACK, -0.58f);
                }
            }
            // 검사결과(신뢰도 지표, 학습현황)
            else if (page == 6) {

                x[0] = pioPdfVO.px2mm(15f);
                x[1] = pioPdfVO.px2mm(44f);
                x[2] = pioPdfVO.px2mm(106f);
                x[3] = pioPdfVO.px2mm(134f);
                x[4] = pioPdfVO.px2mm(172f);
                x[5] = pioPdfVO.px2mm(202f);
                x[6] = pioPdfVO.px2mm(254f);
                x[7] = pioPdfVO.px2mm(314f);
                x[8] = pioPdfVO.px2mm(374f);
                x[9] = pioPdfVO.px2mm(445f);
                x[10] = pioPdfVO.px2mm(510f);
                x[11] = pioPdfVO.px2mm(575f);

                for (int i = 0; i < dgnssReportLS.size(); i++) {

                    if (dgnssReportLS.get(i).get("CLASS_NO") == null)
                        pioPdfVO.drawTextC("-", x[0], y[i] + textHeight, x[1] - x[0], "", fontSize);
                    else
                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("CLASS_NO").toString(), x[0], y[i] + textHeight, x[1] - x[0], "", fontSize);

                    if (dgnssReportLS.get(i).get("COCH_DGNSS_QESITM01_MARK").toString().equals("주의") || dgnssReportLS.get(i).get("COCH_DGNSS_QESITM02_MARK").toString().equals("주의") || StringUtils.equals("주의", dgnssReportLS.get(i).get("REPEATED_RESPONSE_YN").toString())) {
                        pioPdfVO.drawRectangle(x[1], y[i], x[2] - x[1], height, Color.BLACK, redBg, 1f);
                    }

                    pioPdfVO.drawTextC(dgnssReportLS.get(i).get("MEM_NM").toString(), x[1], y[i] + textHeight, x[2] - x[1], "", fontSize);

                    pioPdfVO.drawTextC(MapUtils.getString(dgnssReportLS.get(i), "MEM_GENDER_NM", ""), x[2], y[i] + textHeight, x[3] - x[2], "", fontSize);

                    if (dgnssReportLS.get(i).get("COCH_DGNSS_QESITM02_MARK").toString().equals("주의")) {
                        pioPdfVO.drawRectangle(x[3], y[i], x[4] - x[3], height, Color.BLACK, redBg);
                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("COCH_DGNSS_QESITM02_MARK").toString(), x[3], y[i] + textHeight, x[4] - x[3], "", fontSize, false, false, redText);
                    } else {
                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("COCH_DGNSS_QESITM02_MARK").toString(), x[3], y[i] + textHeight, x[4] - x[3], "", fontSize);
                    }

                    if (dgnssReportLS.get(i).get("COCH_DGNSS_QESITM01_MARK").toString().equals("주의")) {
                        pioPdfVO.drawRectangle(x[4], y[i], x[5] - x[4], height, Color.BLACK, redBg);
                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("COCH_DGNSS_QESITM01_MARK").toString(), x[4], y[i] + textHeight, x[5] - x[4], "", fontSize, false, false, redText);
                    } else {
                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("COCH_DGNSS_QESITM01_MARK").toString(), x[4], y[i] + textHeight, x[5] - x[4], "", fontSize);
                    }

                    // 무응답수(10건 이상이면 red)
                    // AIDT에는 무응답이 없어서 삭제 및 연속동일반응으로 대체
                    //                    if(Integer.parseInt(dgnssReportLS.get(i).get("NO_ANS_CNT").toString()) >= 10) {
                    //                        pioPdfVO.drawRectangle(x[5], y[i], x[6] - x[5], height, Color.BLACK, redBg);
                    //                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("NO_ANS_CNT").toString(), x[5], y[i] + textHeight, x[6] - x[5], "", fontSize, false, false, redText);
                    //                    }else{
                    //                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("REPEATED_RESPONSE_YN").toString(), x[5], y[i] + textHeight, x[6] - x[5], "", fontSize);
                    //                    }

                    // 연속동일반응
                    if (StringUtils.equals("주의", dgnssReportLS.get(i).get("REPEATED_RESPONSE_YN").toString())) {
                        pioPdfVO.drawRectangle(x[5], y[i], x[6] - x[5], height, Color.BLACK, redBg);
                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("REPEATED_RESPONSE_YN").toString(), x[5], y[i] + textHeight, x[6] - x[5], "", fontSize, false, false, redText);
                    } else {
                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("REPEATED_RESPONSE_YN").toString(), x[5], y[i] + textHeight, x[6] - x[5], "", fontSize);
                    }

                    // 학업성취도
                    if (dgnssReportLS.get(i).get("LS_ANS01").toString().equals("1")) {
                        pioPdfVO.drawRectangle(x[6], y[i], x[7] - x[6], height, Color.BLACK, redBg);
                        pioPdfVO.drawTextC("매우 낮음", x[6], y[i] + textHeight, x[7] - x[6], "", fontSize, false, false, redText);
                    } else if (dgnssReportLS.get(i).get("LS_ANS01").toString().equals("2")) {
                        pioPdfVO.drawRectangle(x[6], y[i], x[7] - x[6], height, Color.BLACK, yellowBg);
                        pioPdfVO.drawTextC("낮음", x[6], y[i] + textHeight, x[7] - x[6], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS01").toString().equals("3")) {
                        pioPdfVO.drawTextC("보통", x[6], y[i] + textHeight, x[7] - x[6], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS01").toString().equals("4")) {
                        pioPdfVO.drawTextC("높음", x[6], y[i] + textHeight, x[7] - x[6], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS01").toString().equals("5")) {
                        pioPdfVO.drawTextC("매우 높음", x[6], y[i] + textHeight, x[7] - x[6], "", fontSize);
                    }

                    // 성적만족도
                    if (dgnssReportLS.get(i).get("LS_ANS02").toString().equals("1")) {
                        pioPdfVO.drawRectangle(x[7], y[i], x[8] - x[7], height, Color.BLACK, redBg);
                        pioPdfVO.drawTextC("매우 낮음", x[7], y[i] + textHeight, x[8] - x[7], "", fontSize, false, false, redText);
                    } else if (dgnssReportLS.get(i).get("LS_ANS02").toString().equals("2")) {
                        pioPdfVO.drawRectangle(x[7], y[i], x[8] - x[7], height, Color.BLACK, yellowBg);
                        pioPdfVO.drawTextC("낮음", x[7], y[i] + textHeight, x[8] - x[7], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS02").toString().equals("3")) {
                        pioPdfVO.drawTextC("보통", x[7], y[i] + textHeight, x[8] - x[7], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS02").toString().equals("4")) {
                        pioPdfVO.drawTextC("높음", x[7], y[i] + textHeight, x[8] - x[7], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS02").toString().equals("5")) {
                        pioPdfVO.drawTextC("매우 높음", x[7], y[i] + textHeight, x[8] - x[7], "", fontSize);
                    }

                    // 공부이유
                    if (dgnssReportLS.get(i).get("LS_ANS03").toString().equals("1")) {
                        pioPdfVO.drawTextC("흥미를 느껴서", x[8], y[i] + textHeight, x[9] - x[8], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS03").toString().equals("2")) {
                        pioPdfVO.drawTextC("미래를 위해서", x[8], y[i] + textHeight, x[9] - x[8], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS03").toString().equals("3")) {
                        pioPdfVO.drawTextC("대학 진학", x[8], y[i] + textHeight, x[9] - x[8], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS03").toString().equals("4")) {
                        pioPdfVO.drawTextC("주변 기대 때문에", x[8], y[i] + textHeight, x[9] - x[8], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS03").toString().equals("5")) {
                        pioPdfVO.drawTextC("모르겠음", x[8], y[i] + textHeight, x[9] - x[8], "", fontSize);
                    }

                    // 1일 혼공 시간
                    if (dgnssReportLS.get(i).get("LS_ANS04").toString().equals("1")) {
                        pioPdfVO.drawTextC("전혀 안함", x[9], y[i] + textHeight, x[10] - x[9], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS04").toString().equals("2")) {
                        pioPdfVO.drawTextC("1시간 미만", x[9], y[i] + textHeight, x[10] - x[9], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS04").toString().equals("3")) {
                        pioPdfVO.drawTextC("1~2시간", x[9], y[i] + textHeight, x[10] - x[9], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS04").toString().equals("4")) {
                        pioPdfVO.drawTextC("2~3시간", x[9], y[i] + textHeight, x[10] - x[9], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS04").toString().equals("5")) {
                        pioPdfVO.drawTextC("3시간 이상", x[9], y[i] + textHeight, x[10] - x[9], "", fontSize);
                    }

                    // 학습고민 상담
                    if (dgnssReportLS.get(i).get("LS_ANS05").toString().equals("1")) {
                        pioPdfVO.drawTextC("친구", x[10], y[i] + textHeight, x[11] - x[10], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS05").toString().equals("2")) {
                        pioPdfVO.drawTextC("선생님", x[10], y[i] + textHeight, x[11] - x[10], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS05").toString().equals("3")) {
                        pioPdfVO.drawTextC("가족", x[10], y[i] + textHeight, x[11] - x[10], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS05").toString().equals("4")) {
                        pioPdfVO.drawTextC("상담 전문가", x[10], y[i] + textHeight, x[11] - x[10], "", fontSize);
                    } else if (dgnssReportLS.get(i).get("LS_ANS05").toString().equals("5")) {
                        pioPdfVO.drawTextC("기타", x[10], y[i] + textHeight, x[11] - x[10], "", fontSize);
                    }
                }

            }
            // 검사 결과 : 동기전략(학습원동력, 정서조절)
            else if (page >= 7 && page <= 11) {
                int[] tScore = new int[13];
                int tScoreCnt = 0;

                if (page == 7) {

                    tScoreCnt = 9;

                    x[0] = pioPdfVO.px2mm(15f);
                    x[1] = pioPdfVO.px2mm(44f);
                    x[2] = pioPdfVO.px2mm(101f);
                    x[3] = pioPdfVO.px2mm(129f);
                    x[4] = pioPdfVO.px2mm(159f);
                    x[5] = pioPdfVO.px2mm(214f);
                    x[6] = pioPdfVO.px2mm(269f);
                    x[7] = pioPdfVO.px2mm(324f);
                    x[8] = pioPdfVO.px2mm(354f);
                    x[9] = pioPdfVO.px2mm(409f);
                    x[10] = pioPdfVO.px2mm(464f);
                    x[11] = pioPdfVO.px2mm(519f);
                    x[12] = pioPdfVO.px2mm(575f);
                } else if (page == 8) {
                    tScoreCnt = 10;

                    x[0] = pioPdfVO.px2mm(15f);
                    x[1] = pioPdfVO.px2mm(44f);
                    x[2] = pioPdfVO.px2mm(101f);
                    x[3] = pioPdfVO.px2mm(129f);
                    x[4] = pioPdfVO.px2mm(159f);
                    x[5] = pioPdfVO.px2mm(207f);
                    x[6] = pioPdfVO.px2mm(255f);
                    x[7] = pioPdfVO.px2mm(303f);
                    x[8] = pioPdfVO.px2mm(333f);
                    x[9] = pioPdfVO.px2mm(381f);
                    x[10] = pioPdfVO.px2mm(429f);
                    x[11] = pioPdfVO.px2mm(477f);
                    x[12] = pioPdfVO.px2mm(525f);
                    x[13] = pioPdfVO.px2mm(575f);
                } else if (page == 9) {
                    tScoreCnt = 13;

                    x[0] = pioPdfVO.px2mm(15f);
                    x[1] = pioPdfVO.px2mm(44f);
                    x[2] = pioPdfVO.px2mm(106f);
                    x[3] = pioPdfVO.px2mm(134f);
                    x[4] = pioPdfVO.px2mm(161f);
                    x[5] = pioPdfVO.px2mm(197f);
                    x[6] = pioPdfVO.px2mm(233f);
                    x[7] = pioPdfVO.px2mm(269f);
                    x[8] = pioPdfVO.px2mm(305f);
                    x[9] = pioPdfVO.px2mm(332f);
                    x[10] = pioPdfVO.px2mm(368f);
                    x[11] = pioPdfVO.px2mm(404f);
                    x[12] = pioPdfVO.px2mm(440f);
                    x[13] = pioPdfVO.px2mm(467f);
                    x[14] = pioPdfVO.px2mm(503f);
                    x[15] = pioPdfVO.px2mm(539f);
                    x[16] = pioPdfVO.px2mm(575f);
                } else if (page == 10) {
                    tScoreCnt = 7;

                    x[0] = pioPdfVO.px2mm(15f);
                    x[1] = pioPdfVO.px2mm(44f);
                    x[2] = pioPdfVO.px2mm(106f);
                    x[3] = pioPdfVO.px2mm(134f);
                    x[4] = pioPdfVO.px2mm(174f);
                    x[5] = pioPdfVO.px2mm(244f);
                    x[6] = pioPdfVO.px2mm(314f);
                    x[7] = pioPdfVO.px2mm(384f);
                    x[8] = pioPdfVO.px2mm(424f);
                    x[9] = pioPdfVO.px2mm(499f);
                    x[10] = pioPdfVO.px2mm(575f);
                } else if (page == 11) {
                    tScoreCnt = 10;

                    x[0] = pioPdfVO.px2mm(15f);
                    x[1] = pioPdfVO.px2mm(44f);
                    x[2] = pioPdfVO.px2mm(101f);
                    x[3] = pioPdfVO.px2mm(129f);
                    x[4] = pioPdfVO.px2mm(159f);
                    x[5] = pioPdfVO.px2mm(211f);
                    x[6] = pioPdfVO.px2mm(263f);
                    x[7] = pioPdfVO.px2mm(315f);
                    x[8] = pioPdfVO.px2mm(367f);
                    x[9] = pioPdfVO.px2mm(419f);
                    x[10] = pioPdfVO.px2mm(449f);
                    x[11] = pioPdfVO.px2mm(491f);
                    x[12] = pioPdfVO.px2mm(532f);
                    x[13] = pioPdfVO.px2mm(575f);
                }


                for (int i = 0; i < dgnssReportLS.size(); i++) {
                    // 긍정적 자아(01-01 3개), 대인관계능력(01-02 : 4개)
                    if (page == 7) {
                        tScore[0] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_01").toString());
                        tScore[1] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_01_01").toString());
                        tScore[2] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_01_02").toString());
                        tScore[3] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_01_03").toString());

                        tScore[4] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_02").toString());
                        tScore[5] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_02_01").toString());
                        tScore[6] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_02_02").toString());
                        tScore[7] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_02_03").toString());
                        tScore[8] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_01_02_04").toString());
                    }
                    // 메타인지(02-01 :  3개),  학습기술(02-02 : 5개)
                    else if (page == 8) {
                        tScore[0] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_01").toString());
                        tScore[1] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_01_01").toString());
                        tScore[2] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_01_02").toString());
                        tScore[3] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_01_03").toString());

                        tScore[4] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_02").toString());
                        tScore[5] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_02_01").toString());
                        tScore[6] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_02_02").toString());
                        tScore[7] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_02_03").toString());
                        tScore[8] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_02_04").toString());
                        tScore[9] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_02_05").toString());

                    }
                    // 지지적 관계(02-03 : 4개) 학업열의(04-01 : 3개) 성장력(04-02 : 3개)
                    else if (page == 9) {
                        tScore[0] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_03").toString());
                        tScore[1] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_03_01").toString());
                        tScore[2] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_03_02").toString());
                        tScore[3] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_03_03").toString());
                        tScore[4] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_02_03_04").toString());

                        tScore[5] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_04_01").toString());
                        tScore[6] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_04_01_01").toString());
                        tScore[7] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_04_01_02").toString());
                        tScore[8] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_04_01_03").toString());

                        tScore[9] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_04_02").toString());
                        tScore[10] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_04_02_01").toString());
                        tScore[11] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_04_02_02").toString());
                        tScore[12] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_04_02_03").toString());

                    }
                    // 학업스트레스(03-01 : 3개), 학습방해물(03-03 : 2개)
                    else if (page == 10) {
                        tScore[0] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_01").toString());
                        tScore[1] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_01_01").toString());
                        tScore[2] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_01_02").toString());
                        tScore[3] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_01_03").toString());

                        tScore[4] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_03").toString());
                        tScore[5] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_03_01").toString());
                        tScore[6] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_03_02").toString());


                    }
                    // 학업관계스트레스(03-02 : 5개), 학습방해물(05-01 : 3개)
                    else if (page == 11) {
                        tScore[0] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_02").toString());
                        tScore[1] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_02_01").toString());
                        tScore[2] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_02_02").toString());
                        tScore[3] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_02_03").toString());
                        tScore[4] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_02_04").toString());
                        tScore[5] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_03_02_05").toString());

                        tScore[6] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_05_01").toString());
                        tScore[7] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_05_01_01").toString());
                        tScore[8] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_05_01_02").toString());
                        tScore[9] = Integer.parseInt(dgnssReportSection.get(i).get("T_SCORE_05_01_03").toString());


                    }

                    if (dgnssReportLS.get(i).get("CLASS_NO") == null)
                        pioPdfVO.drawTextC("-", x[0], y[i] + textHeight, x[1] - x[0], "", fontSize);
                    else
                        pioPdfVO.drawTextC(dgnssReportLS.get(i).get("CLASS_NO").toString(), x[0], y[i] + textHeight, x[1] - x[0], "", fontSize);

                    if (dgnssReportLS.get(i).get("COCH_DGNSS_QESITM01_MARK").toString().equals("주의") || dgnssReportLS.get(i).get("COCH_DGNSS_QESITM02_MARK").toString().equals("주의") || StringUtils.equals("주의", dgnssReportLS.get(i).get("REPEATED_RESPONSE_YN").toString()))
                        pioPdfVO.drawRectangle(x[1], y[i], x[2] - x[1], height, Color.BLACK, redBg);

                    pioPdfVO.drawTextC(dgnssReportLS.get(i).get("MEM_NM").toString(), x[1], y[i] + textHeight, x[2] - x[1], "", fontSize);

                    pioPdfVO.drawTextC(MapUtils.getString(dgnssReportLS.get(i), "MEM_GENDER_NM", ""), x[2], y[i] + textHeight, x[3] - x[2], "", fontSize);


                    for (int j = 0; j < tScoreCnt; j++) {
                        if (tScore[j] < 0) {
                            pioPdfVO.drawTextC("?", x[j + 3], y[i] + textHeight, x[j + 4] - x[j + 3], "", fontSize);
                        } else {
                            if (page == 10 || page == 11) {
                                if (tScore[j] >= 70) {
                                    pioPdfVO.drawRectangle(x[j + 3], y[i], x[j + 4] - x[j + 3], height, Color.BLACK, redBg);
                                } else if (tScore[j] >= 60 && tScore[j] < 70) {
                                    pioPdfVO.drawRectangle(x[j + 3], y[i], x[j + 4] - x[j + 3], height, Color.BLACK, yellowBg);
                                }
                                pioPdfVO.drawTextC(String.valueOf(tScore[j]), x[j + 3], y[i] + textHeight, x[j + 4] - x[j + 3], "", fontSize);
                            } else {

                                if (tScore[j] < 30) {
                                    pioPdfVO.drawRectangle(x[j + 3], y[i], x[j + 4] - x[j + 3], height, Color.BLACK, redBg);
                                } else if (tScore[j] >= 30 && tScore[j] < 40) {
                                    pioPdfVO.drawRectangle(x[j + 3], y[i], x[j + 4] - x[j + 3], height, Color.BLACK, yellowBg);
                                }
                                pioPdfVO.drawTextC(String.valueOf(tScore[j]), x[j + 3], y[i] + textHeight, x[j + 4] - x[j + 3], "", fontSize);
                            }
                        }
                    }

                }

            }
            // 상담 지도가 필요한 학생
            else if (page >= 12 && page <= 16) {

                x[0] = pioPdfVO.px2mm(154f);
                float x_width = pioPdfVO.px2mm(413f);

                String[] memList = new String[10];
                float y_textHeight = 11f;

                int memCount = 0;

                if (page == 12) {
                    memCount = 10;

                    y[0] = pioPdfVO.px2mm(221f + y_textHeight, "Y");
                    y[1] = pioPdfVO.px2mm(277f + y_textHeight, "Y");
                    y[2] = pioPdfVO.px2mm(333f + y_textHeight, "Y");
                    y[3] = pioPdfVO.px2mm(428f + y_textHeight, "Y");
                    y[4] = pioPdfVO.px2mm(484f + y_textHeight, "Y");
                    y[5] = pioPdfVO.px2mm(540f + y_textHeight, "Y");
                    y[6] = pioPdfVO.px2mm(596f + y_textHeight, "Y");
                    y[7] = pioPdfVO.px2mm(652f + y_textHeight, "Y");
                    y[8] = pioPdfVO.px2mm(708f + y_textHeight, "Y");
                    y[9] = pioPdfVO.px2mm(764f + y_textHeight, "Y");

                    memList[0] = dgnssReportMem.get(0).get("QESITM02_MEM").toString();
                    memList[1] = dgnssReportMem.get(0).get("QESITM01_MEM").toString();
                    memList[2] = dgnssReportMem.get(0).get("REPEATED_RESPONSE_YN").toString();
                    memList[3] = dgnssReportMem.get(0).get("SECTION_MEM_01_01_01").toString();
                    memList[4] = dgnssReportMem.get(0).get("SECTION_MEM_01_01_02").toString();
                    memList[5] = dgnssReportMem.get(0).get("SECTION_MEM_01_01_03").toString();
                    memList[6] = dgnssReportMem.get(0).get("SECTION_MEM_01_02_01").toString();
                    memList[7] = dgnssReportMem.get(0).get("SECTION_MEM_01_02_02").toString();
                    memList[8] = dgnssReportMem.get(0).get("SECTION_MEM_01_02_03").toString();
                    memList[9] = dgnssReportMem.get(0).get("SECTION_MEM_01_02_04").toString();
                } else if (page == 13) {
                    memCount = 10;

                    y[0] = pioPdfVO.px2mm(221f + y_textHeight, "Y");
                    y[1] = pioPdfVO.px2mm(277f + y_textHeight, "Y");
                    y[2] = pioPdfVO.px2mm(333f + y_textHeight, "Y");
                    y[3] = pioPdfVO.px2mm(389f + y_textHeight, "Y");
                    y[4] = pioPdfVO.px2mm(445f + y_textHeight, "Y");
                    y[5] = pioPdfVO.px2mm(501f + y_textHeight, "Y");
                    y[6] = pioPdfVO.px2mm(557f + y_textHeight, "Y");
                    y[7] = pioPdfVO.px2mm(613f + y_textHeight, "Y");
                    y[8] = pioPdfVO.px2mm(698f + y_textHeight, "Y");
                    y[9] = pioPdfVO.px2mm(755f + y_textHeight, "Y");

                    memList[0] = dgnssReportMem.get(0).get("SECTION_MEM_02_01_01").toString();
                    memList[1] = dgnssReportMem.get(0).get("SECTION_MEM_02_01_02").toString();
                    memList[2] = dgnssReportMem.get(0).get("SECTION_MEM_02_01_03").toString();
                    memList[3] = dgnssReportMem.get(0).get("SECTION_MEM_02_02_01").toString();
                    memList[4] = dgnssReportMem.get(0).get("SECTION_MEM_02_02_02").toString();
                    memList[5] = dgnssReportMem.get(0).get("SECTION_MEM_02_02_03").toString();
                    memList[6] = dgnssReportMem.get(0).get("SECTION_MEM_02_02_04").toString();
                    memList[7] = dgnssReportMem.get(0).get("SECTION_MEM_02_02_05").toString();
                    memList[8] = dgnssReportMem.get(0).get("SECTION_MEM_02_03_01").toString();
                    memList[9] = dgnssReportMem.get(0).get("SECTION_MEM_02_03_02").toString();

                } else if (page == 14) {
                    memCount = 8;

                    y[0] = pioPdfVO.px2mm(221f + y_textHeight, "Y");
                    y[1] = pioPdfVO.px2mm(277f + y_textHeight, "Y");
                    y[2] = pioPdfVO.px2mm(372f + y_textHeight, "Y");
                    y[3] = pioPdfVO.px2mm(428f + y_textHeight, "Y");
                    y[4] = pioPdfVO.px2mm(484f + y_textHeight, "Y");
                    y[5] = pioPdfVO.px2mm(540f + y_textHeight, "Y");
                    y[6] = pioPdfVO.px2mm(596f + y_textHeight, "Y");
                    y[7] = pioPdfVO.px2mm(652f + y_textHeight, "Y");

                    memList[0] = dgnssReportMem.get(0).get("SECTION_MEM_02_03_03").toString();
                    memList[1] = dgnssReportMem.get(0).get("SECTION_MEM_02_03_04").toString();
                    memList[2] = dgnssReportMem.get(0).get("SECTION_MEM_04_01_01").toString();
                    memList[3] = dgnssReportMem.get(0).get("SECTION_MEM_04_01_02").toString();
                    memList[4] = dgnssReportMem.get(0).get("SECTION_MEM_04_01_03").toString();
                    memList[5] = dgnssReportMem.get(0).get("SECTION_MEM_04_02_01").toString();
                    memList[6] = dgnssReportMem.get(0).get("SECTION_MEM_04_02_02").toString();
                    memList[7] = dgnssReportMem.get(0).get("SECTION_MEM_04_02_03").toString();
                } else if (page == 15) {
                    memCount = 10;

                    y[0] = pioPdfVO.px2mm(221f + y_textHeight, "Y");
                    y[1] = pioPdfVO.px2mm(277f + y_textHeight, "Y");
                    y[2] = pioPdfVO.px2mm(333f + y_textHeight, "Y");
                    y[3] = pioPdfVO.px2mm(389f + y_textHeight, "Y");
                    y[4] = pioPdfVO.px2mm(445f + y_textHeight, "Y");
                    y[5] = pioPdfVO.px2mm(501f + y_textHeight, "Y");
                    y[6] = pioPdfVO.px2mm(557f + y_textHeight, "Y");
                    y[7] = pioPdfVO.px2mm(613f + y_textHeight, "Y");
                    y[8] = pioPdfVO.px2mm(669f + y_textHeight, "Y");
                    y[9] = pioPdfVO.px2mm(725f + y_textHeight, "Y");

                    memList[0] = dgnssReportMem.get(0).get("SECTION_MEM_03_01_01").toString();
                    memList[1] = dgnssReportMem.get(0).get("SECTION_MEM_03_01_02").toString();
                    memList[2] = dgnssReportMem.get(0).get("SECTION_MEM_03_01_03").toString();
                    memList[3] = dgnssReportMem.get(0).get("SECTION_MEM_03_03_01").toString();
                    memList[4] = dgnssReportMem.get(0).get("SECTION_MEM_03_03_02").toString();
                    memList[5] = dgnssReportMem.get(0).get("SECTION_MEM_03_02_01").toString();
                    memList[6] = dgnssReportMem.get(0).get("SECTION_MEM_03_02_02").toString();
                    memList[7] = dgnssReportMem.get(0).get("SECTION_MEM_03_02_03").toString();
                    memList[8] = dgnssReportMem.get(0).get("SECTION_MEM_03_02_04").toString();
                    memList[9] = dgnssReportMem.get(0).get("SECTION_MEM_03_02_05").toString();

                } else if (page == 16) {
                    memCount = 3;

                    y[0] = pioPdfVO.px2mm(221f + y_textHeight, "Y");
                    y[1] = pioPdfVO.px2mm(277f + y_textHeight, "Y");
                    y[2] = pioPdfVO.px2mm(333f + y_textHeight, "Y");

                    memList[0] = dgnssReportMem.get(0).get("SECTION_MEM_05_01_01").toString();
                    memList[1] = dgnssReportMem.get(0).get("SECTION_MEM_05_01_02").toString();
                    memList[2] = dgnssReportMem.get(0).get("SECTION_MEM_05_01_03").toString();


                }

                for (int i = 0; i < memCount; i++) {
                    pioPdfVO.drawTextParagraph(memList[i], x[0], y[i], x_width, 150, "", 10.3f, Color.BLACK, true, -0.49f);
                }

            }
            // 종합해석 1(자아강점, 학습디딤돌, 긍정적 공부마음 반평균 분석)
            else if (page == 17) {
                // 종합분석표(대분류 T점수)

                float xStart = pioPdfVO.px2mm(180.5f);      // 그래프 시작 위치
                float barWidth = pioPdfVO.px2mm(298f);      // 그래프 바 넓이

                float height11 = pioPdfVO.px2mm(24f);   // 테이블 행 높이

                int i = 0;

                y[0] = pioPdfVO.px2mm(238f, "Y");
                for (i = 1; i < 26; i++)
                    y[i] = y[i - 1] - height11;

                // 기준선에서 텍스트 높이
                float textHeight11 = 3f;

                int testOrd = Integer.parseInt(testInfo.get("TEST_ORD").toString());

                // 종합해석 1차, 2차 변화 X 좌표
                x[0] = pioPdfVO.px2mm(488f);
                x[1] = pioPdfVO.px2mm(520f);
                x[2] = pioPdfVO.px2mm(548f);
                x[3] = pioPdfVO.px2mm(556f);

                float x3Width = 4.74f;

                if (testOrd == 1) {

                    float[] t_score5_1 = new float[7];
                    float[] t_score5_2 = new float[8];
                    float[] t_score5_3 = new float[4];
                    float[] t_score5_4 = new float[6];

                    t_score5_1[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "01").get("T_SCORE").toString());
                    t_score5_1[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "02").get("T_SCORE").toString());
                    t_score5_1[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "03").get("T_SCORE").toString());
                    t_score5_1[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "01").get("T_SCORE").toString());
                    t_score5_1[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "02").get("T_SCORE").toString());
                    t_score5_1[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "03").get("T_SCORE").toString());
                    t_score5_1[6] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "04").get("T_SCORE").toString());

                    t_score5_2[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "01").get("T_SCORE").toString());
                    t_score5_2[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "02").get("T_SCORE").toString());
                    t_score5_2[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "03").get("T_SCORE").toString());
                    t_score5_2[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "01").get("T_SCORE").toString());
                    t_score5_2[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "02").get("T_SCORE").toString());
                    t_score5_2[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "03").get("T_SCORE").toString());
                    t_score5_2[6] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "04").get("T_SCORE").toString());
                    t_score5_2[7] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "05").get("T_SCORE").toString());

                    t_score5_3[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "03", "01").get("T_SCORE").toString());
                    t_score5_3[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "03", "02").get("T_SCORE").toString());
                    t_score5_3[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "03", "03").get("T_SCORE").toString());
                    t_score5_3[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "03", "04").get("T_SCORE").toString());

                    t_score5_4[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "01", "01").get("T_SCORE").toString());
                    t_score5_4[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "01", "02").get("T_SCORE").toString());
                    t_score5_4[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "01", "03").get("T_SCORE").toString());
                    t_score5_4[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "02", "01").get("T_SCORE").toString());
                    t_score5_4[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "02", "02").get("T_SCORE").toString());
                    t_score5_4[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "02", "03").get("T_SCORE").toString());

                    pioPdfVO.drawGraph01(t_score5_1, xStart, y[0] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#00D282"));
                    pioPdfVO.drawGraph01(t_score5_2, xStart, y[7] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#41BEFF"));
                    pioPdfVO.drawGraph01(t_score5_3, xStart, y[15] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#41BEFF"));
                    pioPdfVO.drawGraph01(t_score5_4, xStart, y[19] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#41BEFF"));

                    pioPdfVO.drawText(testInfo.get("TEST_ORD").toString() + "차", pioPdfVO.px2mm(488f), pioPdfVO.px2mm(204f, "Y"), "Pretendard Medium", 9.5f, false, false, Color.BLACK, -0.46f);

                    for (i = 0; i < 7; i++)
                        pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_1[i])), x[0], y[i] + textHeight11, pioPdfVO.px2mm(12f));
                    for (i = 0; i < 8; i++)
                        pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_2[i])), x[0], y[i + 7] + textHeight11, pioPdfVO.px2mm(12f));
                    for (i = 0; i < 4; i++)
                        pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_3[i])), x[0], y[i + 15] + textHeight11, pioPdfVO.px2mm(12f));
                    for (i = 0; i < 6; i++)
                        pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_4[i])), x[0], y[i + 19] + textHeight11, pioPdfVO.px2mm(12f));
                } else {
                    float[] t_score5_1_first = new float[7];
                    float[] t_score5_2_first = new float[8];
                    float[] t_score5_3_first = new float[4];
                    float[] t_score5_4_first = new float[6];

                    float[] t_score5_1 = new float[7];
                    float[] t_score5_2 = new float[8];
                    float[] t_score5_3 = new float[4];
                    float[] t_score5_4 = new float[6];

                    float[] t_score5_1_gap = new float[7];
                    float[] t_score5_2_gap = new float[8];
                    float[] t_score5_3_gap = new float[4];
                    float[] t_score5_4_gap = new float[6];


                    t_score5_1_first[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "01").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "02").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "03").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "01").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "02").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "03").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[6] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "04").get("T_SCORE_FIRST").toString());

                    t_score5_2_first[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "01").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "02").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "03").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "01").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "02").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "03").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[6] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "04").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[7] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "05").get("T_SCORE_FIRST").toString());

                    t_score5_3_first[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "03", "01").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "03", "02").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "03", "03").get("T_SCORE_FIRST").toString());
                    t_score5_3_first[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "03", "04").get("T_SCORE_FIRST").toString());

                    t_score5_4_first[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "01", "01").get("T_SCORE_FIRST").toString());
                    t_score5_4_first[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "01", "02").get("T_SCORE_FIRST").toString());
                    t_score5_4_first[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "01", "03").get("T_SCORE_FIRST").toString());
                    t_score5_4_first[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "02", "01").get("T_SCORE_FIRST").toString());
                    t_score5_4_first[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "02", "02").get("T_SCORE_FIRST").toString());
                    t_score5_4_first[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "02", "03").get("T_SCORE_FIRST").toString());

                    t_score5_1[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "01").get("T_SCORE").toString());
                    t_score5_1[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "02").get("T_SCORE").toString());
                    t_score5_1[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "03").get("T_SCORE").toString());
                    t_score5_1[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "01").get("T_SCORE").toString());
                    t_score5_1[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "02").get("T_SCORE").toString());
                    t_score5_1[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "03").get("T_SCORE").toString());
                    t_score5_1[6] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "04").get("T_SCORE").toString());

                    t_score5_2[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "01").get("T_SCORE").toString());
                    t_score5_2[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "02").get("T_SCORE").toString());
                    t_score5_2[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "03").get("T_SCORE").toString());
                    t_score5_2[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "01").get("T_SCORE").toString());
                    t_score5_2[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "02").get("T_SCORE").toString());
                    t_score5_2[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "03").get("T_SCORE").toString());
                    t_score5_2[6] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "04").get("T_SCORE").toString());
                    t_score5_2[7] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "05").get("T_SCORE").toString());

                    t_score5_3[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "03", "01").get("T_SCORE").toString());
                    t_score5_3[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "03", "02").get("T_SCORE").toString());
                    t_score5_3[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "03", "03").get("T_SCORE").toString());
                    t_score5_3[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "03", "04").get("T_SCORE").toString());

                    t_score5_4[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "01", "01").get("T_SCORE").toString());
                    t_score5_4[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "01", "02").get("T_SCORE").toString());
                    t_score5_4[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "01", "03").get("T_SCORE").toString());
                    t_score5_4[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "02", "01").get("T_SCORE").toString());
                    t_score5_4[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "02", "02").get("T_SCORE").toString());
                    t_score5_4[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "02", "03").get("T_SCORE").toString());

                    t_score5_1_gap[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "01").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "02").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "01", "03").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "01").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "02").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "03").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[6] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "01", "02", "04").get("T_SCORE_GAP").toString());

                    t_score5_2_gap[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "01").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "02").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "01", "03").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "01").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "02").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "03").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[6] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "04").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[7] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "02", "05").get("T_SCORE_GAP").toString());

                    t_score5_3_gap[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "03", "01").get("T_SCORE_GAP").toString());
                    t_score5_3_gap[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "03", "02").get("T_SCORE_GAP").toString());
                    t_score5_3_gap[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "03", "03").get("T_SCORE_GAP").toString());
                    t_score5_3_gap[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "02", "03", "04").get("T_SCORE_GAP").toString());

                    t_score5_4_gap[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "01", "01").get("T_SCORE_GAP").toString());
                    t_score5_4_gap[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "01", "02").get("T_SCORE_GAP").toString());
                    t_score5_4_gap[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "01", "03").get("T_SCORE_GAP").toString());
                    t_score5_4_gap[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "02", "01").get("T_SCORE_GAP").toString());
                    t_score5_4_gap[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "02", "02").get("T_SCORE_GAP").toString());
                    t_score5_4_gap[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "04", "02", "03").get("T_SCORE_GAP").toString());

                    pioPdfVO.drawGraph01(t_score5_1_first, xStart, y[0] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#A9ADB2"));
                    pioPdfVO.drawGraph01(t_score5_2_first, xStart, y[7] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#A9ADB2"));
                    pioPdfVO.drawGraph01(t_score5_3_first, xStart, y[15] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#A9ADB2"));
                    pioPdfVO.drawGraph01(t_score5_4_first, xStart, y[19] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#A9ADB2"));

                    pioPdfVO.drawGraph01(t_score5_1, xStart, y[0] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#00D282"));
                    pioPdfVO.drawGraph01(t_score5_2, xStart, y[7] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#41BEFF"));
                    pioPdfVO.drawGraph01(t_score5_3, xStart, y[15] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#41BEFF"));
                    pioPdfVO.drawGraph01(t_score5_4, xStart, y[19] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#41BEFF"));

                    pioPdfVO.drawText(testInfo.get("TEST_ORD_FIRST").toString() + "차", pioPdfVO.px2mm(488f), pioPdfVO.px2mm(204f, "Y"), "Pretendard Medium", 9.5f, false, false, Color.BLACK, -0.46f);
                    pioPdfVO.drawText(testInfo.get("TEST_ORD").toString() + "차", pioPdfVO.px2mm(519f), pioPdfVO.px2mm(204f, "Y"), "Pretendard Medium", 9.5f, false, false, Color.BLACK, -0.46f);


                    for (i = 0; i < 7; i++) {
                        pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_1_first[i])), x[0], y[i] + textHeight11, pioPdfVO.px2mm(12f));
                        pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_1[i])), x[1], y[i] + textHeight11, pioPdfVO.px2mm(12f));

                        if (t_score5_1_gap[i] < 0) {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_down_red.png", x[2], y[i] + textHeight11, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                            pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_1_gap[i])), x[3], y[i] + textHeight11, x3Width, "", 9.12f, false, false, pioPdfVO.hexa2Color("#FF4800"));
                        } else if (t_score5_1_gap[i] == 0) {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_maintain.png", pioPdfVO.px2mm(555f), y[i] + (height11 / 2f), pioPdfVO.px2mm(8f), pioPdfVO.px2mm(1f));
                        } else {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_up_blue.png", x[2], y[i] + textHeight11, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                            pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_1_gap[i])), x[3], y[i] + textHeight11, x3Width, "", 9.12f, false, false, pioPdfVO.hexa2Color("#0B9DFF"));
                        }
                    }
                    for (i = 0; i < 8; i++) {
                        pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_2_first[i])), x[0], y[i + 7] + textHeight11, pioPdfVO.px2mm(12f));
                        pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_2[i])), x[1], y[i + 7] + textHeight11, pioPdfVO.px2mm(12f));

                        if (t_score5_2_gap[i] < 0) {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_down_red.png", x[2], y[i + 7] + textHeight11, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                            pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_2_gap[i])), x[3], y[i + 7] + textHeight11, x3Width, "", 9.12f, false, false, pioPdfVO.hexa2Color("#FF4800"));
                        } else if (t_score5_2_gap[i] == 0) {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_maintain.png", pioPdfVO.px2mm(555f), y[i + 7] + (height11 / 2f), pioPdfVO.px2mm(8f), pioPdfVO.px2mm(1f));
                        } else {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_up_blue.png", x[2], y[i + 7] + textHeight11, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                            pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_2_gap[i])), x[3], y[i + 7] + textHeight11, x3Width, "", 9.12f, false, false, pioPdfVO.hexa2Color("#0B9DFF"));
                        }
                    }
                    for (i = 0; i < 4; i++) {
                        pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_3_first[i])), x[0], y[i + 15] + textHeight11, pioPdfVO.px2mm(12f));
                        pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_3[i])), x[1], y[i + 15] + textHeight11, pioPdfVO.px2mm(12f));

                        if (t_score5_3_gap[i] < 0) {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_down_red.png", x[2], y[i + 15] + textHeight11, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                            pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_3_gap[i])), x[3], y[i + 15] + textHeight11, x3Width, "", 9.12f, false, false, pioPdfVO.hexa2Color("#FF4800"));
                        } else if (t_score5_3_gap[i] == 0) {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_maintain.png", pioPdfVO.px2mm(555f), y[i + 15] + (height11 / 2f), pioPdfVO.px2mm(8f), pioPdfVO.px2mm(1f));
                        } else {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_up_blue.png", x[2], y[i + 15] + textHeight11, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                            pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_3_gap[i])), x[3], y[i + 15] + textHeight11, x3Width, "", 9.12f, false, false, pioPdfVO.hexa2Color("#0B9DFF"));
                        }
                    }
                    for (i = 0; i < 6; i++) {
                        pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_4_first[i])), x[0], y[i + 19] + textHeight11, pioPdfVO.px2mm(12f));
                        pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_4[i])), x[1], y[i + 19] + textHeight11, pioPdfVO.px2mm(12f));

                        if (t_score5_4_gap[i] < 0) {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_down_red.png", x[2], y[i + 19] + textHeight11, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                            pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_4_gap[i])), x[3], y[i + 19] + textHeight11, x3Width, "", 9.12f, false, false, pioPdfVO.hexa2Color("#FF4800"));
                        } else if (t_score5_4_gap[i] == 0) {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_maintain.png", pioPdfVO.px2mm(555f), y[i + 19] + (height11 / 2f), pioPdfVO.px2mm(8f), pioPdfVO.px2mm(1f));
                        } else {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_up_blue.png", x[2], y[i + 19] + textHeight11, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                            pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_4_gap[i])), x[3], y[i + 19] + textHeight11, x3Width, "", 9.12f, false, false, pioPdfVO.hexa2Color("#0B9DFF"));
                        }
                    }
                }

            }
            // 종합해석 2(학습 걸림돌, 부정적 공부마음 반평균 분석)
            else if (page == 18) {
                // 종합분석표(대분류 T점수)

                float xStart = pioPdfVO.px2mm(180.5f);      // 그래프 시작 위치
                float barWidth = pioPdfVO.px2mm(298f);      // 그래프 바 넓이

                float height11 = pioPdfVO.px2mm(24f);   // 테이블 행 높이

                int i = 0;

                y[0] = pioPdfVO.px2mm(238f, "Y");
                for (i = 1; i < 26; i++)
                    y[i] = y[i - 1] - height11;

                // 기준선에서 텍스트 높이
                float textHeight11 = 3f;

                int testOrd = Integer.parseInt(testInfo.get("TEST_ORD").toString());

                // 종합해석 1차, 2차 변화 X 좌표
                x[0] = pioPdfVO.px2mm(488f);
                x[1] = pioPdfVO.px2mm(520f);
                x[2] = pioPdfVO.px2mm(548f);
                x[3] = pioPdfVO.px2mm(556f);

                float x3Width = 4.74f;

                if (testOrd == 1) {

                    float[] t_score5_1 = new float[10];
                    float[] t_score5_2 = new float[3];


                    t_score5_1[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "01").get("T_SCORE").toString());
                    t_score5_1[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "02").get("T_SCORE").toString());
                    t_score5_1[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "03").get("T_SCORE").toString());
                    t_score5_1[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "01").get("T_SCORE").toString());
                    t_score5_1[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "02").get("T_SCORE").toString());
                    t_score5_1[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "03").get("T_SCORE").toString());
                    t_score5_1[6] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "04").get("T_SCORE").toString());
                    t_score5_1[7] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "05").get("T_SCORE").toString());
                    t_score5_1[8] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "03", "01").get("T_SCORE").toString());
                    t_score5_1[9] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "03", "02").get("T_SCORE").toString());


                    t_score5_2[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "05", "01", "01").get("T_SCORE").toString());
                    t_score5_2[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "05", "01", "02").get("T_SCORE").toString());
                    t_score5_2[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "05", "01", "03").get("T_SCORE").toString());


                    pioPdfVO.drawText(testInfo.get("TEST_ORD").toString() + "차", pioPdfVO.px2mm(488f), pioPdfVO.px2mm(204f, "Y"), "Pretendard Medium", 9.5f, false, false, Color.BLACK, -0.46f);
                    pioPdfVO.drawPicture("./assets/imgs/dgnss/btn/btn_total_anal_10_1st.png", pioPdfVO.px2mm(185f), pioPdfVO.px2mm(815f, "Y"), pioPdfVO.px2mm(220f), pioPdfVO.px2mm(33f));

                    pioPdfVO.drawGraph01(t_score5_1, xStart, y[0] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#FF849F"));
                    pioPdfVO.drawGraph01(t_score5_2, xStart, y[10] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#FF87D4"));

                    for (i = 0; i < 10; i++)
                        pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_1[i])), x[0], y[i] + textHeight11, pioPdfVO.px2mm(12f));
                    for (i = 0; i < 3; i++)
                        pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_2[i])), x[0], y[i + 10] + textHeight11, pioPdfVO.px2mm(12f));

                    pioPdfVO.drawTextC(testInfo.get("TEST_ORD").toString() + "차 : " + testInfo.get("TEST_DT"), pioPdfVO.px2mm(211f), pioPdfVO.px2mm(802f, "Y"), pioPdfVO.px2mm(68f), "Pretendard", 10f, false, false, Color.black, -0.48f);
                } else {
                    float[] t_score5_1_first = new float[10];
                    float[] t_score5_2_first = new float[3];

                    float[] t_score5_1 = new float[10];
                    float[] t_score5_2 = new float[3];

                    float[] t_score5_1_gap = new float[10];
                    float[] t_score5_2_gap = new float[3];

                    t_score5_1_first[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "01").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "02").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "03").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "01").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "02").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "03").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[6] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "04").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[7] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "05").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[8] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "03", "01").get("T_SCORE_FIRST").toString());
                    t_score5_1_first[9] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "03", "02").get("T_SCORE_FIRST").toString());


                    t_score5_2_first[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "05", "01", "01").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "05", "01", "02").get("T_SCORE_FIRST").toString());
                    t_score5_2_first[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "05", "01", "03").get("T_SCORE_FIRST").toString());


                    t_score5_1[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "01").get("T_SCORE").toString());
                    t_score5_1[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "02").get("T_SCORE").toString());
                    t_score5_1[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "03").get("T_SCORE").toString());
                    t_score5_1[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "01").get("T_SCORE").toString());
                    t_score5_1[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "02").get("T_SCORE").toString());
                    t_score5_1[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "03").get("T_SCORE").toString());
                    t_score5_1[6] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "04").get("T_SCORE").toString());
                    t_score5_1[7] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "05").get("T_SCORE").toString());
                    t_score5_1[8] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "03", "01").get("T_SCORE").toString());
                    t_score5_1[9] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "03", "02").get("T_SCORE").toString());


                    t_score5_2[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "05", "01", "01").get("T_SCORE").toString());
                    t_score5_2[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "05", "01", "02").get("T_SCORE").toString());
                    t_score5_2[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "05", "01", "03").get("T_SCORE").toString());

                    t_score5_1_gap[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "01").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "02").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "01", "03").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[3] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "01").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[4] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "02").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[5] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "03").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[6] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "04").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[7] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "02", "05").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[8] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "03", "01").get("T_SCORE_GAP").toString());
                    t_score5_1_gap[9] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "03", "03", "02").get("T_SCORE_GAP").toString());


                    t_score5_2_gap[0] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "05", "01", "01").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[1] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "05", "01", "02").get("T_SCORE_GAP").toString());
                    t_score5_2_gap[2] = Float.parseFloat(getAnswerReportValue(dgnssReportStat5, 5, "05", "01", "03").get("T_SCORE_GAP").toString());


                    pioPdfVO.drawGraph01(t_score5_1_first, xStart, y[0] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#A9ADB2"));
                    pioPdfVO.drawGraph01(t_score5_2_first, xStart, y[10] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#A9ADB2"));


                    pioPdfVO.drawGraph01(t_score5_1, xStart, y[0] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#FF849F"));
                    pioPdfVO.drawGraph01(t_score5_2, xStart, y[10] + (height11 / 2f), barWidth, height11, 1, 1, pioPdfVO.hexa2Color("#FF87D4"));


                    pioPdfVO.drawText(testInfo.get("TEST_ORD_FIRST").toString() + "차", pioPdfVO.px2mm(488f), pioPdfVO.px2mm(204f, "Y"), "Pretendard Medium", 9.5f, false, false, Color.BLACK, -0.46f);
                    pioPdfVO.drawText(testInfo.get("TEST_ORD").toString() + "차", pioPdfVO.px2mm(519f), pioPdfVO.px2mm(204f, "Y"), "Pretendard Medium", 9.5f, false, false, Color.BLACK, -0.46f);

                    pioPdfVO.drawPicture("./assets/imgs/dgnss/btn/btn_total_anal_10_nst.png", pioPdfVO.px2mm(185f), pioPdfVO.px2mm(815f, "Y"), pioPdfVO.px2mm(220f), pioPdfVO.px2mm(33f));


                    for (i = 0; i < 10; i++) {
                        pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_1_first[i])), x[0], y[i] + textHeight11, pioPdfVO.px2mm(12f));
                        pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_1[i])), x[1], y[i] + textHeight11, pioPdfVO.px2mm(12f));

                        if (t_score5_1_gap[i] < 0) {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_down_blue.png", x[2], y[i] + textHeight11, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                            pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_1_gap[i])), x[3], y[i] + textHeight11, x3Width, "", 9.12f, false, false, pioPdfVO.hexa2Color("#0B9DFF"));
                        } else if (t_score5_1_gap[i] == 0) {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_maintain.png", pioPdfVO.px2mm(555f), y[i] + (height11 / 2f), pioPdfVO.px2mm(8f), pioPdfVO.px2mm(1f));
                        } else {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_up_red.png", x[2], y[i] + textHeight11, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                            pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_1_gap[i])), x[3], y[i] + textHeight11, x3Width, "", 9.12f, false, false, pioPdfVO.hexa2Color("#FF4800"));
                        }
                    }
                    for (i = 0; i < 3; i++) {
                        pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_2_first[i])), x[0], y[i + 10] + textHeight11, pioPdfVO.px2mm(12f));
                        pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_2[i])), x[1], y[i + 10] + textHeight11, pioPdfVO.px2mm(12f));

                        if (t_score5_2_gap[i] < 0) {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_down_blue.png", x[2], y[i + 10] + textHeight11, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                            pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_2_gap[i])), x[3], y[i + 10] + textHeight11, x3Width, "", 9.12f, false, false, pioPdfVO.hexa2Color("#0B9DFF"));
                        } else if (t_score5_2_gap[i] == 0) {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_maintain.png", pioPdfVO.px2mm(555f), y[i + 10] + (height11 / 2f), pioPdfVO.px2mm(8f), pioPdfVO.px2mm(1f));
                        } else {
                            pioPdfVO.drawPicture("./assets/imgs/dgnss/ico/ico_up_red.png", x[2], y[i + 10] + textHeight11, pioPdfVO.px2mm(8f), pioPdfVO.px2mm(7f));
                            pioPdfVO.drawTextC(String.valueOf(Math.round(t_score5_2_gap[i])), x[3], y[i + 10] + textHeight11, x3Width, "", 9.12f, false, false, pioPdfVO.hexa2Color("#FF4800"));
                        }
                    }

                    pioPdfVO.drawTextC(testInfo.get("TEST_ORD_FIRST").toString() + "차 : " + testInfo.get("TEST_DT_FIRST"), pioPdfVO.px2mm(211f), pioPdfVO.px2mm(802f, "Y"), pioPdfVO.px2mm(68f), "Pretendard Medium", 10f, false, false, pioPdfVO.hexa2Color("#A9ADB2"), -0.48f);
                    pioPdfVO.drawTextC(testInfo.get("TEST_ORD").toString() + "차 : " + testInfo.get("TEST_DT"), pioPdfVO.px2mm(309f), pioPdfVO.px2mm(802f, "Y"), pioPdfVO.px2mm(72f), "Pretendard", 10f, false, false, Color.black, -0.48f);

                }

            }

        } catch (NumberFormatException e) {
            log.error("error : {}", e.getMessage());
        } catch (IOException e) {
            log.error("error : {}", e.getMessage());
        } catch (Exception e) {
            log.error("error : {}", e.getMessage());
        }

    }


    // 리스트 → Map 변환 캐시 (성능 최적화)
    private Map<String, Map<String, Object>> reportCacheMap = new HashMap<>();

    private String buildCacheKey(int depth, String class3, String class4, String class5) {
        return depth + "_" + class3 + "_" + class4 + "_" + class5;
    }

    // 리스트를 Map으로 변환 (최초 1회만 실행)
    private void buildReportCache(List<Map<String, Object>> dgnssReports, int depth) {
        for (Map<String, Object> report : dgnssReports) {
            String class3 = report.get("CLASS3").toString();
            String class4 = report.get("CLASS4") != null ? report.get("CLASS4").toString() : "";
            String class5 = report.get("CLASS5") != null ? report.get("CLASS5").toString() : "";
            String key = buildCacheKey(depth, class3, class4, class5);
            reportCacheMap.put(key, report);
        }
    }

    private Map<String, Object> getAnswerReportValue(List<Map<String, Object>> dgnssReports, int depth, String class3, String class4, String class5) {
        // 캐시 키 생성
        String cacheKey = buildCacheKey(depth, class3, class4, class5);

        // 캐시에서 조회
        if (reportCacheMap.containsKey(cacheKey)) {
            return reportCacheMap.get(cacheKey);
        }

        // 캐시 미스 시 리스트에서 검색 후 캐시에 저장
        Map<String, Object> retValue = new HashMap<String, Object>();

        for (Map<String, Object> dgnssReport : dgnssReports) {
            if (depth == 3) {
                if (dgnssReport.get("CLASS3").toString().equals(class3)) {
                    retValue = dgnssReport;
                    break;
                }
            } else if (depth == 4) {
                if (dgnssReport.get("CLASS3").toString().equals(class3) && dgnssReport.get("CLASS4").toString().equals(class4)) {
                    retValue = dgnssReport;
                    break;
                }
            } else if (depth == 5) {
                if (dgnssReport.get("CLASS3").toString().equals(class3) && dgnssReport.get("CLASS4").toString().equals(class4) && dgnssReport.get("CLASS5").toString().equals(class5)) {
                    retValue = dgnssReport;
                    break;
                }
            }
        }

        // 캐시에 저장
        reportCacheMap.put(cacheKey, retValue);
        return retValue;

    }

    private String getHabitImageFileName(String class3, String class4, String class5, String tRank) {
        String retValue = "";

        if (tRank.replaceAll(" ", "").equals("매우낮음") || tRank.replaceAll(" ", "").equals("낮음"))
            retValue = "./assets/imgs/dgnss/template02/btn/habit_" + class3 + "_" + class4 + "_" + class5 + "_on.png";
        else
            retValue = "./assets/imgs/dgnss/template02/btn/habit_" + class3 + "_" + class4 + "_" + class5 + "_off.png";

        return retValue;

    }

    private Color getColorByTRank(PioPdfVO pioPdfVO, String tRank, boolean reverse) {
        Color retValue = Color.BLACK;


        if (reverse) {
            if (tRank.replaceAll(" ", "").contains("매우낮음") || tRank.contains("낮음"))
                retValue = pioPdfVO.hexa2Color("#0B9DFF");
            else if (tRank.contains("보통"))
                retValue = pioPdfVO.hexa2Color("#00D282");
            else if (tRank.replaceAll(" ", "").contains("매우높음") || tRank.contains("높음"))
                retValue = pioPdfVO.hexa2Color("#FF4800");
            else
                retValue = Color.BLACK;

            return retValue;
        } else {
            if (tRank.replaceAll(" ", "").contains("매우낮음") || tRank.contains("낮음"))
                retValue = pioPdfVO.hexa2Color("#FF4800");
            else if (tRank.contains("보통"))
                retValue = pioPdfVO.hexa2Color("#00D282");
            else if (tRank.replaceAll(" ", "").contains("매우높음") || tRank.contains("높음"))
                retValue = pioPdfVO.hexa2Color("#0B9DFF");
            else
                retValue = Color.BLACK;

            return retValue;
        }
    }

    private Color getColorByTRank(PioPdfVO pioPdfVO, String tRank) {
        return getColorByTRank(pioPdfVO, tRank, false);
    }

    private String getMarkLevel3ImageFileName(String tRank, String dgnss, boolean reverse, int page) {
        String retValue = "";
        String dgnssTemplate = "";

        if (dgnss.equalsIgnoreCase("dgnss10")) {
            dgnssTemplate = "template01";
        } else {
            dgnssTemplate = "template02";
        }

        if (reverse) {
            if (tRank.replaceAll(" ", "").equals("매우낮음") || tRank.replaceAll(" ", "").equals("낮음"))
                retValue = "./assets/imgs/dgnss/" + dgnssTemplate + "/ico/ico_mark_high_p" + page + ".png";
            else if (tRank.replaceAll(" ", "").equals("보통"))
                retValue = "./assets/imgs/dgnss/" + dgnssTemplate + "/ico/ico_mark_mid_p" + page + ".png";
            else if (tRank.replaceAll(" ", "").equals("높음") || tRank.replaceAll(" ", "").equals("매우높음"))
                retValue = "./assets/imgs/dgnss/" + dgnssTemplate + "/ico/ico_mark_low_p" + page + ".png";
            else {
                //log.debug("tRank : {}", tRank);
                retValue = "";
            }
        } else {
            if (tRank.replaceAll(" ", "").equals("매우낮음") || tRank.replaceAll(" ", "").equals("낮음"))
                retValue = "./assets/imgs/dgnss/" + dgnssTemplate + "/ico/ico_mark_low_p" + page + ".png";
            else if (tRank.replaceAll(" ", "").equals("보통"))
                retValue = "./assets/imgs/dgnss/" + dgnssTemplate + "/ico/ico_mark_mid_p" + page + ".png";
            else if (tRank.replaceAll(" ", "").equals("높음") || tRank.replaceAll(" ", "").equals("매우높음"))
                retValue = "./assets/imgs/dgnss/" + dgnssTemplate + "/ico/ico_mark_high_p" + page + ".png";
            else {
                //log.debug("tRank : {}", tRank);
                retValue = "";
            }
        }

        return retValue;
    }

    private String getMarkImageFileName(String tRank) {
        String retValue = "";

        if (tRank.replaceAll(" ", "").equals("매우낮음"))
            retValue = "./assets/imgs/dgnss/template02/ico/ico_mark_1.png";
        else if (tRank.replaceAll(" ", "").equals("낮음"))
            retValue = "./assets/imgs/dgnss/template02/ico/ico_mark_2.png";
        else if (tRank.replaceAll(" ", "").equals("보통"))
            retValue = "./assets/imgs/dgnss/template02/ico/ico_mark_3.png";
        else if (tRank.replaceAll(" ", "").equals("높음"))
            retValue = "./assets/imgs/dgnss/template02/ico/ico_mark_4.png";
        else if (tRank.replaceAll(" ", "").equals("매우높음"))
            retValue = "./assets/imgs/dgnss/template02/ico/ico_mark_5.png";

        return retValue;
    }

    public void drawDgnssSummary_DGNSS10(PioPdfVO pioPdf, PDDocument doc, PDPageContentStream cont, Map<String, Object> dgnssData) throws IOException {
        float x = pioPdf.px2mm(298f);
        float width = pioPdf.px2mm(88f);
        float fontSize = 8f;
        float fontHeight = 10f;

        Map<String, Object> userInfo = (Map<String, Object>) dgnssData.get("userInfo");

        // 상단 학생 정보 입력
        this.drawSummaryHeader(pioPdf, userInfo, 1);

        // DEPTH4 그리기
        List<Map<String, Object>> dgnssReport4 = Collections.emptyList();
        if (dgnssData != null) {
            Object obj = dgnssData.get("dgnssReport4");
            if (obj instanceof List) {
                dgnssReport4 = (List<Map<String, Object>>) obj;

                float depth4X = 89f;
                float depth4XTextSpace = 13.5f;
                float depth4XSpace = 59f;
                float depth4Y = pioPdf.px2mm(466);

                for (Map<String, Object> report4 : dgnssReport4) {

                    String sectionNm = MapUtils.getString(report4, "SECTION_NM", "");
                    String tScore = MapUtils.getString(report4, "T_SCORE", "");
                    String tRank = MapUtils.getString(report4, "T_RANK", "");

                    Color color = this.getColorByTRankForSummary(pioPdf, tRank);
                    Color stressColor = this.getColorByTScoreForStress(pioPdf, tScore);
                    float controlSpace = this.controlSpace(tRank);

                    if (StringUtils.equals("긍정적 자아", sectionNm)) {
                        pioPdf.drawText(tScore, depth4X, depth4Y, "Pretendard Medium", fontSize, true, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth4X + depth4XTextSpace + controlSpace, depth4Y, "Pretendard Medium", fontSize, true, false, color, -0.58f);

                    } else if (StringUtils.equals("대인관계능력", sectionNm)) {
                        pioPdf.drawText(tScore, depth4X, depth4Y - 28f, "Pretendard Medium", fontSize, true, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth4X + depth4XTextSpace + controlSpace, depth4Y - 28f, "Pretendard Medium", fontSize, true, false, color, -0.58f);

                    } else if (StringUtils.equals("메타인지", sectionNm)) {
                        pioPdf.drawText(tScore, depth4X + depth4XSpace, depth4Y, "Pretendard Medium", fontSize, true, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth4X + depth4XSpace + depth4XTextSpace + controlSpace, depth4Y, "Pretendard Medium", fontSize, true, false, color, -0.58f);

                    } else if (StringUtils.equals("학습기술", sectionNm)) {
                        pioPdf.drawText(tScore, depth4X + depth4XSpace, depth4Y - 28f, "Pretendard Medium", fontSize, true, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth4X + depth4XSpace + depth4XTextSpace + controlSpace, depth4Y - 28f, "Pretendard Medium", fontSize, true, false, color, -0.58f);

                    } else if (StringUtils.equals("지지적 관계", sectionNm)) {
                        pioPdf.drawText(tScore, depth4X + depth4XSpace, depth4Y - 70.5f, "Pretendard Medium", fontSize, true, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth4X + depth4XSpace + depth4XTextSpace + controlSpace, depth4Y - 70.5f, "Pretendard Medium", fontSize, true, false, color, -0.58f);

                    } else if (StringUtils.equals("학업열의", sectionNm)) {
                        pioPdf.drawText(tScore, depth4X + depth4XSpace + depth4XSpace - 3f, depth4Y, "Pretendard Medium", fontSize, true, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth4X + depth4XSpace + depth4XSpace + depth4XTextSpace + controlSpace - 3f, depth4Y, "Pretendard Medium", fontSize, true, false, color, -0.58f);

                    } else if (StringUtils.equals("성장력", sectionNm)) {
                        pioPdf.drawText(tScore, depth4X + depth4XSpace + depth4XSpace - 3f, depth4Y - 28f, "Pretendard Medium", fontSize, true, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth4X + depth4XSpace + depth4XSpace + depth4XTextSpace + controlSpace - 3f, depth4Y - 28f, "Pretendard Medium", fontSize, true, false, color, -0.58f);

                    } else if (StringUtils.equals("학업소진", sectionNm)) {
                        pioPdf.drawText(tScore, depth4X + depth4XSpace + depth4XSpace - 3f, depth4Y - 77.5f, "Pretendard Medium", fontSize, true, false, Color.BLACK, 0f);
                        pioPdf.drawText(tRank, depth4X + depth4XSpace + depth4XSpace + depth4XTextSpace + controlSpace - 3f, depth4Y - 77.5f, "Pretendard Medium", fontSize, true, false, stressColor, -0.58f);

                    } else if (StringUtils.equals("학업스트레스", sectionNm)) {
                        pioPdf.drawText(tScore, depth4X + depth4XSpace + depth4XSpace + depth4XSpace - 2.1f, depth4Y, "Pretendard Medium", fontSize, true, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth4X + depth4XSpace + depth4XSpace + depth4XSpace + depth4XTextSpace + controlSpace - 2.1f, depth4Y, "Pretendard Medium", fontSize, true, false, stressColor, -0.58f);

                    } else if (StringUtils.equals("학습 방해물", sectionNm)) {
                        pioPdf.drawText(tScore, depth4X + depth4XSpace + depth4XSpace + depth4XSpace - 2.1f, depth4Y - 28f, "Pretendard Medium", fontSize, true, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth4X + depth4XSpace + depth4XSpace + depth4XSpace + depth4XTextSpace + controlSpace - 2.1f, depth4Y - 28f, "Pretendard Medium", fontSize, true, false, stressColor, -0.58f);

                    } else if (StringUtils.equals("학업관계 스트레스", sectionNm)) {
                        pioPdf.drawText(tScore, depth4X + depth4XSpace + depth4XSpace + depth4XSpace - 2.1f, depth4Y - 49.3f, "Pretendard Medium", fontSize, true, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth4X + depth4XSpace + depth4XSpace + depth4XSpace + depth4XTextSpace + controlSpace - 2.1f, depth4Y - 49.3f, "Pretendard Medium", fontSize, true, false, stressColor, -0.58f);
                    }
                }
            }
        }

        // 5Depth 작성
        List<Map<String, Object>> dgnssReport5 = Collections.emptyList();
        if (dgnssData != null) {
            Object obj = dgnssData.get("dgnssReport5");
            if (obj instanceof List) {
                dgnssReport5 = (List<Map<String, Object>>) obj;

                float depth5X = 89f;
                float depth5XTextSpace = 13.5f;
                float depth5XSpace = 59f;
                float depth5Y = 157.5f;
                float depthYSpace = -7f;
                float depthYTerm = -7f;

                for (Map<String, Object> report4 : dgnssReport5) {
                    String sectionNm = MapUtils.getString(report4, "SECTION_NM", "");
                    String tScore = MapUtils.getString(report4, "T_SCORE", "");
                    String tRank = MapUtils.getString(report4, "T_RANK", "");

                    Color color = this.getColorByTRankForSummary(pioPdf, tRank);
                    Color stressColor = this.getColorByTScoreForStress(pioPdf, tScore);
                    float controlSpace = this.controlSpace(tRank);

                    // 긍정적 자아
                    if (StringUtils.equals("자아존중감", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X, depth5Y, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XTextSpace + controlSpace, depth5Y, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("자기효능감", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X, depth5Y + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XTextSpace + controlSpace, depth5Y + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("성장마인드셋", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X, depth5Y + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                        // 대인관계 능력
                    } else if (StringUtils.equals("자기정서인식", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X, depth5Y + depthYSpace + depthYSpace + depthYSpace + depthYTerm, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depthYSpace + depthYTerm, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("자기정서조절", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X, depth5Y + depthYSpace + depthYSpace + depthYSpace + depthYTerm + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depthYSpace + depthYTerm + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("타인정서인식", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X, depth5Y + depthYSpace + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("타인공감능력", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X, depth5Y + depthYSpace + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                        // 메타인지
                    } else if (StringUtils.equals("계획능력", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace, depth5Y, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("점검능력", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace, depth5Y + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("조절능력", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace, depth5Y + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                        // 학습기술
                    } else if (StringUtils.equals("공부환경", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("시간관리", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("수업태도", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("노트하기", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("시험준비", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                        // 지지적 관계
                    } else if (StringUtils.equals("부모 의사소통", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace, depth5Y - 0.5f + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYTerm, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y - 0.5f + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYTerm, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("부모 학업지지", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace, depth5Y - 0.5f + depthYTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYTerm + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y - 0.5f + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYTerm + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("친구 정서지지", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace, depth5Y - 0.5f + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y - 0.5f + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("교사 정서지지", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace, depth5Y - 0.5f + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y - 0.5f + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                        // 학업열의
                    } else if (StringUtils.equals("활기", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace - 3f, depth5Y, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace - 3f + controlSpace, depth5Y, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("몰두", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace - 3f, depth5Y + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace - 3f + controlSpace, depth5Y + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("의미감", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace - 3f, depth5Y + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace - 3f + controlSpace, depth5Y + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                        // 성장력
                    } else if (StringUtils.equals("자율성", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace - 3f, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace - 3f + controlSpace, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("유능성", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace - 3f, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace - 3f + controlSpace, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("관계성", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace - 3f, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace - 3f + controlSpace, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                        // 학업소진
                    } else if (StringUtils.equals("고갈", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace - 3f, depth5Y - 77.4f, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace - 3f + controlSpace, depth5Y - 77.4f, "Pretendard Medium", fontSize, false, false, stressColor, -0.58f);

                    } else if (StringUtils.equals("무능감", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace - 3f, depth5Y - 77.4f + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace - 3f + controlSpace, depth5Y - 77.4f + depthYSpace, "Pretendard Medium", fontSize, false, false, stressColor, -0.58f);

                    } else if (StringUtils.equals("반감-냉소", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace - 3f, depth5Y - 77.4f + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace - 3f + controlSpace, depth5Y - 77.4f + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, stressColor, -0.58f);

                        // 학업 스트레스
                    } else if (StringUtils.equals("성적부담", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace + depth5XSpace - 2.1f, depth5Y, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace + depth5XSpace - 2.1f + controlSpace, depth5Y, "Pretendard Medium", fontSize, false, false, stressColor, -0.58f);

                    } else if (StringUtils.equals("공부부담", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace + depth5XSpace - 2.1f, depth5Y + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace + depth5XSpace - 2.1f + controlSpace, depth5Y + depthYSpace, "Pretendard Medium", fontSize, false, false, stressColor, -0.58f);

                    } else if (StringUtils.equals("수업부담", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace + depth5XSpace - 2.1f, depth5Y + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace + depth5XSpace - 2.1f + controlSpace, depth5Y + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, stressColor, -0.58f);

                        // 학습 방해물
                    } else if (StringUtils.equals("스마트폰 의존", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace + depth5XSpace - 2.1f, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace + depth5XSpace - 2.1f + controlSpace, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace, "Pretendard Medium", fontSize, false, false, stressColor, -0.58f);

                    } else if (StringUtils.equals("게임 과몰입", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace + depth5XSpace - 2.1f, depth5Y + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace + depth5XSpace - 2.1f + controlSpace, depth5Y + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, stressColor, -0.58f);

                        // 학업관계 스트레스
                    } else if (StringUtils.equals("부모 성적압력", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace + depth5XSpace - 2.1f, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYTerm + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace + depth5XSpace - 2.1f + controlSpace, depth5Y + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYTerm + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, stressColor, -0.58f);

                    } else if (StringUtils.equals("부모 공부부담", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace + depth5XSpace - 2.1f, depth5Y + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace + depth5XSpace - 2.1f + controlSpace, depth5Y + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, stressColor, -0.58f);

                    } else if (StringUtils.equals("친구 공부비교", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace + depth5XSpace - 2.1f, depth5Y + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace + depth5XSpace - 2.1f + controlSpace, depth5Y + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, stressColor, -0.58f);

                    } else if (StringUtils.equals("교사 성적압력", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace + depth5XSpace - 2.1f, depth5Y + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace + depth5XSpace - 2.1f + controlSpace, depth5Y + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, stressColor, -0.58f);

                    } else if (StringUtils.equals("교사 수업부담", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace + depth5XSpace - 2.1f, depth5Y + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace + depth5XSpace - 2.1f + controlSpace, depth5Y + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, stressColor, -0.58f);

                    }
                }
            }
        }

        // 하단 정보 작성(학습현황, 신뢰성 지표, 검사 해석 전문가)
        this.drawSummaryFooter(pioPdf, userInfo, 1);

    }

    public Color getColorByTRankForSummary(PioPdfVO pioPdf, String tRank) {
        Color color = Color.BLACK;

        if (StringUtils.equals("매우 낮음", tRank)) {
            color = pioPdf.hexa2Color("#F43232");
        } else if (StringUtils.equals("낮음", tRank)) {
            color = pioPdf.hexa2Color("#F48312");
        } else if (StringUtils.equals("보통", tRank)) {
            color = Color.BLACK;
        } else if (StringUtils.equals("높음", tRank)) {
            color = pioPdf.hexa2Color("#1997FF");
        } else if (StringUtils.equals("매우 높음", tRank)) {
            color = pioPdf.hexa2Color("#1D05F4");
        }

        return color;
    }

    public Color getColorByTScoreForStress(PioPdfVO pioPdf, String tScoreStr) {
        Color color = Color.BLACK;

        try {
            int tScore = Integer.parseInt(tScoreStr);

            if (tScore <= 29) {
                color = pioPdf.hexa2Color("#1D05F4"); // 보라색
            } else if (tScore <= 39) {
                color = pioPdf.hexa2Color("#1997FF"); // 파랑색
            } else if (tScore <= 59) {
                color = Color.BLACK; // 검정색
            } else if (tScore <= 69) {
                color = pioPdf.hexa2Color("#F48312"); // 주황색
            } else {
                color = pioPdf.hexa2Color("#F43232"); // 빨간색
            }
        } catch (NumberFormatException e) {
            color = Color.BLACK;
        }

        return color;
    }

    public float controlSpace(String tRank) {
        if (StringUtils.equals("매우 낮음", tRank) || StringUtils.equals("매우 높음", tRank)) {
            return -2.5f;
        } else {
            return 0f;
        }
    }

    public void drawSummaryHeader(PioPdfVO pioPdf, Map<String, Object> userInfo, int paperIdx) throws IOException {

        boolean isVivaClass = false;

        if (paperIdx == 1) {
            // 종합검사
            float fontSize = 12f;
            float y = pioPdf.px2mm(563);
            String memNm = MapUtils.getString(userInfo, "MEM_NM");
            String date = MapUtils.getString(userInfo, "RSPNS_DT", "");
            String stdtGradeInfo = MapUtils.getString(userInfo, "stdtGrade", "") + " " + MapUtils.getString(userInfo, "stdtClassNm", "") + " " + MapUtils.getString(userInfo, "stdtNo", "");
            String schName = MapUtils.getString(userInfo, "schName", "");

            // 이름
            if (memNm.length() > 8) {
                pioPdf.drawTextC(memNm, 23.5f, 180f, 17f, "Pretendard Medium", fontSize + 1f, true, false, Color.BLACK, -0.58f);
            } else {
                pioPdf.drawTextC(memNm, 23.5f, 180f, 15f, "Pretendard Medium", fontSize + 2f, true, false, Color.BLACK, -0.58f);
            }
            // 학년 반 번호
            if (isVivaClass) {
                // 담임, 전담 클래스
                if (StringUtils.equals("1", MapUtils.getString(userInfo, "clsTypeCode")) || StringUtils.equals("2", MapUtils.getString(userInfo, "clsTypeCode"))) {
                    pioPdf.drawTextC(schName, 18.5f, 172f, 24f, "Pretendard Medium", fontSize, true, false, Color.BLACK, 0f);
                    pioPdf.drawTextC(stdtGradeInfo, 18.5f, 167f, 24f, "Pretendard Medium", fontSize, true, false, Color.BLACK, 0f);
                } else {
                // 닉네임, 활동 클래스
                    pioPdf.drawTextC(MapUtils.getString(userInfo, "schName", ""), 18.5f, 170f, 24f, "Pretendard Medium", fontSize, true, false, Color.BLACK, 0.5f);
                }
            } else {
                pioPdf.drawTextC(schName, 18.5f, 172f, 24f, "Pretendard Medium", fontSize, true, false, Color.BLACK, 0f);
                pioPdf.drawTextC(stdtGradeInfo, 18.5f, 167f, 24f, "Pretendard Medium", fontSize, true, false, Color.BLACK, 0f);
            }

            // 응시일
            pioPdf.drawText("검사일 : " + date, 154.5f, y, "Pretendard Medium", fontSize - 2.5f, false, false, Color.BLACK, 0.5f);
            // 회차
            pioPdf.drawText(MapUtils.getString(userInfo, "DGNSS_ORD", "") + "회차", 193f, y, "Pretendard Medium", fontSize - 2.5f, false, false, Color.BLACK, 0f);
        } else {
            // 자기조절
            float fontSize = 12f;
            float y = pioPdf.px2mm(563);
            String memNm = MapUtils.getString(userInfo, "MEM_NM");
            String date = MapUtils.getString(userInfo, "RSPNS_DT", "");
            String stdtGradeInfo = MapUtils.getString(userInfo, "stdtGrade", "") + " " + MapUtils.getString(userInfo, "stdtClassNm", "") + " " + MapUtils.getString(userInfo, "stdtNo", "");
            String schName = MapUtils.getString(userInfo, "schName", "");

            // 이름
            if (memNm.length() > 8) {
                pioPdf.drawTextC(memNm, 29f, 171f, 17f, "Pretendard Medium", fontSize + 1f, true, false, Color.BLACK, -0.58f);
            } else {
                pioPdf.drawTextC(memNm, 29f, 171f, 15f, "Pretendard Medium", fontSize + 2f, true, false, Color.BLACK, -0.58f);
            }
            // 학년 반 번호
            if (isVivaClass) {
                // 담임, 전담 클래스
                if (StringUtils.equals("1", MapUtils.getString(userInfo, "clsTypeCode")) || StringUtils.equals("2", MapUtils.getString(userInfo, "clsTypeCode"))) {
                    pioPdf.drawTextC(schName, 25f, 163f, 23f, "Pretendard Medium", fontSize, true, false, Color.BLACK, 0f);
                    pioPdf.drawTextC(stdtGradeInfo, 25f, 158f, 23f, "Pretendard Medium", fontSize, true, false, Color.BLACK, 0f);
                } else {
                // 닉네임, 활동 클래스
                    pioPdf.drawTextC(MapUtils.getString(userInfo, "schName", ""), 24f, 161f, 24f, "Pretendard Medium", fontSize, true, false, Color.BLACK, 0.5f);
                }
            } else {
                pioPdf.drawTextC(schName, 25f, 163f, 23f, "Pretendard Medium", fontSize, true, false, Color.BLACK, 0f);
                pioPdf.drawTextC(stdtGradeInfo, 25f, 158f, 23f, "Pretendard Medium", fontSize, true, false, Color.BLACK, 0f);
            }

            // 응시일
            pioPdf.drawText("검사일 : " + date, 160f, y, "Pretendard Medium", fontSize - 2.5f, false, false, Color.BLACK, 0.5f);
            // 회차
            pioPdf.drawText(MapUtils.getString(userInfo, "DGNSS_ORD", "") + "회차", 198f, y, "Pretendard Medium", fontSize - 2.5f, false, false, Color.BLACK, 0f);
        }
    }

    public void drawSummaryFooter(PioPdfVO pioPdf, Map<String, Object> userInfo, int paperIdx) throws IOException {
        if (paperIdx == 1) {
            // 종합검사
            float fontSize = 8f;
            float x = 102f;
            float y = 40f;
            float lsAnsYSpace = -6.4f;

            // 학습 현황
            String lsAns01 = MapUtils.getString(userInfo, "LS_ANS01", "");
            String lsAns02 = MapUtils.getString(userInfo, "LS_ANS02", "");
            String lsAns03 = MapUtils.getString(userInfo, "LS_ANS03", "");
            String lsAns04 = MapUtils.getString(userInfo, "LS_ANS04", "");
            String lsAns05 = MapUtils.getString(userInfo, "LS_ANS05", "");

            // 나의 학업 성취도
            if (StringUtils.equals(lsAns01, "1")) {
                pioPdf.drawText("매우 낮음", x - 2f, y, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns01, "2")) {
                pioPdf.drawText("낮음", x, y, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns01, "3")) {
                pioPdf.drawText("보통", x, y, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns01, "4")) {
                pioPdf.drawText("높음", x, y, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns01, "5")) {
                pioPdf.drawText("매우 높음", x - 2f, y, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            }

            // 나의 성적 만족도
            if (StringUtils.equals(lsAns02, "1")) {
                pioPdf.drawText("매우 낮음", x - 2f, y + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns02, "2")) {
                pioPdf.drawText("낮음", x, y + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns02, "3")) {
                pioPdf.drawText("보통", x, y + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns02, "4")) {
                pioPdf.drawText("높음", x, y + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns02, "5")) {
                pioPdf.drawText("매우 높음", x - 2f, y + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            }

            // 나의 공부 이유 1순위
            if (StringUtils.equals(lsAns03, "1")) {
                pioPdf.drawText("흥미를 느껴서", x - 4f, y + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns03, "2")) {
                pioPdf.drawText("미래를 위해서", x - 4f, y + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns03, "3")) {
                pioPdf.drawText("대학 진학", x - 2.2f, y + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns03, "4")) {
                pioPdf.drawText("주변 기대 때문에", x  - 5f, y + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns03, "5")) {
                pioPdf.drawText("모르겠음", x - 2f, y + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            }

            // 나의 1일 평균 혼공 시간
            if (StringUtils.equals(lsAns04, "1")) {
                pioPdf.drawText("전혀 안함", x - 1.5f, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns04, "2")) {
                pioPdf.drawText("1시간 미만", x - 2f, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns04, "3")) {
                pioPdf.drawText("1~2시간", x - 1.5f, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns04, "4")) {
                pioPdf.drawText("2~3시간", x - 1.5f, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns04, "5")) {
                pioPdf.drawText("3시간 이상", x - 3f, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            }

            // 나의 학습 고민 상담사
            if (StringUtils.equals(lsAns05, "1")) {
                pioPdf.drawText("친구", x, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns05, "2")) {
                pioPdf.drawText("선생님", x - 1f, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns05, "3")) {
                pioPdf.drawText("가족", x, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns05, "4")) {
                pioPdf.drawText("상담 전문가", x - 3f, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns05, "5")) {
                pioPdf.drawText("기타", x, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            }

            // 반응 일관성
            String qesitm01 = MapUtils.getString(userInfo, "COCH_DGNSS_QESITM01_MARK", "");
            // 사회적 바람직성
            String qesitm02 = MapUtils.getString(userInfo, "COCH_DGNSS_QESITM02_MARK", "");
            // 연속동일반응
            String repeatResponse = MapUtils.getString(userInfo, "REPEATED_RESPONSE_YN", "");

            float trustX = 171.5f;
            float trustY = 38f;
            float trustYTerm = -10.5f;

            // 신뢰성 지표 작성
            if (StringUtils.equals(qesitm01, "주의")) {
                pioPdf.drawText(qesitm01, trustX, trustY, "Pretendard Medium", fontSize + 0.5f, true, false, pioPdf.hexa2Color("#F43232"), -0.58f);
            } else {
                pioPdf.drawText(qesitm01, trustX, trustY, "Pretendard Medium", fontSize + 0.5f, true, false, Color.BLACK, -0.58f);
            }

            if (StringUtils.equals(qesitm02, "주의")) {
                pioPdf.drawText(qesitm02, trustX, trustY + trustYTerm, "Pretendard Medium", fontSize + 0.5f, true, false, pioPdf.hexa2Color("#F43232"), -0.58f);
            } else {
                pioPdf.drawText(qesitm02, trustX, trustY + trustYTerm, "Pretendard Medium", fontSize + 0.5f, true, false, Color.BLACK, -0.58f);
            }

            if (StringUtils.equals(repeatResponse, "주의")) {
                pioPdf.drawText("주의", trustX, trustY + trustYTerm + trustYTerm, "Pretendard Medium", fontSize + 0.5f, true, false, pioPdf.hexa2Color("#F43232"), -0.58f);
            } else {
                pioPdf.drawText("양호", trustX, trustY + trustYTerm + trustYTerm, "Pretendard Medium", fontSize + 0.5f, true, false, Color.BLACK, -0.58f);
            }

            // 검사해석 전문가
            String teacherNm = MapUtils.getString(userInfo, "tcNm", "김비상");
            pioPdf.drawText("검사 해석 전문가 : " + teacherNm, 14f, 7f, "Pretendard Medium", 9f, true, false, pioPdf.hexa2Color("#8649EC"), -0.58f);
        } else {
            // 자기조절
            float fontSize = 8f;
            float x = 101f;
            float y = 39.5f;
            float lsAnsYSpace = -6.2f;

            // 학습 현황
            String lsAns01 = MapUtils.getString(userInfo, "LS_ANS01", "");
            String lsAns02 = MapUtils.getString(userInfo, "LS_ANS02", "");
            String lsAns03 = MapUtils.getString(userInfo, "LS_ANS03", "");
            String lsAns04 = MapUtils.getString(userInfo, "LS_ANS04", "");
            String lsAns05 = MapUtils.getString(userInfo, "LS_ANS05", "");

            // 나의 학업 성취도
            if (StringUtils.equals(lsAns01, "1")) {
                pioPdf.drawText("매우 낮음", x - 3f, y, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns01, "2")) {
                pioPdf.drawText("낮음", x, y, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns01, "3")) {
                pioPdf.drawText("보통", x, y, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns01, "4")) {
                pioPdf.drawText("높음", x, y, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns01, "5")) {
                pioPdf.drawText("매우 높음", x - 3f, y, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            }

            // 나의 성적 만족도
            if (StringUtils.equals(lsAns02, "1")) {
                pioPdf.drawText("매우 낮음", x - 3f, y + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns02, "2")) {
                pioPdf.drawText("낮음", x, y + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns02, "3")) {
                pioPdf.drawText("보통", x, y + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns02, "4")) {
                pioPdf.drawText("높음", x, y + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns02, "5")) {
                pioPdf.drawText("매우 높음", x - 3f, y + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            }

            // 나의 공부 이유 1순위
            if (StringUtils.equals(lsAns03, "1")) {
                pioPdf.drawText("흥미를 느껴서", x - 4f, y + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns03, "2")) {
                pioPdf.drawText("미래를 위해서", x - 4f, y + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns03, "3")) {
                pioPdf.drawText("대학 진학", x - 3f, y + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns03, "4")) {
                pioPdf.drawText("주변 기대 때문에", x  - 5f, y + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns03, "5")) {
                pioPdf.drawText("모르겠음", x - 2f, y + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            }

            // 나의 1일 평균 혼공 시간
            if (StringUtils.equals(lsAns04, "1")) {
                pioPdf.drawText("전혀 안함", x - 3f, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns04, "2")) {
                pioPdf.drawText("1시간 미만", x - 2.5f, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns04, "3")) {
                pioPdf.drawText("1~2시간", x - 2f, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns04, "4")) {
                pioPdf.drawText("2~3시간", x - 2f, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns04, "5")) {
                pioPdf.drawText("3시간 이상", x - 4f, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            }

            // 나의 학습 고민 상담사
            if (StringUtils.equals(lsAns05, "1")) {
                pioPdf.drawText("친구", x, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns05, "2")) {
                pioPdf.drawText("선생님", x - 1f, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns05, "3")) {
                pioPdf.drawText("가족", x, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns05, "4")) {
                pioPdf.drawText("상담 전문가", x - 2.5f, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            } else if (StringUtils.equals(lsAns05, "5")) {
                pioPdf.drawText("기타", x, y + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace + lsAnsYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
            }

            // 반응 일관성
            String qesitm01 = MapUtils.getString(userInfo, "COCH_DGNSS_QESITM01_MARK", "");
            // 사회적 바람직성
            String qesitm02 = MapUtils.getString(userInfo, "COCH_DGNSS_QESITM02_MARK", "");
            // 연속동일반응
            String repeatResponse = MapUtils.getString(userInfo, "REPEATED_RESPONSE_YN", "");

            float trustX = 171.5f;
            float trustY = 38f;
            float trustYTerm = -10.5f;

            // 신뢰성 지표 작성
            if (StringUtils.equals(qesitm01, "주의")) {
                pioPdf.drawText(qesitm01, trustX, trustY, "Pretendard Medium", fontSize - 0.5f, true, false, pioPdf.hexa2Color("#F43232"), -0.58f);
            } else {
                pioPdf.drawText(qesitm01, trustX, trustY, "Pretendard Medium", fontSize - 0.5f, true, false, Color.BLACK, -0.58f);
            }

            if (StringUtils.equals(qesitm02, "주의")) {
                pioPdf.drawText(qesitm02, trustX, trustY + trustYTerm, "Pretendard Medium", fontSize - 0.5f, true, false, pioPdf.hexa2Color("#F43232"), -0.58f);
            } else {
                pioPdf.drawText(qesitm02, trustX, trustY + trustYTerm, "Pretendard Medium", fontSize - 0.5f, true, false, Color.BLACK, -0.58f);
            }

            if (StringUtils.equals(repeatResponse, "주의")) {
                pioPdf.drawText("주의", trustX, trustY + trustYTerm + trustYTerm, "Pretendard Medium", fontSize - 0.5f, true, false, pioPdf.hexa2Color("#F43232"), -0.58f);
            } else {
                pioPdf.drawText("양호", trustX, trustY + trustYTerm + trustYTerm, "Pretendard Medium", fontSize - 0.5f, true, false, Color.BLACK, -0.58f);
            }

            // 검사해석 전문가
            String teacherNm = MapUtils.getString(userInfo, "teacherNm", "김비상");
            pioPdf.drawText("검사 해석 전문가 : " + teacherNm, 14.5f, 7.5f, "Pretendard Medium", 9f, true, false, pioPdf.hexa2Color("#00B298"), -0.58f);
        }


    }


    public void drawDgnssSummary_DGNSS20(PioPdfVO pioPdf, PDDocument doc, PDPageContentStream cont, Map<String, Object> dgnssData) throws IOException {
        float fontSize = 9f;
        float fontHeight = 3f;

        Map<String, Object> userInfo = (Map<String, Object>) dgnssData.get("userInfo");

        // 상단 학생 정보 입력
        this.drawSummaryHeader(pioPdf, userInfo, 2);

        // DEPTH3 그리기
        List<Map<String, Object>> dgnssReport3 = Collections.emptyList();
        if (dgnssData != null) {
            Object obj = dgnssData.get("dgnssReport3");
            if (obj instanceof List) {
                dgnssReport3 = (List<Map<String, Object>>) obj;

                float depth3FontSize = 10f;
                float depth3X = 96.5f;
                float depth3XTextSpace = 12f;
                float depth3XTerm = 73f;
                float depth3Y = 173.5f;

                for (Map<String, Object> report3 : dgnssReport3) {
                    String sectionNm = MapUtils.getString(report3, "SECTION_NM", "");
                    String tScore = MapUtils.getString(report3, "T_SCORE", "");
                    String tRank = MapUtils.getString(report3, "T_RANK", "");

                    Color color = this.getColorByTRankForSummary(pioPdf, tRank);
                    float controlSpace = this.controlSpace(tRank);

                    if (StringUtils.equals("동기전략", sectionNm)) {
                        pioPdf.drawText(tScore, depth3X, depth3Y, "Pretendard Medium", depth3FontSize, true, false, Color.BLACK, 0f);
                        pioPdf.drawText(tRank, depth3X + depth3XTextSpace + controlSpace, depth3Y, "Pretendard Medium", depth3FontSize, true, false, color, 0f);

                    } else if (StringUtils.equals("인지전략", sectionNm)) {
                        pioPdf.drawText(tScore, depth3X + depth3XTerm, depth3Y, "Pretendard Medium", depth3FontSize, true, false, Color.BLACK, 0f);
                        pioPdf.drawText(tRank, depth3X + depth3XTerm + depth3XTextSpace + controlSpace, depth3Y, "Pretendard Medium", depth3FontSize, true, false, color, 0f);

                    } else if (StringUtils.equals("행동전략", sectionNm)) {
                        pioPdf.drawText(tScore, depth3X + depth3XTerm + depth3XTerm - 1f, depth3Y, "Pretendard Medium", depth3FontSize, true, false, Color.BLACK, 0f);
                        pioPdf.drawText(tRank, depth3X + depth3XTerm + depth3XTerm + depth3XTextSpace + controlSpace - 1f, depth3Y, "Pretendard Medium", depth3FontSize, true, false, color, 0f);

                    }
                }
            }
        }

        // DEPTH4 그리기
        List<Map<String, Object>> dgnssReport4 = Collections.emptyList();
        if (dgnssData != null) {
            Object obj = dgnssData.get("dgnssReport4");
            if (obj instanceof List) {
                dgnssReport4 = (List<Map<String, Object>>) obj;

                float depth4X = 110f;
                float depth4XTextSpace = 16f;
                float depth4XSpace = 73f;
                float depth4Y = 155f;
                float depth4YTerm = -31f;

                for (Map<String, Object> report4 : dgnssReport4) {

                    String sectionNm = MapUtils.getString(report4, "SECTION_NM", "");
                    String tScore = MapUtils.getString(report4, "T_SCORE", "");
                    String tRank = MapUtils.getString(report4, "T_RANK", "");

                    Color color = this.getColorByTRankForSummary(pioPdf, tRank);
                    float controlSpace = this.controlSpace(tRank);

                    if (StringUtils.equals("학습원동력", sectionNm)) {
                        pioPdf.drawText(tScore, depth4X, depth4Y, "Pretendard Medium", fontSize, true, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth4X + depth4XTextSpace + controlSpace, depth4Y, "Pretendard Medium", fontSize, true, false, color, -0.58f);

                    } else if (StringUtils.equals("정서조절", sectionNm)) {
                        pioPdf.drawText(tScore, depth4X, depth4Y + depth4YTerm, "Pretendard Medium", fontSize, true, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth4X + depth4XTextSpace + controlSpace, depth4Y + depth4YTerm, "Pretendard Medium", fontSize, true, false, color, -0.58f);

                    } else if (StringUtils.equals("메타인지", sectionNm)) {
                        pioPdf.drawText(tScore, depth4X + depth4XSpace, depth4Y, "Pretendard Medium", fontSize, true, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth4X + depth4XSpace + depth4XTextSpace + controlSpace, depth4Y, "Pretendard Medium", fontSize, true, false, color, -0.58f);

                    } else if (StringUtils.equals("인지적 학습기술", sectionNm)) {
                        pioPdf.drawText(tScore, depth4X + depth4XSpace, depth4Y + depth4YTerm, "Pretendard Medium", fontSize, true, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth4X + depth4XSpace + depth4XTextSpace + controlSpace, depth4Y + depth4YTerm, "Pretendard Medium", fontSize, true, false, color, -0.58f);

                    } else if (StringUtils.equals("행동조절", sectionNm)) {
                        pioPdf.drawText(tScore, depth4X + depth4XSpace + depth4XSpace, depth4Y, "Pretendard Medium", fontSize, true, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth4X + depth4XSpace + depth4XTextSpace + depth4XSpace + controlSpace, depth4Y, "Pretendard Medium", fontSize, true, false, color, -0.58f);

                    } else if (StringUtils.equals("행동적 학습기술", sectionNm)) {
                        pioPdf.drawText(tScore, depth4X + depth4XSpace + depth4XSpace, depth4Y + depth4YTerm, "Pretendard Medium", fontSize, true, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth4X + depth4XSpace + depth4XSpace + depth4XTextSpace + controlSpace, depth4Y + depth4YTerm, "Pretendard Medium", fontSize, true, false, color, -0.58f);

                    }
                }
            }
        }

        // 5Depth 작성
        List<Map<String, Object>> dgnssReport5 = Collections.emptyList();
        if (dgnssData != null) {
            Object obj = dgnssData.get("dgnssReport5");
            if (obj instanceof List) {
                dgnssReport5 = (List<Map<String, Object>>) obj;

                float depth5X = 110f;
                float depth5XTextSpace = 16f;
                float depth5XSpace = 73f;
                float depth5Y = 147f;
                float depth5YTerm = -7.6f;
                float depthYSpace = -7.8f;

                for (Map<String, Object> report4 : dgnssReport5) {
                    String sectionNm = MapUtils.getString(report4, "SECTION_NM", "");
                    String tScore = MapUtils.getString(report4, "T_SCORE", "");
                    String tRank = MapUtils.getString(report4, "T_RANK", "");

                    Color color = this.getColorByTRankForSummary(pioPdf, tRank);
                    float controlSpace = this.controlSpace(tRank);

                    // 학습 원동력
                    if (StringUtils.equals("성장마인드셋", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X, depth5Y, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XTextSpace + controlSpace, depth5Y, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("학업효능감", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X, depth5Y + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XTextSpace + controlSpace, depth5Y + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("학습동기", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X, depth5Y + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                        // 정서조절
                    } else if (StringUtils.equals("성적부담 조절", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X, depth5Y + depthYSpace + depthYSpace + depthYSpace + depth5YTerm, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depth5YTerm + depth5YTerm, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("공부부담 조절", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X, depth5Y + depthYSpace + depthYSpace + depthYSpace + depth5YTerm + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depthYSpace + depth5YTerm + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("실패부담 조절", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X, depth5Y + depthYSpace + depthYSpace + depthYSpace + depth5YTerm + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depthYSpace + depth5YTerm + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                        // 메타인지
                    } else if (StringUtils.equals("계획능력", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace, depth5Y, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X  + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("점검능력", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace, depth5Y + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("조절능력", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace, depth5Y + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                        // 인지적 학습기술
                    } else if (StringUtils.equals("이해기술", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace, depth5Y + depthYSpace + depthYSpace + depth5YTerm + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depth5YTerm + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("기억기술", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace, depth5Y + depthYSpace + depthYSpace + depth5YTerm + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depth5YTerm + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("집중기술", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace, depth5Y + depthYSpace + depthYSpace + depth5YTerm + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depth5YTerm + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                        // 행동조절
                    } else if (StringUtils.equals("자기칭찬", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace, depth5Y, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("도움구하기", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace, depth5Y + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("학습지속성", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace, depth5Y + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                        // 행동적 학습기술
                    } else if (StringUtils.equals("공부환경", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace, depth5Y + depthYSpace + depthYSpace + depth5YTerm + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depth5YTerm + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("시간관리", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace, depth5Y + depthYSpace + depthYSpace + depth5YTerm + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depth5YTerm + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("수업태도", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace, depth5Y + depthYSpace + depthYSpace + depth5YTerm + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depth5YTerm + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("노트하기", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace, depth5Y + depthYSpace + depthYSpace + depth5YTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depth5YTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    } else if (StringUtils.equals("시험준비", sectionNm)) {
                        pioPdf.drawText(tScore, depth5X + depth5XSpace + depth5XSpace, depth5Y + depthYSpace + depthYSpace + depth5YTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, Color.BLACK, -0.58f);
                        pioPdf.drawText(tRank, depth5X + depth5XSpace + depth5XSpace + depth5XTextSpace + controlSpace, depth5Y + depthYSpace + depthYSpace + depth5YTerm + depthYSpace + depthYSpace + depthYSpace + depthYSpace + depthYSpace, "Pretendard Medium", fontSize, false, false, color, -0.58f);

                    }
                }
            }
        }

        // 하단 정보 작성(학습현황, 신뢰성 지표, 검사 해석 전문가)
        this.drawSummaryFooter(pioPdf, userInfo, 2);

    }
}
