# 项目启动与停止工具包

此工具包包含优化的启动/停止脚本和API文档页面，用于简化项目部署和管理。

## 包含文件

### 脚本文件
- `start.bat` - Windows启动脚本
- `stop.bat` - Windows停止脚本
- `start.sh` - Linux/macOS启动脚本
- `stop.sh` - Linux/macOS停止脚本

### 其他文件
- `api-docs.html` - 现代化API文档页面
- `集成说明.md` - 详细的集成和使用说明

## 快速开始

### Windows
```cmd
start.bat  # 启动项目
stop.bat   # 停止项目
```

### Linux/macOS
```bash
./start.sh  # 启动项目
./stop.sh   # 停止项目
```

## 特性

- **环境检查**：自动检测Node.js、端口占用、项目依赖
- **交互式安装**：缺失依赖时提供安装提示
- **彩色日志**：带时间戳和颜色编码的日志输出
- **后台运行**：非阻塞式启动，支持PID跟踪
- **优雅停止**：基于PID或端口的进程终止
- **现代化API文档**：响应式设计，支持多种编程语言示例

更多详情请参阅 `集成说明.md`。