(async () => {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@inventory.com',
        password: process.env.TEST_PASSWORD || 'Admin@12345#',
      }),
    });
    const data = await res.json();
    console.log('Status Code:', res.status);
    console.log('Login Response:', data);
    process.exit(0);
  } catch (err) {
    console.error('Login Error:', err.message);
    process.exit(1);
  }
})();
