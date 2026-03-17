const { exec } = require('child_process');
const os = require('os');

/**
 * OS별로 브라우저를 여는 명령어를 실행합니다.
 * @param {string[]} urls 열고자 하는 URL 목록
 */
function openBrowsers(urls) {
  const platform = os.platform();
  let command = '';

  if (platform === 'darwin') {
    command = 'open';
  } else if (platform === 'win32') {
    command = 'start';
  } else {
    command = 'xdg-open';
  }

  urls.forEach(url => {
    // 윈도우 start 명령어의 경우 빈 타이틀 인자가 필요할 수 있음
    const finalCmd = platform === 'win32' ? `${command} "" "${url}"` : `${command} "${url}"`;
    exec(finalCmd, (err) => {
      if (err) {
        console.error(`Failed to open ${url}:`, err);
      } else {
        console.log(`Successfully opened ${url}`);
      }
    });
  });
}

// 명령행 인자로 받은 URL들을 처리
const urls = process.argv.slice(2);
if (urls.length > 0) {
  openBrowsers(urls);
}
