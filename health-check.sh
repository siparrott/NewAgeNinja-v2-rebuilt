#!/bin/bash
# Health check script for deployment monitoring

MAX_RETRIES=5
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f -s http://localhost:5000/api/health > /dev/null; then
        echo "✅ Health check passed"
        exit 0
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "⏳ Health check attempt $RETRY_COUNT/$MAX_RETRIES failed, retrying..."
    sleep 2
done

echo "❌ Health check failed after $MAX_RETRIES attempts"
exit 1
