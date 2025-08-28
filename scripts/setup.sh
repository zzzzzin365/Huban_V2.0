#!/bin/bash

echo "🚀 开始设置React Native项目..."

# 检查Node.js版本
echo "📋 检查Node.js版本..."
node --version
npm --version

# 安装依赖
echo "📦 安装项目依赖..."
npm install

# 安装iOS依赖
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 安装iOS依赖..."
    cd ios && pod install && cd ..
else
    echo "⚠️  跳过iOS依赖安装（非macOS系统）"
fi

# 清理缓存
echo "🧹 清理Metro缓存..."
npx react-native start --reset-cache

echo "✅ 项目设置完成！"
echo ""
echo "📱 运行项目："
echo "  Android: npm run android"
echo "  iOS: npm run ios"
echo "  启动Metro: npm start"
