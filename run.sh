#!/usr/bin/env bash
# 前端一键部署：纯 docker 命令，不用 compose
# 服务：frontend（nginx serve dist）+ gateway（Caddy，自动 Let's Encrypt）
# 用法：./run.sh
set -euo pipefail

cd "$(dirname "$0")"

IMAGE="greenwall-frontend:latest"
NETWORK="greenwall-frontend-net"
FRONTEND_NAME="greenwall-frontend"
GATEWAY_NAME="greenwall-frontend-gateway"
CADDY_DATA_VOLUME="greenwall-caddy-data"
CADDY_CONFIG_VOLUME="greenwall-caddy-config"

# Caddy 申请 Let's Encrypt 证书用的邮箱
ACME_EMAIL="cailgainey@foxmail.com"
DOMAIN="cailgainey.cn"
BACKEND_UPSTREAM="45.207.221.65:8888"

echo "▶ 创建网络 $NETWORK"
docker network inspect $NETWORK >/dev/null 2>&1 || docker network create $NETWORK

echo "▶ 构建前端镜像"
docker build -t $IMAGE .

echo "▶ 启动 frontend（仅容器内网暴露 80）"
docker rm -f $FRONTEND_NAME >/dev/null 2>&1 || true
docker run -d \
    --name $FRONTEND_NAME \
    --network $NETWORK \
    --network-alias frontend \
    --restart unless-stopped \
    $IMAGE

echo "▶ 启动 Caddy 网关（公网 80/443，自动申请证书）"
docker rm -f $GATEWAY_NAME >/dev/null 2>&1 || true
docker run -d \
    --name $GATEWAY_NAME \
    --network $NETWORK \
    --restart unless-stopped \
    -p 80:80 \
    -p 443:443 \
    -e DOMAIN="$DOMAIN" \
    -e BACKEND_UPSTREAM="$BACKEND_UPSTREAM" \
    -e ACME_EMAIL="$ACME_EMAIL" \
    -v "$(pwd)/deploy/Caddyfile:/etc/caddy/Caddyfile:ro" \
    -v $CADDY_DATA_VOLUME:/data \
    -v $CADDY_CONFIG_VOLUME:/config \
    caddy:2-alpine

echo ""
echo "✔ 已启动"
docker ps --filter "name=greenwall-" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""
echo "首次申请证书需要 30s-2min，跟踪日志："
echo "  docker logs -f $GATEWAY_NAME"
