# Zipperoo Frontend Server Startup Script
# This script automatically frees port 2004 and starts the development server

# Function to check if a process is running
function Test-ProcessExists {
    param($ProcessName)
    return Get-Process $ProcessName -ErrorAction SilentlyContinue
}

# Function to stop process by PID
function Stop-ProcessByPID {
    param($ProcessID)
    try {
        $process = Get-Process -Id $ProcessID -ErrorAction Stop
        Write-Host ("Stopping process: " + $process.ProcessName + " (PID: " + $ProcessID + ")") -ForegroundColor Yellow
        Stop-Process -Id $ProcessID -Force
        Write-Host "Process terminated successfully" -ForegroundColor Green
        return $true
    }
    catch {
        $errorMessage = $_.Exception.Message
        Write-Host ("Failed to stop process " + $ProcessID + ": " + $errorMessage) -ForegroundColor Red
        return $false
    }
}

# Check if port 2004 is in use
Write-Host "Checking if port 2004 is in use..." -ForegroundColor Cyan
$portInUse = netstat -ano | Select-String ":3000.*LISTENING"

if ($portInUse) {
    Write-Host "Port 3000 is in use. Attempting to free the port..." -ForegroundColor Yellow
    
    # Extract PID from netstat output
    $processIds = $portInUse | ForEach-Object {
        ($_ -split '\s+')[-1]
    } | Sort-Object -Unique
    
    $success = $false
    foreach ($processId in $processIds) {
        if ($processId -and $processId -ne "0") {
            $success = Stop-ProcessByPID $processId
        }
    }
    
    if (-not $success) {
        Write-Host "Warning: Could not free port 3000. The server might not start correctly." -ForegroundColor Red
    }
    
    # Wait for the port to be released
    Write-Host "Waiting for port to be released..." -ForegroundColor Cyan
    Start-Sleep -Seconds 3
} else {
    Write-Host "Port 3000 is available" -ForegroundColor Green
}

# Kill any existing node processes that might interfere (optional)
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Found existing Node.js processes. Terminating..." -ForegroundColor Yellow
    $nodeProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
}

# Start the development server
Write-Host "Starting Zipperoo frontend server..." -ForegroundColor Green
Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Cyan

try {
    # Use npm start since that's what we have in package.json
    npm start
}
catch {
    $errorMessage = $_.Exception.Message
    Write-Host ("Failed to start the development server: " + $errorMessage) -ForegroundColor Red
    Write-Host "Please try running 'npm start' manually." -ForegroundColor Yellow
    exit 1
} 