const { execSync } = require('child_process');

try {
  const output = execSync('netstat -ano').toString();
  const lines = output.split('\n').filter(l => l.includes(':5000') && l.includes('LISTENING'));
  console.log('Found lines on port 5000:', lines);

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    const pid = parts[parts.length - 1];
    if (pid && !isNaN(pid) && pid !== '0') {
      console.log('Killing PID:', pid);
      try {
        execSync(`taskkill /F /PID ${pid}`);
        console.log(`Successfully killed PID ${pid}`);
      } catch (e) {
        console.log(`Could not kill ${pid}: ${e.message}`);
      }
    }
  }
} catch (err) {
  console.error('Error:', err.message);
}
