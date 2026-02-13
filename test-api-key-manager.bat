@echo off
echo ========================================
echo CogniGuide API Key Manager - Test Script
echo ========================================
echo.
echo This script will help you test the new API Key Manager functionality
echo.
echo Press any key to start the development server...
pause > nul

echo.
echo Starting development server...
echo.
npm run dev

echo.
echo ========================================
echo Test Checklist
echo ========================================
echo.
echo Please verify the following:
echo.
echo [1] Open the app and check for the key icon (🔑) in the top-right toolbar
echo [2] Click the key icon to open the API Key Manager
echo [3] Verify you can see existing API Keys (masked as sk-***)
echo [4] Click the eye icon to show/hide the full key
echo [5] Click "Edit" to modify an API Key
echo [6] Click "Delete" to remove an API Key (should show confirmation dialog)
echo [7] Click "管理" button in the yellow warning bar to open the manager
echo [8] Check the "API Key 管理" button at the bottom of the sidebar
echo [9] Test clearing all API Keys (should show confirmation dialog)
echo [10] Refresh the page and verify changes persist
echo.
echo ========================================
echo.
echo If all tests pass, the fix is working correctly!
echo.
pause
