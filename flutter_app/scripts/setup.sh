#!/bin/bash

# 志愿者匹配系统 - 项目设置脚本

echo "🚀 开始设置志愿者匹配系统..."

# 检查Flutter是否安装
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter未安装，请先安装Flutter SDK"
    echo "访问: https://flutter.dev/docs/get-started/install"
    exit 1
fi

echo "✅ Flutter已安装"

# 检查Flutter版本
FLUTTER_VERSION=$(flutter --version | grep -o "Flutter [0-9]*\.[0-9]*\.[0-9]*" | head -1)
echo "📱 Flutter版本: $FLUTTER_VERSION"

# 获取依赖
echo "📦 获取项目依赖..."
flutter pub get

if [ $? -eq 0 ]; then
    echo "✅ 依赖获取成功"
else
    echo "❌ 依赖获取失败"
    exit 1
fi

# 检查API配置
echo "🔑 检查API配置..."

# 检查高德地图API配置
if grep -q "YOUR_AMAP_API_KEY" lib/config/api_config.dart; then
    echo "⚠️  警告: 高德地图API密钥未配置"
    echo "请在 lib/config/api_config.dart 中配置您的API密钥"
    echo ""
    echo "需要配置的密钥:"
    echo "  - amapApiKey"
    echo "  - amapAndroidKey" 
    echo "  - amapIosKey"
    echo ""
    echo "获取API密钥: https://lbs.amap.com/"
else
    echo "✅ 高德地图API密钥已配置"
fi

# 检查AR资源文件
echo "🎯 检查AR资源文件..."
if [ ! -f "assets/ar_assets/direction_arrow.glb" ]; then
    echo "⚠️  警告: AR方向箭头模型文件不存在"
    echo "请将3D模型文件放置在 assets/ar_assets/ 目录下"
    echo "需要的文件:"
    echo "  - direction_arrow.glb"
    echo "  - distance_indicator.glb"
    echo "  - marker.glb"
else
    echo "✅ AR资源文件已配置"
fi

# 检查权限配置
echo "🔒 检查权限配置..."

# iOS权限检查
if [ -f "ios/Runner/Info.plist" ]; then
    if ! grep -q "NSLocationWhenInUseUsageDescription" ios/Runner/Info.plist; then
        echo "⚠️  警告: iOS位置权限未配置"
        echo "请在 ios/Runner/Info.plist 中添加位置权限"
    else
        echo "✅ iOS权限已配置"
    fi
fi

# Android权限检查
if [ -f "android/app/src/main/AndroidManifest.xml" ]; then
    if ! grep -q "ACCESS_FINE_LOCATION" android/app/src/main/AndroidManifest.xml; then
        echo "⚠️  警告: Android位置权限未配置"
        echo "请在 android/app/src/main/AndroidManifest.xml 中添加位置权限"
    else
        echo "✅ Android权限已配置"
    fi
fi

echo ""
echo "🎉 项目设置完成！"
echo ""
echo "📋 下一步操作:"
echo "1. 配置高德地图API密钥 (如果未配置)"
echo "2. 添加AR 3D模型文件 (如果未添加)"
echo "3. 运行项目: flutter run"
echo ""
echo "📚 更多信息请查看 README.md"
echo ""
echo "🔧 常用命令:"
echo "  flutter run          # 运行应用"
echo "  flutter build apk    # 构建Android APK"
echo "  flutter build ios    # 构建iOS应用"
echo "  flutter test         # 运行测试"
echo "  flutter clean        # 清理项目" 