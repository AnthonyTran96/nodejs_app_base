module.exports = {
  apps: [
    {
      name: 'nodejs-base-app',
      script: 'node',
      args: 'dist/index.js',
      instances: '1', // "max" nếu muốn cluster
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development', // hoặc "production"
      },
    },
  ],
};
