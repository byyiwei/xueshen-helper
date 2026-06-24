#!/bin/bash
# 清除代理环境变量并推送到 Gitee

# 清除所有代理相关环境变量
unset HTTP_PROXY
unset HTTPS_PROXY
unset http_proxy
unset https_proxy
unset ALL_PROXY
unset all_proxy

# 显示当前代理设置（应该为空）
echo "当前代理设置："
env | grep -i proxy

# 切换到项目目录
cd "E:\Code\养龟档案"

# 推送代码
echo ""
echo "开始推送到 Gitee..."
git push -u origin master

echo ""
echo "推送完成！"
