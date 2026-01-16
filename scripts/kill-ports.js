const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const ports = [3000, 3001, 3002];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function killPort(port) {
  try {
    // Windows에서 포트를 사용하는 프로세스 찾기
    const { stdout } = await execPromise(`netstat -ano | findstr :${port}`);
    const lines = stdout.trim().split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      console.log(`포트 ${port}는 사용 중이 아닙니다.`);
      return;
    }
    
    const pids = new Set();
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length > 0) {
        const pid = parts[parts.length - 1];
        if (pid && !isNaN(pid) && pid !== '0') {
          pids.add(pid);
        }
      }
    });

    if (pids.size === 0) {
      console.log(`포트 ${port}는 사용 중이 아닙니다.`);
      return;
    }

    // 각 PID 종료
    for (const pid of pids) {
      try {
        // 프로세스 정보 확인
        try {
          await execPromise(`tasklist /FI "PID eq ${pid}"`);
        } catch (e) {
          console.log(`포트 ${port}의 프로세스 (PID: ${pid})는 이미 종료되었습니다.`);
          continue;
        }
        
        // 프로세스 강제 종료
        await execPromise(`taskkill /PID ${pid} /F /T`);
        console.log(`포트 ${port}의 프로세스 (PID: ${pid})를 종료했습니다.`);
        
        // 프로세스 종료 대기
        await sleep(500);
      } catch (error) {
        // 프로세스가 이미 종료되었거나 권한 문제일 수 있음
        if (error.message.includes('not found') || error.message.includes('존재하지 않습니다')) {
          console.log(`포트 ${port}의 프로세스 (PID: ${pid})는 이미 종료되었습니다.`);
        } else {
          console.log(`프로세스 ${pid} 종료 실패: ${error.message}`);
        }
      }
    }
    
    // 종료 후 포트가 정리되었는지 확인
    await sleep(1000);
    try {
      const { stdout: checkStdout } = await execPromise(`netstat -ano | findstr :${port}`);
      if (checkStdout.trim()) {
        console.log(`⚠ 경고: 포트 ${port}가 여전히 사용 중일 수 있습니다.`);
      }
    } catch (e) {
      // 포트가 정리된 것으로 확인됨
    }
  } catch (error) {
    if (error.message.includes('findstr') || error.message.includes('not found')) {
      console.log(`포트 ${port}는 사용 중이 아닙니다.`);
    } else {
      console.error(`포트 ${port} 처리 중 오류: ${error.message}`);
    }
  }
}

async function main() {
  console.log('포트 정리 중...\n');
  for (const port of ports) {
    await killPort(port);
  }
  console.log('\n포트 정리 완료!');
  console.log('잠시 후 개발 서버를 시작하세요.\n');
}

main().catch(console.error);
