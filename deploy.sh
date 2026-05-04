#!/bin/bash
# Vanliving 后端部署脚本

echo "========== Vanliving 后端部署脚本 =========="

# 1. 安装 Node.js 18
echo "[1/8] 安装 Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v

# 2. 安装 pnpm
echo "[2/8] 安装 pnpm..."
npm install -g pnpm
pnpm -v

# 3. 安装 Git
echo "[3/8] 安装 Git..."
apt-get update && apt-get install -y git

# 4. 创建目录并克隆代码
echo "[4/8] 克隆代码..."
mkdir -p /www
cd /www
git clone https://github.com/Winsify/vanliving.git
cd vanliving/server

# 5. 安装依赖
echo "[5/8] 安装依赖..."
pnpm install

# 6. 配置环境变量（需要替换为实际值）
echo "[6/8] 配置环境变量..."
cat > .env << EOF
PORT=8080
DATABASE_URL=your-supabase-database-url
SUPABASE_SERVICE_KEY=your-supabase-service-key
EOF

echo "⚠️  请编辑 .env 文件，填入正确的 Supabase 连接信息！"

# 7. 安装 PM2
echo "[7/8] 安装 PM2..."
npm install -g pm2

# 8. 启动服务
echo "[8/8] 启动服务..."
pm2 stop vanliving-api 2>/dev/null || true
pm2 start src/index.js --name vanliving-api
pm2 list

# 设置开机自启
pm2 startup
pm2 save

echo ""
echo "========== 部署完成 =========="
echo "API 地址: http://115.175.79.172:8080"
echo "健康检查: http://115.175.79.172:8080/api/v1/health"
echo ""
echo "⚠️  后续步骤："
echo "1. 编辑 /www/vanliving/server/.env 填入 Supabase 信息"
echo "2. 重启服务: pm2 restart vanliving-api"
echo "3. 配置防火墙: 开放 8080 端口"
