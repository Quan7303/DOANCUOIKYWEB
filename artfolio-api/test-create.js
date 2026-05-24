const fs = require('fs');

async function test() {
  try {
    // 1. Login
    console.log("Logging in...");
    const loginRes = await fetch("http://127.0.0.1:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test.user@example.com",
        password: "password123"
      })
    });
    
    console.log("Login status:", loginRes.status);
    const loginData = await loginRes.json();
    if (!loginRes.ok) {
      console.error("Login failed:", loginData);
      return;
    }
    
    const token = loginData.accessToken;
    console.log("Access token acquired.");

    // 2. Create Portfolio (WITHOUT colors)
    console.log("Creating portfolio...");
    
    const form = new FormData();
    form.append('title', 'Test API Script Portfolio');
    form.append('description', 'Created via scratch script');
    form.append('category', 'design');
    form.append('tags', 'api');
    form.append('tags', 'test');
    
    // A minimal valid 1x1 transparent PNG hex
    const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    const buffer = Buffer.from(base64Png, 'base64');
    
    const blob = new Blob([buffer], { type: 'image/png' });
    form.append('images', blob, 'temp_test_image.png');
    
    const createRes = await fetch("http://127.0.0.1:5000/api/portfolios", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: form
    });
    
    console.log("Create status:", createRes.status);
    const createData = await createRes.json();
    console.log("Create response data:", JSON.stringify(createData, null, 2));
  } catch (error) {
    console.error("ERROR:", error);
  }
}

test();
