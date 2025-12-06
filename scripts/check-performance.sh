#!/bin/bash

# Performance Check Script für PH-Services
# Verwendet nach erfolgreichem Deploy

set -e

echo "🚀 Starting Performance Analysis for PH-Services"
echo "=================================================="
echo ""

# Check Node version
echo "📊 Environment Check:"
node --version
npm --version
echo ""

# Check if build artifacts exist
if [ -d ".next" ]; then
    echo "✅ Build artifacts found"
    echo "Build size breakdown:"
    du -sh .next 2>/dev/null || echo "   (size calculation skipped)"
else
    echo "⚠️  No build artifacts found - run 'npm run build' first"
    exit 1
fi

echo ""
echo "📦 Dependency Analysis:"
echo "Total packages: $(npm ls --depth=0 2>/dev/null | wc -l)"

echo ""
echo "🔍 Potential Issues to Fix:"
echo "   1. Run: npm outdated  # Check for outdated packages"
echo "   2. Run: npm audit     # Security vulnerabilities"
echo "   3. Check: Chrome DevTools Lighthouse"
echo "   4. Check: Bundle Analyzer for large dependencies"

echo ""
echo "📈 Next Steps After Deploy:"
echo "   1. Visit: https://x-tool-ph-service.web.app"
echo "   2. Open: Chrome DevTools > Lighthouse"
echo "   3. Audit with: Lighthouse Performance"
echo "   4. Target: Scores >85 on all metrics"

echo ""
echo "🎯 Performance Targets:"
echo "   ├─ LCP (Largest Contentful Paint): <2.5s"
echo "   ├─ FID (First Input Delay): <100ms"
echo "   ├─ CLS (Cumulative Layout Shift): <0.1"
echo "   ├─ JS Bundle: <250 KB"
echo "   └─ CSS Bundle: <50 KB"

echo ""
echo "📋 Current Configuration Status:"
grep -E "(compress|productionBrowserSourceMaps|onDemandEntries)" next.config.ts || true

echo ""
echo "✅ Analysis complete. Review PERFORMANCE_ROADMAP.md for details."
