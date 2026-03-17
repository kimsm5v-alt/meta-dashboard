const { spawn } = require('child_process');
const path = require('path');

/**
 * 모든 서비스를 통합 실행하고 브라우저를 여는 스크립트입니다.
 * 쉘 연산자(&, ;)의 종속성을 제거하여 모든 OS와 쉘(PowerShell 포함)에서 동일하게 작동합니다.
 */

// 1. Nx 실행 (병렬 모드)
const nxProcess = spawn('npx', ['nx', 'run-many', '-t', 'serve', '-p', 'prototype', 'agent', 'backend', '--parallel'], {
  stdio: 'inherit',
  shell: true
});

// 2. 일정 시간 뒤 브라우저 자동 오픈
const openBrowserScript = path.join(__dirname, 'open-browser.js');
setTimeout(() => {
  console.log('\n[System] Opening service pages in browser...');
  spawn('node', [openBrowserScript, 'http://localhost:8081', 'http://localhost:8000'], {
    stdio: 'inherit',
    shell: true
  });
}, 5000);

// 3. 프로세스 종료 관리 (Ctrl+C 등)
const cleanup = () => {
  console.log('\n[System] Stopping all services...');
  nxProcess.kill();
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
