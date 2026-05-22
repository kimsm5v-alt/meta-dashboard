package com.vs.meta.api.dgnss.vo;

import com.vs.meta.common.utils.InMemoryMultipartFile;
import de.rototor.pdfbox.graphics2d.PdfBoxGraphics2D;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.apache.fontbox.ttf.OTFParser;
import org.apache.fontbox.ttf.OpenTypeFont;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.io.RandomAccessReadBufferedFile;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.PDResources;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.apache.pdfbox.pdmodel.graphics.form.PDFormXObject;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;
import org.springframework.web.multipart.MultipartFile;

import java.awt.*;
import java.awt.geom.AffineTransform;
import java.io.*;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
public class PioPdfVO {

    public PDDocument pdDoc;

    // 기본 폰트 설정
    private PDType0Font font_Regular;
    private PDType0Font font_Bold;
    private PDType0Font font_SemiBold;
    private PDType0Font font_Medium;

    private Map<String, PDType0Font> fontMap;

//     private PDFont font_Regular;
//    private CFFFont font_Bold;
    //   private CFFFont font_SemiBold;

    private float marginTop;
    private float marginLeft;
    public PDPage pdPage;
    public PDPageContentStream pdStream;
    private File pdfFile;

    private int currentPage;

    boolean templateMode;

    // 폰트 캐시
    private Map<String, byte[]> fontCacheMap;

    // 이미지 캐시
    private Map<String, byte[]> imageBytesCache;

    // 문서 내 PDImageXObject 재사용 캐시
    private Map<String, PDImageXObject> pdImageCache;

    // Color 캐시
    private static final Map<String, Color> colorCache = new ConcurrentHashMap<>();

    public PioPdfVO() {
        marginTop = 0f;
        // marginLeft = mm2pt(5.93f);
        marginLeft = 0f;

        templateMode = false;

        currentPage = 0;

        fontMap = new HashMap<>();

    }

    public PioPdfVO(File pdfFile) {
        marginTop = 0f;
        marginLeft = mm2pt(5.93f);
        this.pdfFile= pdfFile;

        templateMode = false ;

        currentPage = 0;



    }

    public void drawVector(String imageFileName, float x, float y, float width, float height) throws Exception {
        x = mm2pt(x) + marginLeft;
        y = mm2pt(y) - marginTop;

        PdfBoxGraphics2D graphics = new PdfBoxGraphics2D(pdDoc, 100f, 100f);



        PDFormXObject xform =  graphics.getXFormObject();

        AffineTransform transForm =  AffineTransform.getTranslateInstance(100f, 100f);

        xform.setMatrix(transForm);
        pdStream.drawForm(xform);
    }

    public void setMarginTop(float value) {
        marginTop  = value;
    }

    public void setMarginLeft(float value) {
        marginLeft  = value;
    }


    public void startDoc() throws IOException {
        try {
            if(pdDoc == null)
                pdDoc = new PDDocument();

            loadFont();
        } catch (OutOfMemoryError e) {
            log.error("PDF 문서 생성 실패 - 메모리 부족: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (IOException e) {
            log.error("PDF 문서 생성 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("PDF 문서 생성 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        }
    }


    public void loadDoc(String templateFileName) throws IOException{

        File file = new File(templateFileName);

        this.templateMode = true;
        this.pdImageCache = new HashMap<>();  // 문서별 PDImageXObject 캐시 초기화

        try {
            if(pdDoc == null) {
                pdDoc = Loader.loadPDF(file);

                PDResources resources =pdDoc.getPage(0).getResources();

//                for(COSName fontCosName :resources.getFontNames()){
//                    log.debug("Font Resource : {} {}", fontCosName.toString(),  resources.getFont(fontCosName).getName());
//                }
            }

            loadFont();
        } catch (FileNotFoundException e) {
            log.error("PDF 템플릿 파일을 찾을 수 없음: {}", templateFileName);
            throw new RuntimeException(e);
        } catch (IOException e) {
            log.error("PDF 템플릿 로드 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("PDF 템플릿 로드 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        }

    }

    // 캐시된 템플릿으로부터 PDF 로드
    public void loadDocFromCache(byte[] templateBytes, Map<String, byte[]> fontCacheMap) throws IOException{
        loadDocFromCache(templateBytes, fontCacheMap, null);
    }

    // 캐시된 템플릿으로부터 PDF 로드 (이미지 캐시 포함)
    public void loadDocFromCache(byte[] templateBytes, Map<String, byte[]> fontCacheMap, Map<String, byte[]> imageBytesCache) throws IOException{
        this.templateMode = true;
        this.imageBytesCache = imageBytesCache;
        this.pdImageCache = new HashMap<>();  // 문서별 PDImageXObject 캐시 초기화

        try {
            if(pdDoc == null) {
                pdDoc = Loader.loadPDF(templateBytes);

                PDResources resources = pdDoc.getPage(0).getResources();
            }

            // 폰트 캐시가 제공되면 캐시에서 로드, 아니면 파일에서 로드
            if (fontCacheMap != null && !fontCacheMap.isEmpty()) {
                loadFontFromCache(fontCacheMap);
            } else {
                loadFont();
            }
        } catch (IOException e) {
            log.error("캐시된 PDF 템플릿 로드 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("캐시된 PDF 템플릿 로드 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public void movePage(int page) throws IOException{
        try {
            if(pdPage != null)
                pdPage = null;

            if(pdStream != null) {
                pdStream.close();
                pdStream = null;
            }

            pdPage =  pdDoc.getPage(page - 1);
            pdStream = new PDPageContentStream(pdDoc, pdPage, PDPageContentStream.AppendMode.APPEND, true, false);

            currentPage = page;
        } catch (IndexOutOfBoundsException e) {
            log.error("PDF 페이지 인덱스 오류 - 페이지 번호: {}", page);
            throw new RuntimeException(e);
        } catch (IOException e) {
            log.error("PDF 페이지 이동 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("PDF 페이지 이동 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        }

    }

    public void saveDoc(File file){
        if(pdStream != null){
            try {
                this.pdStream.close();
            } catch (IOException e) {
                log.error("IO error : {}", e.getMessage());
            }
        }

        try {
            pdDoc.save(file);
        } catch (SecurityException e) {
            log.error("PDF 파일 저장 실패 - 보안 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (IOException e) {
            log.error("PDF 파일 저장 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("PDF 파일 저장 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } finally{
            try {
                pdDoc.close();
            } catch (IOException e) {
                log.error("IO error : {}", e.getMessage());
            }
        }
    }

    public void saveDoc(OutputStream outputStream){
        if(pdStream != null){
            try {
                this.pdStream.close();
            } catch (IOException e) {
                log.error("IO error : {}", e.getMessage());
            }
        }

        try {
            this.pdDoc.save(outputStream);
        } catch (IOException e) {
            log.error("PDF OutputStream 저장 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("PDF OutputStream 저장 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } finally{
            try {
                this.pdDoc.close();
            } catch (IOException e) {
                log.error("IO error : {}", e.getMessage());
            }
        }
    }

    public void save(){
        if(pdStream != null){
            try {
                this.pdStream.close();
            } catch (IOException e) {
                log.error("IO error : {}", e.getMessage());
            }
        }
        if(pdDoc != null){
            try {
                pdDoc.save(pdfFile);
            } catch (IOException e) {
                log.error("error : {}", e.getMessage());
            }finally {
                try {
                    pdDoc.close();
                } catch (IOException e) {
                    log.error("IO error : {}", e.getMessage());
                }
            }
        }
    }



    public void endDoc() throws IOException {
        try {
            pdDoc.close();
        } catch (IOException e) {
            log.error("PDF 문서 닫기 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("PDF 문서 닫기 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        }

    }

    private void loadFont() throws IOException {
        try {
            //File fontFile = new File("./assets/fonts/Gulim.ttc");
            //font1 =  PDType0Font.load(pdDoc, new TrueTypeCollection(fontFile).getFontByName("Gulim"), true);

            font_Regular =  PDType0Font.load( pdDoc,  new FileInputStream("./assets/fonts/Pretendard-Regular.ttf"));
            font_Bold  = PDType0Font.load(pdDoc,  new FileInputStream("./assets/fonts/Pretendard-Bold.ttf"));
            font_SemiBold  = PDType0Font.load(pdDoc,  new FileInputStream("./assets/fonts/Pretendard-SemiBold.ttf"));
            font_Medium  = PDType0Font.load(pdDoc,  new FileInputStream("./assets/fonts/Pretendard-Medium.ttf"));

            fontMap.put("pretendard", font_Regular);
            fontMap.put("pretendard regular", font_Regular);
            fontMap.put("pretendard semibold", font_SemiBold);
            fontMap.put("pretendard medium", font_Medium);
            fontMap.put("pretendard bold", font_Bold);
        } catch (FileNotFoundException e) {
            log.error("폰트 파일을 찾을 수 없음: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (IOException e) {
            log.error("폰트 로드 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("폰트 로드 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        }
    }

    // 캐시된 폰트로부터 로드
    public void loadFontFromCache(Map<String, byte[]> fontCacheMap) throws IOException {
        try {
            font_Regular = PDType0Font.load(pdDoc, new ByteArrayInputStream(fontCacheMap.get("./assets/fonts/Pretendard-Regular.ttf")));
            font_Bold = PDType0Font.load(pdDoc, new ByteArrayInputStream(fontCacheMap.get("./assets/fonts/Pretendard-Bold.ttf")));
            font_SemiBold = PDType0Font.load(pdDoc, new ByteArrayInputStream(fontCacheMap.get("./assets/fonts/Pretendard-SemiBold.ttf")));
            font_Medium = PDType0Font.load(pdDoc, new ByteArrayInputStream(fontCacheMap.get("./assets/fonts/Pretendard-Medium.ttf")));

            fontMap.put("pretendard", font_Regular);
            fontMap.put("pretendard regular", font_Regular);
            fontMap.put("pretendard semibold", font_SemiBold);
            fontMap.put("pretendard medium", font_Medium);
            fontMap.put("pretendard bold", font_Bold);
        } catch (IOException e) {
            log.error("캐시된 폰트 로드 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("캐시된 폰트 로드 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        }
    }

    private OpenTypeFont loadOTFont(String fileName) throws IOException {

        OTFParser otfParser = new OTFParser();

        OpenTypeFont otf = otfParser.parse(new RandomAccessReadBufferedFile(fileName));

        return otf;

    }

    public void newPage() throws IOException     {
        try {
            if(pdPage != null)
                pdPage = null;

            if(pdStream != null) {
                pdStream.close();
                pdStream = null;
            }

            pdPage = new PDPage(PDRectangle.A4);
            pdDoc.addPage(pdPage);

            pdStream = new PDPageContentStream(pdDoc, pdPage);

            currentPage = pdDoc.getNumberOfPages();
        } catch (OutOfMemoryError e) {
            log.error("PDF 새 페이지 생성 실패 - 메모리 부족: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (IOException e) {
            log.error("PDF 새 페이지 생성 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("PDF 새 페이지 생성 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        }
    }


    public void drawPageBackground(String template, int page, int pageSub){
        try {

            String imgFileName = "" ;

            if(templateMode == false){
                if (pageSub == 0)
                    imgFileName = "./assets/imgs/dgnss/" + template + "/bg/bg_" + StringUtils.leftPad(Integer.toString(page), 2, "0") + ".png";
                else
                    imgFileName = "./assets/imgs/dgnss/" + template + "/bg/bg_" + StringUtils.leftPad(Integer.toString(page), 2, "0") + "_" + pageSub + ".png";
            }

            if(this.fileExist((imgFileName))) {
                PDImageXObject pdImage;

                // 문서 내 PDImageXObject 캐시에서 먼저 확인
                if (pdImageCache != null && pdImageCache.containsKey(imgFileName)) {
                    pdImage = pdImageCache.get(imgFileName);
                }
                // 캐시된 이미지 바이트가 있으면 바이트에서 로드
                else if (imageBytesCache != null && imageBytesCache.containsKey(imgFileName)) {
                    byte[] imageBytes = imageBytesCache.get(imgFileName);
                    pdImage = PDImageXObject.createFromByteArray(pdDoc, imageBytes, imgFileName);
                    if (pdImageCache != null) {
                        pdImageCache.put(imgFileName, pdImage);
                    }
                } else {
                    pdImage = PDImageXObject.createFromFile(imgFileName, pdDoc);
                    if (pdImageCache != null) {
                        pdImageCache.put(imgFileName, pdImage);
                    }
                }

                pdStream.drawImage(pdImage, marginLeft, mm2pt(297f) - marginTop - px2pt(pdImage.getHeight()), px2pt(pdImage.getWidth()), px2pt(pdImage.getHeight()));
            }

            // 측정을 위한 배경 이미지 라인
//            pdStream.setStrokingColor(Color.BLACK);
//            pdStream.addRect(marginLeft, mm2pt(297f)  -   marginTop - px2pt(pdImage.getHeight()),  px2pt(pdImage.getWidth()), px2pt(pdImage.getHeight()));
//            pdStream.stroke();

//            log.debug("iamge width : {}", pdImage.getWidth() + "(" + px2pt(pdImage.getWidth()) + ")" );
//            log.debug("iamge height : {}", pdImage.getHeight() + "(" +  px2pt(pdImage.getHeight()) + ")");

        } catch (FileNotFoundException e) {
            log.error("배경 이미지 파일을 찾을 수 없음: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (IOException e) {
            log.error("배경 이미지 로드 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("배경 이미지 처리 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        }
    }

    private boolean fileExist(String path ){
        File file = new File(path);

        boolean retValue = file.exists();

//        if(retValue)
//            log.debug("File is exists : {}", path);
//        else
//            log.debug("File is not exists : {}", path);




        return retValue;
    }



    public void drawPicture(String imageFileName, float x, float y) throws Exception {
        drawPicture(imageFileName, x, y, 0, 0);
    }

    public void drawPicture(String imageFileName, float x, float y, float width, float height) throws Exception {
        x = mm2pt(x) + marginLeft;
        y = mm2pt(y) - marginTop;

        if(imageFileName.equals("")) return;

        try {
            PDImageXObject pdImage;

            // 문서 내 PDImageXObject 캐시에서 먼저 확인
            if (pdImageCache != null && pdImageCache.containsKey(imageFileName)) {
                pdImage = pdImageCache.get(imageFileName);
            }
            // 캐시된 이미지 바이트가 있으면 바이트에서 로드
            else if (imageBytesCache != null && imageBytesCache.containsKey(imageFileName)) {
                byte[] imageBytes = imageBytesCache.get(imageFileName);
                pdImage = PDImageXObject.createFromByteArray(pdDoc, imageBytes, imageFileName);
                // 문서 내 캐시에 저장
                if (pdImageCache != null) {
                    pdImageCache.put(imageFileName, pdImage);
                }
            } else {
                // 캐시에 없으면 파일에서 로드
                pdImage = PDImageXObject.createFromFile(imageFileName, pdDoc);
                // 문서 내 캐시에 저장
                if (pdImageCache != null) {
                    pdImageCache.put(imageFileName, pdImage);
                }
            }

            if(width == 0){
                width = px2pt(pdImage.getWidth());
                height = px2pt(pdImage.getHeight());
            }
            else {
                width = mm2pt(width);
                height = mm2pt(height);
            }

            pdStream.drawImage(pdImage, x, y, width, height);
        } catch (FileNotFoundException e) {
            log.error("이미지 파일을 찾을 수 없음: {}", imageFileName);
            throw new RuntimeException(e);
        } catch (IOException e) {
            log.error("이미지 로드 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("이미지 처리 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        }
    }



    public void drawHeader(int page, Map<String, Object> userInfo) throws Exception {
        float y = 283.5f;

        try {
            if(userInfo.get("DGNSS_ID").toString().equals("DGNSS_10")) {
                y = px2mm(38f, "Y");

                drawText((String) userInfo.get("MEM_NM"), px2mm(365.5f), y, "Pretendard Medium", 10f, false, false, Color.BLACK, -0.48f);
                drawText(userInfo.get("DGNSS_ORD").toString() + "차 ", px2mm(472f), y, "", 10f, true, false, hexa2Color("#11CE95"), -0.48f);
                drawText((String) userInfo.get("RSPNS_DT"), px2mm(491f), y, "Pretendard Medium", 10f, false, false, Color.BLACK, -0.48f);
            }
            else{
                y = px2mm(38f, "Y");

                drawText((String) userInfo.get("MEM_NM"), 129f, y, "Pretendard Medium", 10f, false, false, Color.BLACK, -0.48f);
                drawText(userInfo.get("DGNSS_ORD").toString() + "차 ", px2mm(468f), y, "", 10f, true, false, hexa2Color("#682FEE"), -0.48f);
                drawText((String) userInfo.get("RSPNS_DT"), 174f, y, "Pretendard Medium", 10f, false, false, Color.BLACK, -0.48f);
            }
        } catch (NullPointerException e) {
            log.error("헤더 그리기 실패 - 사용자 정보 누락: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (IOException e) {
            log.error("헤더 그리기 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("헤더 그리기 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public void drawHeaderCoch(int page, Map<String, Object> testInfo, boolean isVivaClassNickName){
        float y = 283.5f;

        try {
            y = px2mm(38f, "Y");
            if(testInfo.get("DGNSS_ID").toString().equals("DGNSS_10")) {
                if (isVivaClassNickName) {
                    drawText((String) testInfo.get("nickNameClass"), 132f, y, "Pretendard", 10f, false, false, Color.BLACK, -0.24f);
                } else {
                    drawText((String) testInfo.get("CLASS_NM"), 132f, y, "Pretendard", 10f, false, false, Color.BLACK, -0.24f);
                }
                drawText(testInfo.get("TEST_ORD").toString() + "차 ", px2mm(469.5f), y, "", 10f, true, false, hexa2Color("#11CE95"), -0.24f);
                drawText((String) testInfo.get("TEST_DT"), px2mm(487f), y, "Pretendard", 10f, false, false, Color.BLACK, -0.24f);
            }
            else{
                if (isVivaClassNickName) {
                    drawText((String) testInfo.get("nickNameClass"), 132f, y, "Pretendard", 10f, false, false, Color.BLACK, -0.24f);
                } else {
                    drawText((String) testInfo.get("CLASS_NM"), 132f, y, "Pretendard", 10f, false, false, Color.BLACK, -0.24f);
                }
                drawText((String) testInfo.get("CLASS_NM"), 132f, y, "Pretendard", 10f, false, false, Color.BLACK, -0.24f);
                drawText(testInfo.get("TEST_ORD").toString() + "차 ", px2mm(469.5f), y, "", 10f, true, false, hexa2Color("#682FEE"), -0.24f);
                drawText((String) testInfo.get("TEST_DT"), px2mm(487f), y, "Pretendard", 10f, false, false, Color.BLACK, -0.24f);
            }
        } catch (NullPointerException e) {
            log.error("Coch 헤더 그리기 실패 - 테스트 정보 누락: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (IOException e) {
            log.error("Coch 헤더 그리기 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("Coch 헤더 그리기 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public void drawFooter() throws Exception {
        drawFooter(-1);
    }
    public void drawFooter(int pageCorrect) throws Exception {
        try {
            drawTextC(Integer.toString (currentPage + pageCorrect), px2mm(291f), px2mm(828f, "Y"), px2mm(8f));
        } catch (IOException e) {
            log.error("푸터 그리기 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("푸터 그리기 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        }
    }


    public void drawCircle(float x, float y, float r) throws Exception {

        drawCircle(x, y, r, 1, 1,Color.BLACK);
    }

    public void drawCircle(float x, float y, float r, float lineWidth, int lineStyle, Color lineColor) throws Exception {

        x = mm2pt(x) + marginLeft ;
        y = mm2pt(y) - marginTop ;
        r = mm2pt(r);



        try{
            final float k = 0.552284749831f;

            pdStream.setNonStrokingColor(lineColor);
            pdStream.setLineWidth(lineWidth);

            pdStream.moveTo(x - r, y);
            pdStream.curveTo(x - r, y + k * r, x - k * r, y + r, x, y + r);
            pdStream.curveTo(x + k * r, y + r, x + r, y + k * r, x + r, y);
            pdStream.curveTo(x + r, y - k * r, x + k * r, y - r, x, y - r);
            pdStream.curveTo(x - k * r, y - r, x - r, y - k * r, x - r, y);
            pdStream.fill();
        } catch (IOException e) {
            log.error("원 그리기 실패 - I/O 오류: {}", e.getMessage());
        } catch (Exception e) {
            log.error("원 그리기 실패 - 예상치 못한 오류: {}", e.getMessage());
        }
    }

    public void drawCircle(PDPageContentStream cons, float cx, float cy, float r, Color color) throws Exception {

        cx = mm2pt(cx) + marginLeft ;
        cy = mm2pt(cy) - marginTop ;
        r = mm2pt(r);

        try{
            final float k = 0.552284749831f;

            cons.setNonStrokingColor(color);

            cons.moveTo(cx - r, cy);
            cons.curveTo(cx - r, cy + k * r, cx - k * r, cy + r, cx, cy + r);
            cons.curveTo(cx + k * r, cy + r, cx + r, cy + k * r, cx + r, cy);
            cons.curveTo(cx + r, cy - k * r, cx + k * r, cy - r, cx, cy - r);
            cons.curveTo(cx - k * r, cy - r, cx - r, cy - k * r, cx - r, cy);
            cons.fill();
        } catch (IOException e) {
            log.error("원 그리기 실패 - I/O 오류: {}", e.getMessage());
        } catch (Exception e) {
            log.error("원 그리기 실패 - 예상치 못한 오류: {}", e.getMessage());
        }
    }

    public void drawRectangle(float x, float y, float width , float height,  Color lineColor, Color fillColor) throws Exception {
        drawRectangle(x, y, width, height, lineColor, fillColor, 1.0f);
    }

    public void drawRectangle(float x, float y, float width , float height,  Color lineColor, Color fillColor, float lineWidth) throws Exception {
        x = mm2pt(x) + marginLeft;
        y = mm2pt(y) - marginTop;
        width = mm2pt(width);
        height = mm2pt(height);

        try{

            pdStream.setNonStrokingColor(fillColor);
            pdStream.setStrokingColor(lineColor);
            pdStream.setLineWidth(lineWidth);

            if(fillColor != Color.WHITE) {
                pdStream.addRect(x, y, width, height);
                pdStream.fill();
            }

            if(lineColor != Color.WHITE){
                pdStream.moveTo(x, y);
                pdStream.lineTo (x, y + height);
                pdStream.lineTo (x + width, y + height);
                pdStream.lineTo (x + width, y);
                pdStream.lineTo (x, y);

                pdStream.stroke();
            }
        } catch(IOException e) {
            log.error("error : {}", e.getMessage());
        } catch(Exception e){
            log.error("error : {}", e.getMessage());
        }
    }


    public void drawBarChart_Horizontal(float x, float y, float width , float height,  Color lineColor, Color fillColor) throws Exception {
        x = mm2pt(x) + marginLeft;
        y = mm2pt(y) - marginTop;
        width = mm2pt(width);
        height = mm2pt(height);

        try{
            final float k = 0.552284749831f;
            float r = height / 2;
            pdStream.setNonStrokingColor(fillColor);
            pdStream.setStrokingColor(lineColor);
            pdStream.moveTo(x, y);
            pdStream.lineTo(x, y + height);
            pdStream.lineTo(x + width - r, y + height);
            pdStream.curveTo(x + width - r + (k * r), y + height, x + width , y + height - (k * r), x + width, y + r);
            pdStream.curveTo(x + width, y + r - (k*r), x + width - (k * r), y, x + width - r, y);
            pdStream.lineTo(x, y );

            pdStream.fill();
        } catch (IOException e) {
            log.error("수평 막대 차트 그리기 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("수평 막대 차트 그리기 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public void drawBarChart_Horizontal(PDPageContentStream cons, float cx, float cy, float width , float height,  Color color) throws Exception {
        cx = mm2pt(cx) + marginLeft;
        cy = mm2pt(cy) - marginTop;
        width = mm2pt(width);
        height = mm2pt(height);

        try{
            final float k = 0.552284749831f;
            float r = height / 2;
            cons.setNonStrokingColor(color);
            cons.moveTo(cx, cy);
            cons.lineTo(cx, cy + height);
            cons.lineTo(cx + width - r, cy + height);
            cons.curveTo(cx + width - r + (k * r), cy + height, cx + width , cy + height - (k * r), cx + width, cy + r);
            cons.curveTo(cx + width, cy + r - (k*r), cx + width - (k * r), cy, cx + width - r, cy);
            cons.lineTo(cx, cy );

            cons.fill();
        } catch (IOException e) {
            log.error("수평 막대 차트 그리기 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("수평 막대 차트 그리기 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public void drawBarChart_Vertical(float x, float y, float width , float height,  Color lineColor, Color fillColor) throws Exception {
        x = mm2pt(x) + marginLeft;
        y = mm2pt(y) - marginTop;
        width = mm2pt(width);
        height = mm2pt(height);

        float r = mm2pt(px2mm(2f));

        try{
            final float k = 0.552284749831f;
            pdStream.setNonStrokingColor(fillColor);
            pdStream.setStrokingColor(lineColor);
            pdStream.moveTo(x, y);
            pdStream.lineTo(x, y + height - r);
            pdStream.curveTo(x , y + height - (k * r) , x + (k * r) , y + height, x + r, y + height);
            pdStream.lineTo(x + width - r, y + height);
            pdStream.curveTo(x + width - r + (k * r) , y + height, x + width,  y + height - (k * r), x + width, y + height - r);
            pdStream.lineTo(x + width, y);
            pdStream.lineTo(x, y );

            pdStream.fill();
        } catch (IOException e) {
            log.error("수직 막대 차트 그리기 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("수직 막대 차트 그리기 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public void drawRadarChart(float[] value,  float cx, float cy, float height,  Color foreColor, Color backColor, float opacity) throws Exception {
        try{

            float oldCx = cx;
            float oldCy = cy;
            float oldHeight = height;

            cx = mm2pt(cx) + marginLeft;
            cy = mm2pt(cy) - marginTop;
            height = mm2pt(height);

            pdStream.setNonStrokingColor(backColor);
            pdStream.setStrokingColor(foreColor);

            setOpacity(opacity);
            pdStream.moveTo(cx - height * (value[0] / 100) *  (float)Math.cos(Math.toRadians(60)), cy + height * (value[0] / 100) * (float)Math.sin(Math.toRadians(60))  );
            pdStream.lineTo(cx - height * (value[1] / 100), cy );
            pdStream.lineTo(cx - height * (value[2] / 100) *  (float)Math.cos(Math.toRadians(60)), cy - height * (value[2] / 100) *  (float)Math.sin(Math.toRadians(60))  );
            pdStream.lineTo(cx + height * (value[3] / 100) *  (float)Math.cos(Math.toRadians(60)), cy - height * (value[3] / 100) *  (float)Math.sin(Math.toRadians(60))  );
            pdStream.lineTo(cx + height * (value[4] / 100), cy );
            pdStream.lineTo(cx + height * (value[5] / 100) *  (float)Math.cos(Math.toRadians(60)), cy + height * (value[5] / 100) *  (float)Math.sin(Math.toRadians(60))  );
            pdStream.lineTo(cx - height * (value[0] / 100) *  (float)Math.cos(Math.toRadians(60)), cy + height * (value[0] / 100) *  (float)Math.sin(Math.toRadians(60))  );
            pdStream.fill();

            setOpacity(1.0f);

            pdStream.moveTo(cx - height * (value[0] / 100) *  (float)Math.cos(Math.toRadians(60)), cy + height * (value[0] / 100) * (float)Math.sin(Math.toRadians(60))  );
            pdStream.lineTo(cx - height * (value[1] / 100), cy );
            pdStream.lineTo(cx - height * (value[2] / 100) *  (float)Math.cos(Math.toRadians(60)), cy - height * (value[2] / 100) *  (float)Math.sin(Math.toRadians(60))  );
            pdStream.lineTo(cx + height * (value[3] / 100) *  (float)Math.cos(Math.toRadians(60)), cy - height * (value[3] / 100) *  (float)Math.sin(Math.toRadians(60))  );
            pdStream.lineTo(cx + height * (value[4] / 100), cy );
            pdStream.lineTo(cx + height * (value[5] / 100) *  (float)Math.cos(Math.toRadians(60)), cy + height * (value[5] / 100) *  (float)Math.sin(Math.toRadians(60))  );
            pdStream.lineTo(cx - height * (value[0] / 100) *  (float)Math.cos(Math.toRadians(60)), cy + height * (value[0] / 100) *  (float)Math.sin(Math.toRadians(60))  );
            pdStream.stroke();

            float r1 = px2mm(0.75f);

            drawCircle(oldCx - oldHeight * (value[0] / 100) *  (float)Math.cos(Math.toRadians(60)), oldCy + oldHeight * (value[0] / 100) * (float)Math.sin(Math.toRadians(60)), r1, 1, 1,  foreColor);
            drawCircle(oldCx - oldHeight * (value[1] / 100), oldCy ,r1,1f, 1, foreColor);
            drawCircle( oldCx - oldHeight * (value[2] / 100) *  (float)Math.cos(Math.toRadians(60)), oldCy - oldHeight * (value[2] / 100) *  (float)Math.sin(Math.toRadians(60))  ,r1, 1f, 1, foreColor );
            drawCircle( oldCx + oldHeight * (value[3] / 100) *  (float)Math.cos(Math.toRadians(60)), oldCy - oldHeight * (value[3] / 100) *  (float)Math.sin(Math.toRadians(60))  ,r1, 1f, 1, foreColor);
            drawCircle(oldCx + oldHeight * (value[4] / 100), oldCy  ,r1,1f, 1,  foreColor);
            drawCircle(oldCx + oldHeight * (value[5] / 100) *  (float)Math.cos(Math.toRadians(60)), oldCy + oldHeight * (value[5] / 100) *  (float)Math.sin(Math.toRadians(60))  ,r1, 1f, 1, foreColor);

            // 중심점 그려보기
            // drawCircle(cx, cy, 0.5f, 1, 1, Color.BLACK);

        } catch(IOException e) {
            log.error("error : {}", e.getMessage());
        } catch(Exception e){
            log.error("error : {}", e.getMessage());
        }
    }


    //  아래방향 선 그래프 그리기
    public void drawGraph01(float[] value,  float x, float y, float width, float height, float lineWidth, int lineStyle, Color lineColor) throws Exception {
        try{
            for (int i = 0 ; i < value.length ; i++) {
                if(value[i] > 0)
                    drawCircle(pdStream, x + width * (value[i] / 100), y - i * height, px2mm(2f), lineColor);
            }

            x = mm2pt(x) + marginLeft;
            y = mm2pt(y) - marginTop;

            width = mm2pt(width);
            height = mm2pt(height);

            // pdStream.setNonStrokingColor(lineColor);
            pdStream.setStrokingColor(lineColor);
            pdStream.setLineWidth(lineWidth);

            pdStream.moveTo(x + width * (value[0]/ 100), y );

            for(int i = 1 ; i < value.length ; i++){
                if(value[i-1] > 0 && value[i] > 0)
                    pdStream.lineTo(x + width * (value[i]/ 100), y - i * height);
                else
                    pdStream.moveTo(x + width * (value[i]/ 100), y - i * height);
            }

            pdStream.stroke();

        } catch(IOException e) {
            log.error("error : {}", e.getMessage());
        } catch(Exception e){
            log.error("error : {}", e.getMessage());
        }
    }

    public void fillPolygon(PDPageContentStream cs, float[] x, float[] y) throws IOException
    {
        cs.setNonStrokingColor(Color.RED);

        if (x.length != y.length)
        {
            throw new IllegalArgumentException("Error: some points are missing coordinate");
        }
        for (int i = 0; i < x.length; i++)
        {
            if (i == 0)
            {
                cs.moveTo(x[i], y[i]);
            }
            else
            {
                cs.lineTo(x[i], y[i]);
            }
        }
        cs.closePath();
        cs.fill();
    }


    public void drawText(String txt, float x, float y, String fontName, float fontSize, boolean fontBold, boolean fontUnderLine , Color fontColor, boolean fontSemiBold) throws IOException {

        x = mm2pt(x) + marginLeft;
        y = mm2pt(y) - marginTop;

        // pcs.setFont(fontPretenard, 10);

        PDType0Font font;

        if(fontBold){
            font = fontMap.get("pretendard bold");
        }else{
            if(!fontName.isEmpty()) {
                if(fontMap.containsKey(fontName.toLowerCase())) {
                    font = fontMap.get(fontName.toLowerCase());
                }
                else{
                    font = fontMap.get("pretendard regular");
                }
            }else{
                font = fontMap.get("pretendard regular");
            }
        }


        pdStream.setNonStrokingColor(fontColor);

        try {
            pdStream.beginText();
            pdStream.setFont(font, fontSize);
            pdStream.newLineAtOffset(x, y);
            pdStream.showText(txt);
            pdStream.endText();
        }catch(IOException e){
            log.error("error : {}", e.getMessage());
        }

    }

    public void drawText(String txt, float x, float y, String fontName, float fontSize, boolean fontBold, boolean fontUnderLine , Color fontColor, float charSpacing) throws IOException {

        x = mm2pt(x) + marginLeft;
        y = mm2pt(y) - marginTop;

        // pcs.setFont(fontPretenard, 10);

        PDType0Font font;

        if(fontBold){
            font = fontMap.get("pretendard bold");
        }else{
            if(!fontName.isEmpty()) {
                if(fontMap.containsKey(fontName.toLowerCase())) {
                    font = fontMap.get(fontName.toLowerCase());
                }
                else{
                    font = fontMap.get("pretendard regular");
                }
            }else{
                font = fontMap.get("pretendard regular");
            }
        }


        pdStream.setNonStrokingColor(fontColor);

        try {
            pdStream.setCharacterSpacing(charSpacing);
            pdStream.beginText();
            pdStream.setFont(font, fontSize);
            pdStream.newLineAtOffset(x, y);
            pdStream.showText(txt);
            pdStream.endText();
            pdStream.setCharacterSpacing(0);
        }catch(IOException e){
            log.error("error : {}", e.getMessage());
        }

    }

    public void drawText(String txt, float x, float y) throws IOException {
        drawText(txt, x, y, "", 9f, false, false , Color.BLACK, 0);
    }

    public void drawText(String txt, float x, float y, String fontName) throws IOException {
        drawText(txt, x, y, fontName, 9f, false, false , Color.BLACK,0);
    }

    public void drawText(String txt, float x, float y, String fontName, float fontSize) throws IOException {
        drawText(txt, x, y, fontName, fontSize, false, false , Color.BLACK,0);
    }

    public void drawText(String txt, float x, float y, String fontName, float fontSize, boolean fontBold) throws IOException {
        drawText(txt, x, y, fontName, fontSize, fontBold, false , Color.BLACK, 0);
    }

    public void drawText(String txt, float x, float y, String fontName, float fontSize, boolean fontBold, boolean fontUnderLine) throws IOException {
        drawText(txt, x, y, fontName, fontSize, fontBold, fontUnderLine , Color.BLACK, 0);

    }

    public void drawText(String txt, float x, float y, String fontName, float fontSize, boolean fontBold, boolean fontUnderLine , Color fontColor) throws IOException {
        drawText(txt, x, y, fontName, fontSize, fontBold, fontUnderLine, fontColor, 0f);
    }

    public void drawTextC(String txt, float x, float y, float width, String fontName, float fontSize, boolean fontBold, boolean fontUnderLine , Color fontColor, float charSpacing) throws IOException {

        x = mm2pt(x) + marginLeft;
        y = mm2pt(y) - marginTop;

        width = mm2pt(width);
        // pcs.setFont(fontPretenard, 10);

        PDType0Font font;

        if(fontBold){
            font = fontMap.get("pretendard bold");
        }else{
            if(!fontName.isEmpty()) {
                if(fontMap.containsKey(fontName.toLowerCase())) {
                    font = fontMap.get(fontName.toLowerCase());
                }
                else{
                    font = fontMap.get("pretendard regular");
                }
            }else{
                font = fontMap.get("pretendard regular");
            }
        }

//        if(font == null){
//            log.debug("fontName : {}", fontName);
//        }

        x = x + (width -  Double.valueOf(fontSize *  font.getStringWidth(txt) / 1000.0).floatValue()) / 2;

        pdStream.setNonStrokingColor(fontColor);

        try {
            pdStream.setCharacterSpacing(charSpacing);
            pdStream.beginText();
            pdStream.setFont(font, fontSize);
            pdStream.newLineAtOffset(x, y);
            pdStream.showText(txt);
            pdStream.endText();
            pdStream.setCharacterSpacing(0f);
        }catch(IOException e){
            log.error("error : {}", e.getMessage());
        }

    }

    public void drawTextC(String txt, float x, float y, float width) throws IOException {
        drawTextC(txt, x,  y,  width, "", 9f, false ,false ,Color.BLACK,0f);
    }

    public void drawTextC(String txt, float x, float y, float width, String fontName) throws IOException {
        drawTextC(txt, x,  y,  width, fontName, 9f, false ,false ,Color.BLACK,0f);
    }
    public void drawTextC(String txt, float x, float y, float width, String fontName, float fontSize) throws IOException {
        drawTextC(txt, x,  y,  width, fontName, fontSize, false ,false ,Color.BLACK,0f);
    }

    public void drawTextC(String txt, float x, float y, float width, String fontName, float fontSize, boolean fontBold) throws IOException {
        drawTextC(txt, x,  y,  width, fontName, fontSize, fontBold ,false ,Color.BLACK,0f);
    }

    public void drawTextC(String txt, float x, float y, float width, String fontName, float fontSize, boolean fontBold, boolean fontUnderLine) throws IOException {
        drawTextC(txt, x,  y,  width, fontName, fontSize, fontBold ,fontUnderLine,Color.BLACK, 0f);
    }

    public void drawTextC(String txt, float x, float y, float width, String fontName, float fontSize, boolean fontBold, boolean fontUnderLine, Color fontColor) throws IOException {
        drawTextC(txt, x,  y,  width, fontName, fontSize, fontBold ,fontUnderLine, fontColor, 0f);
    }

    public void drawTextC(String txt, float x, float y, float width, String fontName, float fontSize, boolean fontBold, boolean fontUnderLine , Color fontColor, boolean fontSemiBold) throws IOException {

        x = mm2pt(x) + marginLeft;
        y = mm2pt(y) - marginTop;

        if(fontName.equals(""))
            fontName = "Pretendard";

        width = mm2pt(width);
        // pcs.setFont(fontPretenard, 10);

        PDType0Font font ;

        if(fontSemiBold)
            font = font_SemiBold;
        else {
            if (fontBold)
                font = font_Bold;
            else
                font = font_Regular;
        }

        x = x + (width -  Double.valueOf(fontSize *  font.getStringWidth(txt) / 1000.0).floatValue()) / 2;

        pdStream.setNonStrokingColor(fontColor);

        try {
            pdStream.beginText();
            pdStream.setFont(font, fontSize);
            pdStream.newLineAtOffset(x, y);
            pdStream.showText(txt);
            pdStream.endText();
        }catch(IOException e){
            log.error("error : {}", e.getMessage());
        }

    }

    public void setOpacity(float opacity) throws IOException{
        if (opacity <= 1)
        {
            PDExtendedGraphicsState gs = new PDExtendedGraphicsState();
            gs.setStrokingAlphaConstant(opacity);
            gs.setNonStrokingAlphaConstant(opacity);
            pdStream.setGraphicsStateParameters(gs);
        }
    }

    public void drawTextParagraph(String txt, float x, float y, float width) throws IOException {
        drawTextParagraph(txt,  x,  y, width, 150 ,  "", 9, Color.BLACK, false);
    }

    public void drawTextParagraph(String txt, float x, float y, float width, float spacing,  String fontName, float fontSize, Color fontColor,  boolean justify) throws IOException {
        drawTextParagraph(txt,x, y,  width,  spacing, fontName, fontSize, fontColor,  justify, 0f);
    }

    public void drawTextParagraph(String txt, float x, float y, float width, float spacing,  String fontName, float fontSize, Color fontColor,  boolean justify, float charSpacing) throws IOException {

        x = mm2pt(x) + marginLeft;
        y = mm2pt(y) - marginTop;

        width = mm2pt(width);

        PDType0Font font;

        // justify = false;

//        if(fontBold){
//            font = fontMap.get("pretendard bold");
//        }else{
//            if(!fontName.isEmpty()) {
//                if(fontMap.containsKey(fontName.toLowerCase())) {
//                    font = fontMap.get(fontName.toLowerCase());
//                }
//                else{
//                    font = fontMap.get("pretendard regular");
//                }
//            }else{
//                font = fontMap.get("pretendard regular");
//            }
//        }



        if(!fontName.isEmpty()) {
            if(fontMap.containsKey(fontName.toLowerCase())) {
                font = fontMap.get(fontName.toLowerCase());
            }
            else{
                font = fontMap.get("pretendard regular");
            }
        }else{
            font = fontMap.get("pretendard regular");
        }


        float oldCharSpacing = charSpacing;

        pdStream.setNonStrokingColor(fontColor);

        float LEADING = - (float)(spacing / 100.0) * fontSize;

        pdStream.setCharacterSpacing(charSpacing);

        pdStream.beginText();
        java.util.List<String> lines = parseLinesLetter(txt, width, fontSize);
        pdStream.setFont(font, fontSize);
        pdStream.newLineAtOffset(x, y);
        for (String line: lines) {
            charSpacing = oldCharSpacing;
            if (justify){
                if (line.length() > 1) {
                    float size = fontSize * font_Regular.getStringWidth(line) / 1000;
                    float free = width - size;
                    if (free > 0 && !lines.get(lines.size() - 1).equals(line)) {
                        charSpacing = free / (line.length() - 1);
                    }
                }
            }
            pdStream.setCharacterSpacing(charSpacing);
            pdStream.showText(line);
            pdStream.newLineAtOffset(0, LEADING);
        }

        pdStream.endText();

        pdStream.setCharacterSpacing(0);
    }



    private java.util.List<String> parseLinesWord(String text, float width, float fontSize) throws IOException {

        java.util.List<String> lines = new ArrayList<String>();
        int lastSpace = -1;
        while (text.length() > 0) {
            int spaceIndex = text.indexOf(' ', lastSpace + 1);
            if (spaceIndex < 0)
                spaceIndex = text.length();
            String subString = text.substring(0, spaceIndex);

            float size = fontSize * font_Regular.getStringWidth(subString) / 1000;

            if (size > width) {
                if (lastSpace < 0){
                    lastSpace = spaceIndex;
                }
                subString = text.substring(0, lastSpace);
                lines.add(subString);
                text = text.substring(lastSpace).trim();
                lastSpace = -1;
            } else if (spaceIndex == text.length()) {
                lines.add(text);
                text = "";
            } else {
                lastSpace = spaceIndex;
            }
        }
        return lines;
    }

    private java.util.List<String> parseLinesLetter(String text, float width, float fontSize) throws IOException {

        List<String> lines = new ArrayList<String>();
        int lastSpace = -1;
        while (text.length() > 0) {

            // int spaceIndex = text.indexOf(' ', lastSpace + 1);

            int spaceIndex = lastSpace + 1;

            if (spaceIndex < 0)
                spaceIndex = text.length();
            String subString = text.substring(0, spaceIndex);

            float size = fontSize * font_Regular.getStringWidth(subString) / 1000;

            if (size > width) {
                if (lastSpace < 0){
                    lastSpace = spaceIndex;
                }
                subString = text.substring(0, lastSpace);
                lines.add(subString);
                text = text.substring(lastSpace).trim();
                lastSpace = -1;
            } else if (spaceIndex == text.length()) {
                lines.add(text);
                text = "";
            } else {
                lastSpace = spaceIndex;
            }
        }
        return lines;
    }

    public Color hexa2Color(String hexaColor) {
        return colorCache.computeIfAbsent(hexaColor, hex -> new java.awt.Color(
                Integer.valueOf(hex.substring(1, 3), 16),
                Integer.valueOf(hex.substring(3, 5), 16),
                Integer.valueOf(hex.substring(5, 7), 16)));
    }

    public  float mm2pt(float value) {
        return (float)(value  *  2.83465);
    }

    public  float px2mm(float value, String type) {
        if(type == "y" || type == "Y")
            return (float)((835 - value) * 25.4f / 72);
        else
            return (float)( value * 25.4f / 72);
    }

    public  float px2mm(float value) {
        return px2mm(value, "x");
    }

    public float px2pt(float value) {
        // return (float)((value  * 72 / 300) * 4.178571429);

        // return (float)(value  * 72 / 300);

        return (float)(value  * 72 / 72);
    }

    public void setCharSpacing(float charSpacing) throws IOException{
        try {
            pdStream.setCharacterSpacing(charSpacing);
        } catch (IOException e) {
            log.error("문자 간격 설정 실패 - I/O 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        } catch (Exception e) {
            log.error("문자 간격 설정 실패 - 예상치 못한 오류: {}", e.getMessage());
            throw new RuntimeException(e);
        }
    }

    public MultipartFile convertFileToMultipartFile(File file) throws IOException {
        byte[] content = Files.readAllBytes(file.toPath());
        return new InMemoryMultipartFile(file.getName(), Files.probeContentType(file.toPath()), content);
    }
}
