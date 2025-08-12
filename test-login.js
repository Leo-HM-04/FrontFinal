const https = require('https');
const http = require('http');

const data = JSON.stringify({
  email: 'admin@test.com',
  password: '12345678'
});

const options = {
  hostname: '46.202.177.106',
  port: 4000,
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  console.log(`headers:`, res.headers);

  let responseData = '';
  res.on('data', (d) => {
    responseData += d;
  });

  res.on('end', () => {
    console.log('Response body:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
