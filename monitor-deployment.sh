#!/bin/bash
# Deployment monitoring and auto-recovery

LOGFILE="deployment.log"
PID_FILE="server.pid"

monitor_server() {
    while true; do
        if ! bash health-check.sh; then
            echo "$(date): Server health check failed, restarting..." >> $LOGFILE
            
            # Kill existing process if running
            if [ -f "$PID_FILE" ]; then
                kill $(cat $PID_FILE) 2>/dev/null || true
                rm -f $PID_FILE
            fi
            
            # Start server in background
            bash start-production.sh &
            echo $! > $PID_FILE
            
            echo "$(date): Server restarted with PID $(cat $PID_FILE)" >> $LOGFILE
        else
            echo "$(date): Server healthy" >> $LOGFILE
        fi
        
        sleep 30
    done
}

# Start monitoring
echo "$(date): Starting deployment monitoring..." >> $LOGFILE
monitor_server
