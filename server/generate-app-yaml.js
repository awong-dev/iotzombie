const fs = require('fs');

user_auth_json = process.env.USER_AUTH || '{}';
device_auth_json = process.env.DEVICE_AUTH || '{}'

fs.writeFileSync('app.yaml',
`runtime: nodejs
env: flex

skip_files:
 - ^node_modules$

manual_scaling:
  instances: 1

env_variables:
  USER_AUTH: '${user_auth_json}'
  DEVICE_AUTH: '${device_auth_json}'
`);
