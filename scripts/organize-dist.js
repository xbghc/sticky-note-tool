const fs = require('fs');
const path = require('path');
const { zip } = require('zip-a-folder');
const { name, version } = require('../package.json');

async function organizeDist() {
  const outDir = path.join(__dirname, '../out');
  const releaseDir = path.join(outDir, version);
  
  if (!fs.existsSync(outDir)) {
    console.log('No out directory found, skipping dist organization');
    return;
  }

  // 创建版本目录
  if (!fs.existsSync(releaseDir)) {
    fs.mkdirSync(releaseDir, { recursive: true });
  }

  console.log(`整理发布文件: ${version}`);

  // 处理 package 文件夹 (portable 版本)
  await processPackageFiles(outDir, releaseDir);
  
  // 处理 make 文件夹 (安装程序)
  await processMakeFiles(outDir, releaseDir);
  
  console.log(`✓ 发布文件已整理到: out/${version}/`);
}

async function processPackageFiles(outDir, releaseDir) {
  const packageFolders = fs.readdirSync(outDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && !dirent.name.includes('make') && dirent.name !== version)
    .map(dirent => dirent.name);

  for (const folder of packageFolders) {
    const folderPath = path.join(outDir, folder);
    
    // 解析文件夹名获取平台和架构信息
    const match = folder.match(/^(.+)-(.+)-(.+)$/);
    if (!match) {
      console.log(`⚠️  跳过未识别的文件夹格式: ${folder}`);
      continue;
    }
    
    const [, appName, platform, arch] = match;
    const zipName = `${appName}-${arch}-${platform}.zip`;
    const zipPath = path.join(releaseDir, zipName);
    
    try {
      await zip(folderPath, zipPath);
      console.log(`✓ 已创建便携版: ${zipName}`);
    } catch (error) {
      console.error(`✗ 压缩失败 ${folder}:`, error.message);
    }
  }
}

async function processMakeFiles(outDir, releaseDir) {
  const makeDir = path.join(outDir, 'make');
  if (!fs.existsSync(makeDir)) {
    return;
  }

  const makeFolders = fs.readdirSync(makeDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const makeType of makeFolders) {
    const makeTypePath = path.join(makeDir, makeType);
    const archFolders = fs.readdirSync(makeTypePath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (const arch of archFolders) {
      const archPath = path.join(makeTypePath, arch);
      
      // 处理不同类型的安装文件
      if (makeType === 'squirrel.windows') {
        await processSquirrelFiles(archPath, releaseDir, arch);
      } else {
        // 其他格式 (deb, rpm 等)
        await processOtherMakeFiles(archPath, releaseDir, makeType, arch);
      }
    }
  }
}

async function processSquirrelFiles(archPath, releaseDir, arch) {
  const files = fs.readdirSync(archPath);
  const setupFile = files.find(file => file.endsWith(' Setup.exe') || file.endsWith('-setup.exe') || file.endsWith('Setup.exe'));
  
  if (setupFile) {
    const sourcePath = path.join(archPath, setupFile);
    const newName = `${name}-setup-${arch}-windows.exe`;
    const destPath = path.join(releaseDir, newName);
    
    try {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✓ 已创建安装程序: ${newName}`);
    } catch (error) {
      console.error(`✗ 复制安装程序失败:`, error.message);
    }
  }
}

async function processOtherMakeFiles(archPath, releaseDir, makeType, arch) {
  const files = fs.readdirSync(archPath);
  
  for (const file of files) {
    const sourcePath = path.join(archPath, file);
    const ext = path.extname(file);
    const platform = makeType === 'deb' ? 'linux' : makeType === 'rpm' ? 'linux' : 'unknown';
    const newName = `${name}-${arch}-${platform}${ext}`;
    const destPath = path.join(releaseDir, newName);
    
    try {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✓ 已创建发布文件: ${newName}`);
    } catch (error) {
      console.error(`✗ 复制文件失败 ${file}:`, error.message);
    }
  }
}

organizeDist().catch(console.error);