const { spawn } = require('child_process');
const path = require('path');

console.log('\n================================================================');
console.log('  🌟 ShopWise - Smart Multi-Store E-Commerce & Price Intelligence');
console.log('  🎓 Production Level Final Year Project (MERN Stack)');
console.log('  🎨 Lavender Color Theme System Activated');
console.log('================================================================\n');

// 1. Start Backend Server
console.log('  [1/2] 🚀 Initializing ShopWise REST API Server (Node.js/Express)...');
const serverProcess = spawn('node', ['src/server.js'], {
  cwd: path.join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '5000' }
});

// 2. Start Frontend Vite Dev Server
console.log('  [2/2] ⚛️ Initializing ShopWise React 18 Frontend Client...');
const clientProcess = spawn('npx', ['vite', '--host', '--port', '5173'], {
  cwd: path.join(__dirname, 'client'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

const cleanup = () => {
  console.log('\nGracefully shutting down ShopWise application...');
  try {
    serverProcess.kill();
    clientProcess.kill();
  } catch {
    // Ignore shutdown error
  }
  process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
