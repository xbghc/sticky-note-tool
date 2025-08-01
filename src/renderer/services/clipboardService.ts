import { clipboard } from 'electron';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export type PasteStrategy = 'ctrlV' | 'shiftInsert';

export interface ClipboardConfig {
  pasteStrategy: PasteStrategy;
  pasteDelay: number;
}

export class ClipboardService {
  private platform = process.platform;
  private config: ClipboardConfig = {
    pasteStrategy: 'ctrlV',
    pasteDelay: 50
  };

  /**
   * 复制文本到剪贴板
   */
  copy(text: string): void {
    clipboard.writeText(text);
  }

  /**
   * 从剪贴板读取文本
   */
  read(): string {
    return clipboard.readText();
  }

  /**
   * 清空剪贴板
   */
  clear(): void {
    clipboard.clear();
  }

  /**
   * 执行粘贴操作
   */
  async paste(): Promise<void> {
    switch (this.platform) {
      case 'win32':
        await this.pasteWindows();
        break;
      case 'darwin':
        await this.pasteMacOS();
        break;
      default:
        await this.pasteLinux();
    }
  }

  /**
   * Windows 平台粘贴
   */
  private async pasteWindows(): Promise<void> {
    try {
      await this.executeVBScript();
      // 粘贴成功
    } catch (error) {
      // VBScript 失败，尝试 PowerShell
      try {
        await this.executePowerShell();
        // 粘贴成功（备用方案）
      } catch (error) {
        // 粘贴失败
      }
    }
  }

  /**
   * 执行 VBScript
   */
  private executeVBScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const vbsContent = this.getVBScriptContent();
      const tempFile = path.join(os.tmpdir(), `paste_${Date.now()}.vbs`);
      
      fs.writeFileSync(tempFile, vbsContent);
      
      exec(`wscript //B //NoLogo "${tempFile}"`, (error) => {
        // 异步删除临时文件
        fs.unlink(tempFile, () => {});
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 获取 VBScript 内容
   */
  private getVBScriptContent(): string {
    if (this.config.pasteStrategy === 'shiftInsert') {
      // Shift+Insert：适用于git bash
      return 'CreateObject("WScript.Shell").SendKeys "+{INSERT}"';
    } else {
      // Ctrl+V：适用于大多数程序
      return 'CreateObject("WScript.Shell").SendKeys "^v"';
    }
  }

  /**
   * 执行 PowerShell
   */
  private executePowerShell(): Promise<void> {
    return new Promise((resolve, reject) => {
      let command = '';
      
      if (this.config.pasteStrategy === 'shiftInsert') {
        command = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('+{INSERT}')`;
      } else {
        command = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait('^v')`;
      }
      
      exec(`powershell -NoProfile -Command "${command}"`, { windowsHide: true }, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * macOS 平台粘贴
   */
  private async pasteMacOS(): Promise<void> {
    console.log('内容已复制到剪贴板，请按 Cmd+V 粘贴');
  }

  /**
   * Linux 平台粘贴
   */
  private async pasteLinux(): Promise<void> {
    console.log('内容已复制到剪贴板，请按 Ctrl+V 粘贴');
  }

  /**
   * 设置配置
   */
  setConfig(config: Partial<ClipboardConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取配置
   */
  getConfig(): ClipboardConfig {
    return { ...this.config };
  }

}

// 导出单例实例
export const clipboardService = new ClipboardService();