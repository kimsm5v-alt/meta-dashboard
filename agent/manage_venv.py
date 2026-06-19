import os
import sys
import subprocess
import venv
import shutil
import signal
from pathlib import Path


def _start_caddy(agent_dir: Path) -> subprocess.Popen | None:
    """LOCAL_HTTPS=true 일 때 Caddy 리버스 프록시를 백그라운드로 실행한다."""
    caddyfile = agent_dir / "Caddyfile.local"
    if not caddyfile.exists():
        print(f"[LOCAL_HTTPS] Caddyfile.local 없음. 먼저 셋업 스크립트 실행:")
        print(f"  bash agent/scripts/setup-local-https.sh")
        return None

    caddy_bin = shutil.which("caddy")
    if not caddy_bin:
        print("[LOCAL_HTTPS] caddy 바이너리를 찾을 수 없습니다. brew install caddy")
        return None

    print(f"[LOCAL_HTTPS] Caddy 시작 (8443 → 8000)...")
    proc = subprocess.Popen(
        [caddy_bin, "run", "--config", str(caddyfile)],
        cwd=str(agent_dir),
    )
    print(f"[LOCAL_HTTPS] https://t-meta-agent-api.vsaidt.com/chat/stream 접속 가능")
    return proc


def manage_venv():
    agent_dir = Path(__file__).parent.resolve()
    venv_dir = agent_dir / ".venv"
    requirements_file = agent_dir / "requirements.txt"
    local_https = os.environ.get("LOCAL_HTTPS", "").lower() == "true"

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
        subprocess.run(
            [str(python_executable), "-m", "pip", "install", "-r", str(requirements_file)],
            check=True,
        )

    # 4. LOCAL_HTTPS=true 시 Caddy 리버스 프록시 병행 실행
    caddy_proc = _start_caddy(agent_dir) if local_https else None

    # 5. 에이전트 실행 (Uvicorn)
    print("Starting AI Agent on port 8000...")
    try:
        subprocess.run(
            [str(uvicorn_executable), "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
            cwd=str(agent_dir),
        )
    except KeyboardInterrupt:
        print("\nStopping Agent...")
    finally:
        if caddy_proc and caddy_proc.poll() is None:
            caddy_proc.send_signal(signal.SIGTERM)
            caddy_proc.wait()
            print("[LOCAL_HTTPS] Caddy 종료")


if __name__ == "__main__":
    manage_venv()
