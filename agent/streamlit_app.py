import streamlit as st
import requests
import json
import uuid

# 페이지 설정
st.set_page_config(
    page_title="Meta Dashboard AI Agent",
    page_icon="🤖",
    layout="wide"
)

# 세션 상태 초기화
if "messages" not in st.session_state:
    st.session_state.messages = []
if "session_id" not in st.session_state:
    st.session_state.session_id = str(uuid.uuid4())

# 사이드바 설정
with st.sidebar:
    st.title("⚙️ 설정")
    
    api_base_url = st.text_input("API Base URL", value="http://localhost:8000")
    
    st.divider()
    
    st.subheader("👤 세션 정보")
    st.info(f"Session ID: {st.session_state.session_id}")
    if st.button("세션 초기화", use_container_width=True):
        try:
            resp = requests.delete(f"{api_base_url}/chat/{st.session_state.session_id}")
            if resp.status_code == 200:
                st.session_state.messages = []
                st.session_state.session_id = str(uuid.uuid4())
                st.success("세션이 초기화되었습니다.")
                st.rerun()
            else:
                st.error(f"초기화 실패: {resp.text}")
        except Exception as e:
            st.error(f"오류 발생: {str(e)}")

    st.divider()
    
    st.subheader("📊 콘텍스트 데이터 (JSON)")
    context_input = st.text_area(
        "에이전트에게 전달할 추가 데이터",
        value='{\n  "student_name": "김철수",\n  "grade": "고1",\n  "subject": "수학"\n}',
        height=200
    )
    
    try:
        context_data = json.loads(context_input)
    except json.JSONDecodeError:
        st.error("올바른 JSON 형식이 아닙니다.")
        context_data = None

    st.divider()
    st.subheader("🚀 실험 공간")
    use_streaming = st.checkbox("실시간 스트리밍 사용", value=True)

# 메인 화면
st.title("🤖 Meta Dashboard AI Agent")
st.markdown("---")

# 대화 내용 표시
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# 사용자 입력
if prompt := st.chat_input("질문을 입력하세요..."):
    # 사용자 메시지 표시
    st.session_state.messages.append({"role": "user", "content": prompt})
    with st.chat_message("user"):
        st.markdown(prompt)

    # API 호출 및 응답 표시
    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        
        try:
            payload = {
                "text": prompt,
                "session_id": st.session_state.session_id,
                "context_data": context_data
            }
            
            if use_streaming:
                # 1. 스트리밍 모드 호출
                full_response = ""
                response = requests.post(
                    f"{api_base_url}/chat/stream",
                    json=payload,
                    stream=True,
                    timeout=60
                )
                
                if response.status_code == 200:
                    for line in response.iter_lines():
                        if line:
                            # SSE 데이터 추출 (data: {json})
                            decoded_line = line.decode('utf-8')
                            if decoded_line.startswith("data: "):
                                json_str = decoded_line.replace("data: ", "")
                                try:
                                    chunk = json.loads(json_str)
                                    if "text" in chunk:
                                        full_response += chunk["text"]
                                        # 실시간 타이핑 효과를 위해 커서 표시
                                        message_placeholder.markdown(full_response + "▌")
                                    elif "error" in chunk:
                                        st.error(f"에러: {chunk['error']}")
                                except json.JSONDecodeError:
                                    continue
                    
                    # 최종 결과 표시 및 저장
                    message_placeholder.markdown(full_response)
                    st.session_state.messages.append({"role": "assistant", "content": full_response})
                else:
                    st.error(f"API 오류 ({response.status_code}): {response.text}")

            else:
                # 2. 일반 모드(하위 호환) 호출
                message_placeholder.markdown("⏳ 생각 중...")
                response = requests.post(
                    f"{api_base_url}/chat",
                    json=payload,
                    timeout=60
                )
                
                if response.status_code == 200:
                    full_response = response.json().get("response", "응답을 받지 못했습니다.")
                    message_placeholder.markdown(full_response)
                    st.session_state.messages.append({"role": "assistant", "content": full_response})
                else:
                    error_msg = f"API 오류 ({response.status_code}): {response.text}"
                    message_placeholder.markdown(f"❌ {error_msg}")
                    
        except Exception as e:
            error_msg = f"연결 오류: {str(e)}"
            message_placeholder.markdown(f"❌ {error_msg}")
