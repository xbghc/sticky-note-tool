# 便签工具 (Sticky Note Tool)

一个简洁的桌面便签工具，支持快速保存和自动输入文本内容。

## 功能特点

- 📝 快速添加和管理文本片段
- ⌨️ **全局快捷键 Ctrl+Shift+I**：自动复制并粘贴第一行内容到当前活动窗口
- 🔄 点击便签内容即可复制并删除
- 👁️ 支持窗口显示/隐藏（Ctrl+Shift+C）
- 💾 自动保存所有内容，重启后恢复
- 🎯 始终置顶，方便随时使用

## 系统要求

- **操作系统**：Windows 10/11、macOS、Linux
- **功能支持**：
  - **Windows**：完整功能（自动复制 + 自动粘贴）
  - **macOS/Linux**：基础功能（自动复制，需手动粘贴）

## 使用方法

### 基本操作

1. 在输入框中输入文本，按回车或点击"添加"按钮保存
2. 点击任意已保存的文本，自动复制到剪贴板并删除该条目
3. 双击窗口任意位置或点击"隐藏"按钮隐藏窗口

### 快捷键

- **Ctrl+Shift+C**：显示/隐藏窗口
- **Ctrl+Shift+I**：自动输入第一行内容
  - **Windows**：复制第一行 → 删除第一行 → 自动粘贴到光标位置
  - **macOS/Linux**：复制第一行 → 删除第一行 → 需手动按 Cmd+V/Ctrl+V 粘贴

### 自动输入功能说明

- **Windows**：按下快捷键后立即自动粘贴
- **macOS/Linux**：按下快捷键后内容已复制，需手动粘贴
- 底部状态栏会显示执行状态
- 如果自动粘贴失败，内容仍在剪贴板中，可手动粘贴

## 开发

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm start
```

### 构建

```bash
npm run build
```

### 打包

```bash
npm run make
```

## 技术栈

- Electron
- TypeScript
- PowerShell (用于 Windows 自动粘贴功能)

## 已知限制

- 自动粘贴功能使用 Windows 原生技术（VBScript/PowerShell），仅在 Windows 系统上可用
- macOS 和 Linux 系统仅支持自动复制功能，需要用户手动粘贴

## License

ISC
