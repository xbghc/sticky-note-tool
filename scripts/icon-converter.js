const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 用于生成 Windows .ico 和 macOS .icns 的辅助脚本

async function convertToIco() {
  console.log('生成 Windows ICO 文件...');
  
  // 使用 png-to-ico
  try {
    const png2ico = require('png-to-ico');
    const pngFiles = [
      path.join(__dirname, '../assets/icons/16x16.png'),
      path.join(__dirname, '../assets/icons/32x32.png'),
      path.join(__dirname, '../assets/icons/48x48.png'),
      path.join(__dirname, '../assets/icons/64x64.png'),
      path.join(__dirname, '../assets/icons/128x128.png'),
      path.join(__dirname, '../assets/icons/256x256.png')
    ];
    
    const buf = await png2ico(pngFiles);
    fs.writeFileSync(path.join(__dirname, '../assets/icons/icon.ico'), buf);
    console.log('✓ 已生成 icon.ico');
  } catch (error) {
    console.error('生成 ICO 失败:', error.message);
    console.log('请使用在线工具: https://icoconvert.com/');
  }
}

async function convertToIcns() {
  console.log('\n生成 macOS ICNS 文件...');
  
  // 方案1：使用 iconutil (仅在 macOS 上可用)
  if (process.platform === 'darwin') {
    try {
      const iconsetPath = path.join(__dirname, '../assets/icons/icon.iconset');
      
      // 创建 iconset 目录
      if (!fs.existsSync(iconsetPath)) {
        fs.mkdirSync(iconsetPath);
      }
      
      // 复制所需尺寸的图标到 iconset
      const iconsetSizes = [
        { size: 16, name: 'icon_16x16.png' },
        { size: 32, name: 'icon_16x16@2x.png' },
        { size: 32, name: 'icon_32x32.png' },
        { size: 64, name: 'icon_32x32@2x.png' },
        { size: 128, name: 'icon_128x128.png' },
        { size: 256, name: 'icon_128x128@2x.png' },
        { size: 256, name: 'icon_256x256.png' },
        { size: 512, name: 'icon_256x256@2x.png' },
        { size: 512, name: 'icon_512x512.png' },
        { size: 1024, name: 'icon_512x512@2x.png' }
      ];
      
      for (const { size, name } of iconsetSizes) {
        const src = path.join(__dirname, `../assets/icons/${size}x${size}.png`);
        const dest = path.join(iconsetPath, name);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }
      
      // 使用 iconutil 转换
      execSync(`iconutil -c icns ${iconsetPath} -o ${path.join(__dirname, '../assets/icons/icon.icns')}`);
      console.log('✓ 已生成 icon.icns');
      
      // 清理 iconset 目录
      fs.rmSync(iconsetPath, { recursive: true });
    } catch (error) {
      console.error('生成 ICNS 失败:', error.message);
    }
  } else {
    console.log('在非 macOS 系统上，请使用以下在线工具:');
    console.log('- https://cloudconvert.com/png-to-icns');
    console.log('- https://iconverticons.com/online/');
  }
}

// 主函数
async function main() {
  console.log('图标格式转换工具\n');
  
  await convertToIco();
  await convertToIcns();
  
  console.log('\n完成！');
}

main().catch(console.error);