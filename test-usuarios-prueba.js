const https = require('https');
const http = require('http');

// Función para probar login de un usuario
function testLogin(email, rol) {
  const data = JSON.stringify({
    email: email,
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

  console.log(`\n🧪 Probando login para ${rol}: ${email}`);
  console.log('=' .repeat(50));

  const req = http.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`);
    
    let responseData = '';
    res.on('data', (d) => {
      responseData += d;
    });

    res.on('end', () => {
      try {
        const parsed = JSON.parse(responseData);
        console.log('Response:', JSON.stringify(parsed, null, 2));
        
        if (res.statusCode === 200 && parsed.token) {
          console.log('✅ Login exitoso');
          console.log(`👤 Usuario: ${parsed.user?.nombre || 'N/A'}`);
          console.log(`🎭 Rol: ${parsed.user?.rol || 'N/A'}`);
          console.log(`🔑 Token: ${parsed.token.substring(0, 20)}...`);
        } else {
          console.log('❌ Login fallido');
        }
      } catch (error) {
        console.log('❌ Error parsing response:', responseData);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Error de conexión:', error.message);
  });

  req.write(data);
  req.end();
}

// Probar todos los usuarios de prueba
const usuarios = [
  { email: 'test@bechapra.com', rol: 'Solicitante' },
  { email: 'test2@bechapra.com', rol: 'Aprobador' },
  { email: 'test3@bechapra.com', rol: 'Pagador' }
];

console.log('🚀 Iniciando pruebas de login para usuarios de prueba...');
console.log('Servidor: 46.202.177.106:4000');

usuarios.forEach((usuario, index) => {
  setTimeout(() => {
    testLogin(usuario.email, usuario.rol);
  }, index * 2000); // Esperar 2 segundos entre cada prueba
});

// Mensaje final
setTimeout(() => {
  console.log('\n' + '='.repeat(50));
  console.log('🏁 Todas las pruebas completadas');
  console.log('📝 Usuarios de prueba disponibles:');
  console.log('   • test@bechapra.com (ID: 2) - Rol: solicitante');
  console.log('   • test2@bechapra.com (ID: 3) - Rol: aprobador');
  console.log('   • test3@bechapra.com (ID: 4) - Rol: pagador_banca');
  console.log('🔐 Contraseña para todos: 12345678');
}, usuarios.length * 2000 + 1000);