const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

async function generateIcons() {
  const sourceImage = path.join(__dirname, '../assets/icon.png');
  const iconsDir = path.join(__dirname, '../assets/icons');
  
  // 确保图标目录存在
  await fs.mkdir(iconsDir, { recursive: true });
  
  // 定义所需的图标尺寸
  const sizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
  
  console.log('开始生成图标...');
  
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `${size}x${size}.png`);
    
    try {
      await sharp(sourceImage)
        .resize(size, size, {
          kernel: sharp.kernel.lanczos3,
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ 已生成 ${size}x${size}.png`);
    } catch (error) {
      console.error(`✗ 生成 ${size}x${size}.png 失败:`, error.message);
    }
  }
  
  // 生成高 DPI 版本
  const highDpiSizes = [16, 32, 64, 128, 256];
  
  for (const size of highDpiSizes) {
    const outputPath = path.join(iconsDir, `${size}x${size}@2x.png`);
    
    try {
      await sharp(sourceImage)
        .resize(size * 2, size * 2, {
          kernel: sharp.kernel.lanczos3,
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✓ 已生成 ${size}x${size}@2x.png (高 DPI)`);
    } catch (error) {
      console.error(`✗ 生成 ${size}x${size}@2x.png 失败:`, error.message);
    }
  }
  
  console.log('\n图标生成完成！');
  console.log('提示：');
  console.log('- Windows 需要 .ico 文件，请使用在线工具或 png-to-ico 包转换');
  console.log('- macOS 需要 .icns 文件，请使用 png2icns 或在线工具转换');
  console.log('- Linux 使用生成的 PNG 文件即可');
}

// 执行生成
generateIcons().catch(console.error);