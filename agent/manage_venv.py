import os
import sys
import subprocess
import venv
from pathlib import Path

def manage_venv():
    # 에이전트 루트 디렉토리 설정
    agent_dir = Path(__file__).parent.resolve()
    venv_dir = agent_dir / ".venv"
    requirements_file = agent_dir / "requirements.txt"
    
    # 1. 가상환경 생성 (없을 경우)
    if not venv_dir.exists():
        print(f"Creating virtual environment in {venv_dir}...")
        venv.create(venv_dir, with_pip=True)
    
    # 2. 플랫폼별 실행 파일 경로 설정
    if sys.platform == "win32":
        python_executable = venv_dir / "Scripts" / "python.exe"
        uvicorn_executable = venv_dir / "Scripts" / "uvicorn.exe"
    else:
        python_executable = venv_dir / "bin" / "python"
        uvicorn_executable = venv_dir / "bin" / "uvicorn"
    
    # 3. 의존성 설치
    if requirements_file.exists():
        print("Installing/Updating requirements...")
        subprocess.run([str(python_executable), "-m", "pip", "install", "-r", str(requirements_file)], check=True)
    
    # 4. 에이전트 실행 (Uvicorn)
    print("Starting AI Agent on port 8000...")
    try:
        # main:app 형태로 실행 (main.py 파일이 있다고 가정)
        subprocess.run([str(uvicorn_executable), "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"], cwd=str(agent_dir))
    except KeyboardInterrupt:
        print("\nStopping Agent...")

if __name__ == "__main__":
    manage_venv()
