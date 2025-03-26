import { exec } from 'child_process';
import os from 'os';

// Function to kill process by port on Windows
const killProcessWindows = (port: number) => {
  exec(`netstat -ano | findstr :${port}`, (err, stdout, stderr) => {
    if (err || stderr) {
      console.error(`Error finding process on Windows: ${stderr || err}`);
      return;
    }

    const lines = stdout.split('\n').filter(line => line.includes('LISTENING'));
    if (lines.length === 0) {
      console.log(`No process found listening on port ${port} on Windows.`);
      return;
    }

    const pid = lines[0].trim().split(/\s+/).pop();
    if (pid) {
      exec(`taskkill /PID ${pid} /F`, (killErr, killStdout, killStderr) => {
        if (killErr || killStderr) {
          console.error(`Error killing process on Windows: ${killStderr || killErr}`);
        } else {
          console.log(`Process on port ${port} (PID ${pid}) killed on Windows.`);
        }
      });
    }
  });
};

// Function to kill process by port on Ubuntu (Linux)
const killProcessUbuntu = (port: number) => {
  exec(`lsof -t -i:${port}`, (err, stdout, stderr) => {
    if (err || stderr) {
      console.error(`Error finding process on Ubuntu: ${stderr || err}`);
      return;
    }

    const pid = stdout.trim();
    if (!pid) {
      console.log(`No process found listening on port ${port} on Ubuntu.`);
      return;
    }

    exec(`kill -9 ${pid}`, (killErr, killStdout, killStderr) => {
      if (killErr || killStderr) {
        console.error(`Error killing process on Ubuntu: ${killStderr || killErr}`);
      } else {
        console.log(`Process on port ${port} (PID ${pid}) killed on Ubuntu.`);
      }
    });
  });
};

// Main function to detect OS and call the appropriate process killer
const killProcessByPort = (port: number) => {
  const platform = os.platform();

  if (platform === 'win32') {
    // If on Windows
    console.log('Running on Windows...');
    killProcessWindows(port);
  } else if (platform === 'linux') {
    // If on Ubuntu (Linux)
    console.log('Running on Ubuntu...');
    killProcessUbuntu(port);
  } else {
    console.error(`Unsupported OS: ${platform}`);
  }
};

// Example usage: Kill process running on port 8001
killProcessByPort(8001);