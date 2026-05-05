# Expo 热更新(OTA Updates)配置说明书

## 一、概述

热更新（Over-The-Air Updates）允许在不重新安装 APK 的情况下更新 APP 代码。用户打开 APP 时会自动检测并下载最新版本。

---

## 二、所需软件清单

### 2.1 必需软件

| 软件 | 版本要求 | 下载地址 |
|------|----------|----------|
| Node.js | v18+（推荐 v20 LTS） | https://nodejs.org/ |
| Git | 最新版 | https://git-scm.com/download/win |
| EAS CLI | 最新版 | 通过 npm 安装 |

### 2.2 可选软件

| 软件 | 用途 | 下载地址 |
|------|------|----------|
| Visual Studio Code | 代码编辑器 | https://code.visualstudio.com/ |
| Android Studio | Android 模拟器 | https://developer.android.com/studio |

---

## 三、环境配置步骤

### 3.1 安装 Node.js

1. 访问 https://nodejs.org/
2. 下载 **LTS** 版本（左侧绿色按钮）
3. 双击 `.msi` 文件安装
4. **安装选项**：勾选 "Automatically install the necessary tools"（可选，建议勾选）
5. 安装完成后**重新打开 PowerShell**

**验证安装：**
```powershell
node -v
npm -v
```
应显示版本号，如 `v20.x.x` 和 `10.x.x`

---

### 3.2 安装 Git

1. 访问 https://git-scm.com/download/win
2. 下载 `Git-xxx-64-bit.exe`
3. 双击安装，全程选择**默认选项**
4. 安装完成后**重新打开 PowerShell**

**验证安装：**
```powershell
git -v
```
应显示版本号，如 `git version 2.x.x`

---

### 3.3 安装 EAS CLI

在 PowerShell 中执行：
```powershell
npm install -g eas-cli
```

**验证安装：**
```powershell
eas --version
```

---

### 3.4 登录 Expo 账号

```powershell
eas login
```
按提示输入 Expo 账号邮箱和密码。

**验证登录：**
```powershell
eas whoami
```

---

## 四、项目配置步骤

### 4.1 克隆项目代码

假设你的 GitHub 仓库地址是 `https://github.com/Winsify/vanliving.git`

在 PowerShell 中执行：
```powershell
git clone https://github.com/Winsify/vanliving.git
cd vanliving
```

---

### 4.2 安装项目依赖

```powershell
npm install
```

等待安装完成（可能有警告，可忽略）。

---

## 五、热更新发布步骤

### 5.1 日常发布热更新

每次代码修改后，执行以下命令发布更新：

```powershell
# 进入项目目录
cd vanliving

# 设置内存（防止打包失败）
$env:NODE_OPTIONS="-max-old-space-size=4096"

# 发布热更新
eas update --branch preview --message "更新描述"
```

**参数说明：**
- `--branch preview`：发布到 preview 分支（对应 app.json 中的 preview 渠道）
- `--message`：更新说明，便于追溯

---

### 5.2 查看发布历史

访问 Expo Dashboard 查看发布记录：
```
https://expo.dev/accounts/你的用户名/projects/你的项目名/updates
```

---

## 六、项目配置文件说明

### 6.1 app.json 配置

项目根目录的 `app.json` 中，热更新相关配置如下：

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "你的项目ID"
      }
    },
    "updates": {
      "enabled": true,
      "fallbackToCacheTimeout": 0,
      "url": "https://u.expo.dev/你的项目ID"
    }
  }
}
```

---

### 6.2 eas.json 配置

项目根目录的 `eas.json` 中，构建相关配置如下：

```json
{
  "cli": {
    "version": ">= 14.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 七、常见问题

### Q1: eas update 命令报错 "eas.json is not valid"

**原因**：`eas.json` 中有不合法的配置。

**解决**：确保 `eas.json` 中没有 `updates` 配置块，updates 配置应放在 `app.json` 中。

---

### Q2: 报错 "npx expo config ... exited with non-zero code"

**原因**：缺少依赖。

**解决**：执行 `npm install` 安装依赖。

---

### Q3: 打包时报错 "Fatal process out of memory"

**原因**：内存不足。

**解决**：执行以下命令增加内存：
```powershell
$env:NODE_OPTIONS="-max-old-space-size=4096"
```

---

### Q4: 报错 "git is not recognized"

**原因**：Git 未安装或未配置环境变量。

**解决**：
1. 确认 Git 已安装
2. 重启 PowerShell
3. 或检查 Git 安装时是否选择了 "From the command line and third-party software" 选项

---

### Q5: 报错 "eas login" 登录失败

**解决**：
1. 确认 Expo 账号已注册（https://expo.dev）
2. 检查邮箱密码是否正确
3. 尝试在浏览器登录 Expo 确认账号正常

---

### Q6: 热更新后 APP 没有收到更新

**可能原因**：
1. APP 版本与发布分支不匹配（检查 app.json 中的 releaseChannel）
2. 需要**完全关闭 APP 再重新打开**才能检测更新
3. 网络连接问题

**解决**：
1. 完全关闭 APP（从后台移除）
2. 重新打开 APP
3. 如果仍不更新，尝试卸载重装

---

## 八、快捷命令汇总

```powershell
# ========== 首次配置（每台新电脑只需执行一次）==========

# 安装 EAS CLI
npm install -g eas-cli

# 登录 Expo 账号
eas login

# 克隆项目代码（替换为你的仓库地址）
git clone https://github.com/Winsify/vanliving.git
cd vanliving

# 安装项目依赖
npm install

# ========== 日常发布热更新==========

# 设置内存（防止打包失败）
$env:NODE_OPTIONS="-max-old-space-size=4096"

# 发布热更新（替换更新描述）
eas update --branch preview --message "修复了登录问题"
```

---

## 九、相关链接

| 资源 | 地址 |
|------|------|
| Expo 官网 | https://expo.dev |
| EAS Update 文档 | https://docs.expo.dev/eas-update/ |
| EAS CLI 文档 | https://docs.expo.dev/eas-update/eas-cli/ |
| 项目 Dashboard | https://expo.dev/accounts/vanliving/projects/vanliving |

---

## 十、注意事项

1. **发布前务必先测试**：在发布到正式环境前，先在 preview 渠道测试
2. **更新描述要清晰**：便于追溯每个版本的内容
3. **定期同步代码**：发布热更新前，先 `git pull` 确保代码最新
4. **内存问题**：如果打包仍失败，尝试关闭其他应用程序释放内存
