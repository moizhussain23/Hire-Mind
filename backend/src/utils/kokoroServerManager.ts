/**
 * Kokoro TTS Server Manager
 * 
 * Starts and manages the persistent Python HTTP server that keeps Kokoro initialized.
 * This ensures Kokoro is ready immediately for audio generation requests.
 */

import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

const KOKORO_SERVER_URL = process.env.KOKORO_SERVER_URL || 'http://localhost:8765';
const SERVER_STARTUP_TIMEOUT = 90000; // 90 seconds (Kokoro initialization can take 40-70 seconds)

let kokoroServerProcess: ChildProcess | null = null;
let serverReady = false;

/**
 * Get backend root directory
 */
function getBackendDir(): string {
  let currentDir = __dirname;
  
  // Go up from utils to src to backend root
  while (currentDir !== path.dirname(currentDir)) {
    const packageJsonPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  
  return path.resolve(__dirname, '../..');
}

function getPythonPath(): string {
  const backendPath = getBackendDir();
  const venvPythonWindows = path.resolve(backendPath, 'venv', 'Scripts', 'python.exe');
  const venvPythonUnix = path.resolve(backendPath, 'venv', 'bin', 'python');
  
  if (fs.existsSync(venvPythonWindows)) {
    return venvPythonWindows;
  }
  
  if (fs.existsSync(venvPythonUnix)) {
    return venvPythonUnix;
  }
  
  return 'python';
}

/**
 * Check if Kokoro server is running and ready
 */
async function isServerReady(): Promise<boolean> {
  try {
    const response = await axios.get(`${KOKORO_SERVER_URL}/health`, {
      timeout: 2000
    });
    
    return response.data.kokoro_initialized === true;
  } catch {
    return false;
  }
}

/**
 * Start Kokoro TTS server
 */
export async function startKokoroServer(): Promise<void> {
  // Check if already running
  if (await isServerReady()) {
    serverReady = true;
    return;
  }

  const backendDir = getBackendDir();
  const serverScript = path.join(backendDir, 'kokoro_server.py');
  
  // Check if server script exists
  if (!fs.existsSync(serverScript)) {
    return;
  }

  const pythonPath = getPythonPath();
  console.log('[Kokoro] Starting TTS server (this may take ~40s)...');

  // Start Python server with optimized configuration
  kokoroServerProcess = spawn(pythonPath, [serverScript], {
    cwd: backendDir,
    // Use 'inherit' for stderr to avoid blocking, 'pipe' only for stdout we need
    stdio: ['ignore', 'pipe', 'pipe'], // stdin: ignore, stdout: pipe, stderr: pipe
    env: {
      ...process.env,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUNBUFFERED: '1',
      // Performance optimizations for Python
      PYTHONDONTWRITEBYTECODE: '1', // Don't create .pyc files (faster startup)
      // Prevent Python from trying to connect to a terminal
      TERM: 'dumb',
      // Windows-specific: prevent console window creation
      ...(process.platform === 'win32' && { 
        NO_CONSOLE: '1'
      })
    },
    shell: false,
    // Detach on Windows to run independently
    detached: false, // Keep as child so it stops when parent stops
    // Windows-specific: create new process group
    ...(process.platform === 'win32' && {
      windowsHide: true // Hide console window on Windows
    })
  });

  // Log server output (streaming, non-blocking)
  // Read continuously to prevent pipe buffer from filling and blocking Python
  kokoroServerProcess.stdout?.setEncoding('utf8');
  kokoroServerProcess.stdout?.on('data', (chunk: string) => {
    // Process in chunks - don't wait, read immediately to keep pipe clear
    const lines = chunk.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      
      // Only log important messages (avoid spam but keep pipe clear)
      if (trimmed.includes('Initializing') || trimmed.includes('initialized') || 
          trimmed.includes('ready') || trimmed.includes('ERROR') || 
          trimmed.includes('Pre-loading') || trimmed.includes('Loading voice') ||
          trimmed.includes('Voice loaded') || trimmed.includes('Server ready')) {
        // Use setImmediate to avoid blocking the event loop
        setImmediate(() => {
          console.log(`[Kokoro] ${trimmed}`);
        });
      }
    }
  });

  kokoroServerProcess.stderr?.setEncoding('utf8');
  kokoroServerProcess.stderr?.on('data', (chunk: string) => {
    // Process stderr similarly - filter but don't block
    const lines = chunk.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.includes('WARNING') || trimmed.includes('UserWarning')) {
        continue;
      }
      if (trimmed.includes('Error') || trimmed.includes('ERROR') || trimmed.includes('Failed')) {
        setImmediate(() => {
          console.error(`[Kokoro] ${trimmed}`);
        });
      }
    }
  });

  kokoroServerProcess.on('error', (error) => {
    console.error('[Kokoro] Failed to start:', error.message);
    kokoroServerProcess = null;
    serverReady = false;
  });

  kokoroServerProcess.on('exit', (code, signal) => {
    if (code !== null && code !== 0) {
      console.error(`[Kokoro] Server exited with code ${code}`);
    }
    kokoroServerProcess = null;
    serverReady = false;
  });

  // Wait for server to be ready (non-blocking - continues in background even after timeout)
  const startTime = Date.now();
  const checkInterval = 2000; // Check every 2 seconds
  const maxWaitTime = SERVER_STARTUP_TIMEOUT;

  return new Promise((resolve) => {
    let timeoutLogged = false;
    
    const checkReady = async () => {
      if (await isServerReady()) {
        const elapsed = Date.now() - startTime;
        if (timeoutLogged) {
          console.log(`[Kokoro] Server ready (${(elapsed / 1000).toFixed(1)}s) - initialization took longer than expected`);
        } else {
          console.log(`[Kokoro] Server ready (${(elapsed / 1000).toFixed(1)}s)`);
        }
        serverReady = true;
        resolve();
        return;
      }

      const elapsed = Date.now() - startTime;
      if (elapsed > maxWaitTime && !timeoutLogged) {
        console.log(`[Kokoro] Still initializing (${(maxWaitTime / 1000).toFixed(0)}s elapsed) - continuing in background...`);
        timeoutLogged = true;
        // Don't reject - continue checking in background
        // The server process is still running, it just needs more time
      }

      // Continue checking (even after timeout)
      setTimeout(checkReady, checkInterval);
    };

    // Start checking after a short delay
    setTimeout(checkReady, checkInterval);
  });
}

/**
 * Stop Kokoro TTS server
 */
export async function stopKokoroServer(): Promise<void> {
  if (kokoroServerProcess) {
    console.log('[Kokoro] Stopping TTS server...');
    
    try {
      // Try graceful shutdown first
      kokoroServerProcess.kill('SIGTERM');
      
      // Wait for graceful shutdown (up to 3 seconds)
      const shutdownTimeout = 3000;
      const startTime = Date.now();
      
      while (Date.now() - startTime < shutdownTimeout) {
        if (kokoroServerProcess.killed) {
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Force kill if still running
      if (kokoroServerProcess && !kokoroServerProcess.killed) {
        console.log('[Kokoro] Force stopping server...');
        // On Windows, SIGKILL doesn't exist, but calling kill() again forces termination
        // On Unix, SIGKILL forces immediate termination
        if (process.platform === 'win32') {
          kokoroServerProcess.kill(); // Windows: force kill (TerminateProcess)
        } else {
          kokoroServerProcess.kill('SIGKILL'); // Unix: force kill
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error: any) {
      console.error('[Kokoro] Error stopping server:', error.message);
    } finally {
      kokoroServerProcess = null;
      serverReady = false;
      console.log('[Kokoro] Server stopped');
    }
  }
}

/**
 * Check if server is ready
 */
export function isKokoroServerReady(): boolean {
  return serverReady;
}

// Graceful shutdown handlers
// Note: These handlers are set up here, but app.ts should coordinate overall shutdown
// to avoid conflicts with other signal handlers (e.g., database disconnect)
let shutdownInProgress = false;

async function handleShutdown() {
  if (shutdownInProgress) {
    return;
  }
  shutdownInProgress = true;
  await stopKokoroServer();
}

// Register handlers (other modules may also register SIGINT/SIGTERM handlers)
// The last registered handler will execute, but we ensure cleanup happens
process.on('SIGTERM', handleShutdown);
process.on('SIGINT', handleShutdown);

