package com.vs.meta.common.mapper;

import com.vs.meta.common.vo.FileVO;
import com.vs.meta.common.vo.FileLogVO;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;
import java.util.Map;

@Mapper
public interface FileMapper {

	void insertUploadFile(FileVO fileVO);
	List<Map<String, Object>> selectFileDgnssFileList(Map<String, Object> param);
    void insertDownloadLog(FileLogVO fileLogVO);

	List<FileVO> selectFileInfoList();
	void updateFileInfoList(List<FileVO> fileVOList);

	Map<String, Object> selectTcDgnssInfoWithId(Map<String, Object> param);
    List<Map<String, Object>> selectFileDgnssSummaryList(Map<String, Object> param);

	// pfile-download 관련
	FileVO selectFileInfo(FileVO fileVO);
	FileVO selectFileInfoWithPionada(FileVO fileVO);
	List<String> selectTcListFromCreator(Map<String, Object> map);
	String selectFileAuthStudent(Map<String, Object> map);
}
