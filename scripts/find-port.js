const { exec } = require('child_process');
const { promisify } = require('util');
const { spawn } = require('child_process');
const execAsync = promisify(exec);

function isPortInUse(port) {
  return new Promise((resolve) => {
    const os = require('os');
    const platform = os.platform();
    
    let command;
    if (platform === 'win32') {
      // Windows: IPv4와 IPv6 모두 체크
      command = `netstat -ano | findstr ":${port}"`;
    } else {
      // macOS/Linux
      command = `lsof -i :${port} -t`;
    }
    
    exec(command, (error, stdout) => {
      if (error) {
        // 명령어 실행 실패 = 포트 사용 안 함
        resolve(false);
        return;
      }
      
      if (!stdout || stdout.trim() === '') {
        resolve(false);
        return;
      }
      
      // Windows의 경우 LISTENING 상태인지 확인
      if (platform === 'win32') {
        const lines = stdout.trim().split('\n');
        const isListening = lines.some(line => 
          line.includes('LISTENING') || line.includes('LISTEN')
        );
        resolve(isListening);
      } else {
        // macOS/Linux: 출력이 있으면 포트 사용 중
        resolve(true);
      }
    });
  });
}

async function findAvailablePort(startPort = 3000, maxPort = 3010) {
  for (let port = startPort; port <= maxPort; port++) {
    const inUse = await isPortInUse(port);
    if (!inUse) {
      return port;
    }
  }
  throw new Error(`사용 가능한 포트를 찾을 수 없습니다 (${startPort}-${maxPort})`);
}

async function main() {
  try {
    const port = await findAvailablePort(3000, 3010);
    console.log(`\n✅ 사용 가능한 포트를 찾았습니다: ${port}`);
    console.log(`🚀 포트 ${port}에서 개발 서버를 시작합니다...\n`);
    
    // Next.js를 실행
    const nextDev = spawn('npx', ['next', 'dev', '-p', port.toString()], {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
      env: { 
        ...process.env, 
        FORCE_COLOR: '1',
        NODE_ENV: 'development'
      }
    });
    
    nextDev.on('error', (error) => {
      console.error('❌ 서버 시작 오류:', error);
      process.exit(1);
    });
    
    nextDev.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error(`\n❌ 서버가 종료되었습니다 (코드: ${code})`);
      }
      process.exit(code || 0);
    });
    
    // Ctrl+C 처리
    process.on('SIGINT', () => {
      if (nextDev && !nextDev.killed) {
        nextDev.kill('SIGINT');
      }
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      if (nextDev && !nextDev.killed) {
        nextDev.kill('SIGTERM');
      }
      process.exit(0);
    });
  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

main();
