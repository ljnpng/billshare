const puppeteer = require('puppeteer');

async function testPersistence() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  
  try {
    const page = await browser.newPage();
    
    console.log('导航到应用首页...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
    
    // 等待页面加载完成
    await page.waitForSelector('body');
    
    // 获取当前URL以检查是否自动分配了UUID
    const currentUrl = page.url();
    console.log('当前URL:', currentUrl);
    
    // 检查是否重定向到了带UUID的页面
    const uuidMatch = currentUrl.match(/\/([a-f0-9-]{36})/);
    if (uuidMatch) {
      const uuid = uuidMatch[1];
      console.log('✅ 检测到UUID:', uuid);
      
      // 添加一些测试数据
      console.log('添加测试数据...');
      
      // 查找并填写人员信息
      try {
        await page.waitForSelector('input[type="text"]', { timeout: 5000 });
        const inputs = await page.$$('input[type="text"]');
        
        if (inputs.length > 0) {
          await inputs[0].type('张三');
          console.log('✅ 添加了人员: 张三');
          
          // 如果有添加按钮，点击它
          const addButton = await page.$('button[type="submit"], button:contains("添加")');
          if (addButton) {
            await addButton.click();
            console.log('✅ 点击了添加按钮');
          }
        }
      } catch (error) {
        console.log('⚠️ 添加人员时出错:', error.message);
      }
      
      // 等待一段时间让数据保存
      await page.waitForTimeout(2000);
      
      // 刷新页面测试数据是否持久化
      console.log('刷新页面测试持久化...');
      await page.reload({ waitUntil: 'networkidle2' });
      
      // 检查数据是否还在
      await page.waitForTimeout(1000);
      const pageContent = await page.content();
      
      if (pageContent.includes('张三')) {
        console.log('✅ 持久化测试成功: 数据在刷新后仍然存在');
      } else {
        console.log('❌ 持久化测试失败: 数据在刷新后丢失');
      }
      
      // 测试相同UUID访问
      console.log('测试相同UUID访问...');
      await page.goto(`http://localhost:3001/${uuid}`, { waitUntil: 'networkidle2' });
      
      await page.waitForTimeout(1000);
      const newPageContent = await page.content();
      
      if (newPageContent.includes('张三')) {
        console.log('✅ UUID访问测试成功: 相同UUID能够回显数据');
      } else {
        console.log('❌ UUID访问测试失败: 相同UUID无法回显数据');
      }
      
    } else {
      console.log('❌ 未检测到UUID重定向');
    }
    
    // 保持浏览器打开10秒以便观察
    console.log('保持浏览器打开10秒以便观察...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  } finally {
    await browser.close();
  }
}

testPersistence().catch(console.error);