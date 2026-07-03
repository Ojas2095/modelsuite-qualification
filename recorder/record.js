const { chromium } = require('playwright');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function run() {
    console.log('Starting server...');
    const serverProcess = spawn('node', ['../server/start-memory.js'], { cwd: __dirname, shell: true });
    
    console.log('Starting client...');
    const clientProcess = spawn('npm', ['run', 'dev'], { cwd: path.join(__dirname, '../client'), shell: true });

    // Wait for services to boot up
    console.log('Waiting 10 seconds for services to boot...');
    await new Promise(r => setTimeout(r, 10000));

    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        recordVideo: {
            dir: './',
            size: { width: 1280, height: 720 }
        }
    });

    const page = await context.newPage();
    console.log('Navigating to app...');
    await page.goto('http://localhost:5173/register');

    // Registration
    console.log('Filling registration form...');
    await page.waitForTimeout(1000);
    await page.fill('#name', 'Test User');
    await page.fill('#reg-email', 'testuser@example.com');
    await page.fill('#reg-password', 'password123');
    await page.selectOption('#role', 'Talent');
    await page.click('button[type="submit"]');

    // Wait for redirect and login or dashboard
    console.log('Waiting for redirect...');
    await page.waitForTimeout(3000);

    // If redirected to login, login
    if (page.url().includes('login')) {
        console.log('Filling login form...');
        await page.fill('#email', 'testuser@example.com');
        await page.fill('#password', 'password123');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(3000);
    }

    console.log('Closing browser...');
    await context.close();
    await browser.close();

    // Kill processes
    console.log('Killing servers...');
    serverProcess.kill('SIGINT');
    clientProcess.kill('SIGINT');
    
    // Rename video
    const files = fs.readdirSync('./');
    const videoFile = files.find(f => f.endsWith('.webm') && f !== 'modelsuite_demo.webm');
    if (videoFile) {
        fs.renameSync(path.join('./', videoFile), './modelsuite_demo.webm');
        console.log('✅ Video saved successfully as modelsuite_demo.webm');
    } else {
        console.log('❌ Video file not found!');
    }
    
    process.exit(0);
}

run().catch(console.error);
