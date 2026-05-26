module.exports = {
  apps: [
    {
      name: 'psychometric-coach',
      script: 'dist/index.js',
      cwd: __dirname,
      instances: 2,           // Use both CPUs
      exec_mode: 'cluster',   // Load-balance across instances
      env: {
        NODE_ENV: 'production',
        PORT: 3010,
      },
      // Memory management
      max_memory_restart: '400M',
      node_args: '--max-old-space-size=384',
      // Restart policy
      autorestart: true,
      restart_delay: 1000,
      max_restarts: 10,
      min_uptime: '5s',
      // Logging
      out_file: '/home/work/.pm2/logs/psychometric-coach-out.log',
      error_file: '/home/work/.pm2/logs/psychometric-coach-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      // Graceful reload
      kill_timeout: 5000,
      wait_ready: false,
    },
  ],
};
