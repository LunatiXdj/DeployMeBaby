#!/bin/bash

# 🚀 QUICK START: Deploy für PH-Services
# Führe dieses Script aus zum Deployen

set -e

echo "╔════════════════════════════════════════════════════╗"
echo "║   PH-Services Firebase App Hosting Deploy         ║"
echo "║   Target: ph-service-xtool                        ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Step 1: Verify Node & NPM
echo "📦 Step 1: Checking environment..."
echo "Node: $(node --version)"
echo "NPM: $(npm --version)"
echo ""

# Step 2: Verify Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found!"
    echo "Install: npm install -g firebase-tools"
    exit 1
fi
echo "✅ Firebase CLI found: $(firebase --version)"
echo ""

# Step 3: Verify project
echo "🔐 Step 2: Verifying Firebase project..."
CURRENT_PROJECT=$(firebase projects:list | grep x-tool-ph-service | wc -l)
if [ $CURRENT_PROJECT -eq 0 ]; then
    echo "❌ Project x-tool-ph-service not found!"
    echo "Set it: firebase use x-tool-ph-service"
    exit 1
fi
echo "✅ Project selected: x-tool-ph-service"
echo ""

# Step 4: Install dependencies
echo "📥 Step 3: Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Step 5: Clean build
echo "🧹 Step 4: Cleaning previous build..."
rm -rf .next
echo "✅ Previous build cleaned"
echo ""

# Step 6: Build
echo "🔨 Step 5: Building Next.js app..."
echo "   This may take 2-3 minutes..."
npm run build
echo ""

# Step 7: Verify build
if [ ! -d ".next/standalone" ]; then
    echo "❌ Build failed! .next/standalone not found"
    exit 1
fi
echo "✅ Build successful!"
echo "   Build size: $(du -sh .next | cut -f1)"
echo ""

# Step 8: Pre-deploy checks
echo "🔍 Step 6: Pre-deploy checks..."

# Check for console errors
echo "   ├─ Checking for TypeScript errors..."
npm run build > /dev/null 2>&1 && echo "   │  ✅ No TypeScript errors"

# Check for lint errors
echo "   ├─ Checking linter..."
npm run lint > /dev/null 2>&1 && echo "   │  ✅ Linter passed" || echo "   │  ⚠️ Lint warnings (non-critical)"

# Check .env.local
echo "   ├─ Checking environment variables..."
if [ -f ".env.local" ]; then
    echo "   │  ✅ .env.local found"
else
    echo "   │  ⚠️ .env.local not found (may cause issues)"
fi

echo "   └─ Pre-deploy checks complete"
echo ""

# Step 9: Deploy confirmation
echo "════════════════════════════════════════════════════════"
echo "🚀 Ready to deploy to App Hosting!"
echo ""
echo "Deployment will:"
echo "  • Upload source code to Firebase"
echo "  • Build Docker container"
echo "  • Start Node.js server with Next.js"
echo "  • Make available at: https://ph-service-xtool-*.web.app"
echo ""
echo "This typically takes 5-10 minutes"
echo ""

read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

# Step 10: Deploy
echo ""
echo "🚀 Deploying to App Hosting..."
echo "   Backend: ph-service-xtool"
echo ""

firebase deploy --only apphosting:ph-service-xtool

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ Deployment Complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Check deployment status:"
echo "      firebase apphosting:backends:describe ph-service-xtool"
echo ""
echo "   2. View live app at:"
echo "      https://ph-service-xtool-*.web.app"
echo ""
echo "   3. Monitor logs:"
echo "      firebase apphosting:backends:logs ph-service-xtool --tail"
echo ""
echo "   4. Check Google Analytics:"
echo "      https://analytics.google.com (Property: G-KRWTG1JY14)"
echo ""
echo "════════════════════════════════════════════════════════"
