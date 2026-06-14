#!/bin/bash
# Sync dashboard data to GitHub

cd /home/booe/clawd/oracle-dashboard

# Export fresh data
node scripts/export-data.js

# Check if data.json changed
if git diff --quiet data.json; then
  echo "$(date): No changes to sync"
  exit 0
fi

# Commit and push
git add data.json
git commit -m "📊 Update predictions data - $(date '+%Y-%m-%d %H:%M UTC')"
git push origin main

echo "$(date): Synced to GitHub!"
