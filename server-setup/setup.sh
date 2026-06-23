#!/bin/bash
# 养龟档案 - 服务器环境自动安装脚本
# 适用于 Ubuntu 22.04
# 安装: Node.js 20.x + Nginx + PM2 + MySQL 8.0

set -e  # 遇到错误立即退出

echo "========================================="
echo "  养龟档案 - 服务器环境安装脚本"
echo "  适用于 Ubuntu 22.04"
echo "========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}请使用 sudo 运行此脚本${NC}"
    echo "用法: sudo bash setup.sh"
    exit 1
fi

echo -e "${GREEN}✓${NC} 检查系统版本..."
if ! grep -q "Ubuntu 22.04" /etc/os-release; then
    echo -e "${YELLOW}警告: 此脚本专为 Ubuntu 22.04 设计${NC}"
    read -p "是否继续? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 1. 更新系统
echo ""
echo -e "${YELLOW}[1/7]${NC} 更新系统软件包..."
apt update && apt upgrade -y
echo -e "${GREEN}✓${NC} 系统更新完成"

# 2. 安装 Node.js 20.x
echo ""
echo -e "${YELLOW}[2/7]${NC} 安装 Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
NODE_VERSION=$(node -v)
echo -e "${GREEN}✓${NC} Node.js 安装完成: $NODE_VERSION"

# 3. 安装 PM2
echo ""
echo -e "${YELLOW}[3/7]${NC} 安装 PM2..."
npm install -g pm2
echo -e "${GREEN}✓${NC} PM2 安装完成"

# 4. 安装 Nginx
echo ""
echo -e "${YELLOW}[4/7]${NC} 安装 Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx
echo -e "${GREEN}✓${NC} Nginx 安装完成"

# 5. 安装 MySQL 8.0
echo ""
echo -e "${YELLOW}[5/7]${NC} 安装 MySQL 8.0..."
apt install -y mysql-server mysql-client

# 启动MySQL并设置开机自启
systemctl enable mysql
systemctl start mysql

echo -e "${GREEN}✓${NC} MySQL 8.0 安装完成"

# 6. 配置 MySQL
echo ""
echo -e "${YELLOW}[6/7]${NC} 配置 MySQL..."
echo ""
echo "请设置 MySQL root 密码:"
mysql_secure_installation

# 7. 创建数据库和用户
echo ""
echo -e "${YELLOW}[7/7]${NC} 创建数据库..."
echo "请输入 MySQL root 密码以创建数据库:"
mysql -u root -p <<EOF
CREATE DATABASE IF NOT EXISTS turtle_archive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'turtle_user'@'localhost' IDENTIFIED BY 'Turtle@2024';
GRANT ALL PRIVILEGES ON turtle_archive.* TO 'turtle_user'@'localhost';
FLUSH PRIVILEGES;
EOF

echo -e "${GREEN}✓${NC} 数据库创建完成"
echo "  数据库名: turtle_archive"
echo "  用户名: turtle_user"
echo "  密码: Turtle@2024"
echo "  (请修改密码为更安全的密码!)"

# 8. 安装其他依赖
echo ""
echo -e "${YELLOW}[额外]${NC} 安装其他工具..."
apt install -y git curl wget unzip

# 9. 配置防火墙
echo ""
echo -e "${YELLOW}[防火墙]${NC} 配置 UFW 防火墙..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw allow 3306  # MySQL (仅本地访问)
echo "y" | ufw enable
echo -e "${GREEN}✓${NC} 防火墙配置完成"

# 10. 创建项目目录
echo ""
echo -e "${YELLOW}[目录]${NC} 创建项目目录..."
mkdir -p /var/www/turtle-archive
mkdir -p /var/log/turtle-archive
chown -R $SUDO_USER:$SUDO_USER /var/www/turtle-archive
chown -R $SUDO_USER:$SUDO_USER /var/log/turtle-archive
echo -e "${GREEN}✓${NC} 项目目录创建完成: /var/www/turtle-archive"

# 完成
echo ""
echo "========================================="
echo -e "${GREEN}✓ 所有组件安装完成!${NC}"
echo "========================================="
echo ""
echo "已安装:"
echo "  • Node.js: $(node -v)"
echo "  • NPM: $(npm -v)"
echo "  • PM2: $(pm2 -v)"
echo "  • Nginx: $(nginx -v 2>&1)"
echo "  • MySQL: $(mysql --version)"
echo ""
echo "下一步:"
echo "  1. 导入数据库表结构: mysql -u turtle_user -p turtle_archive < database.sql"
echo "  2. 上传项目文件到 /var/www/turtle-archive"
echo "  3. 配置 Nginx (已生成配置文件)"
echo "  4. 使用 PM2 启动服务"
echo ""
echo "Nginx 配置文件已生成: /etc/nginx/sites-available/turtle-archive"
echo "请查看 SETUP_GUIDE.md 获取详细部署步骤"
echo ""
