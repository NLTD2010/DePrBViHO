@echo off

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed. Downloading Python...
    curl -o python_installer.exe "https://www.python.org/ftp/python/3.11.5/python-3.11.5-amd64.exe"
    echo Installing Python...
    python_installer.exe /quiet InstallAllUsers=1 PrependPath=1
    del python_installer.exe
    set "PATH=%PATH%;%ProgramFiles%\Python311\Scripts\;%ProgramFiles%\Python311\"
)

REM Install required Python packages
for %%i in (fastapi transformers onnxruntime onnx numpy torch uvicorn) do (
    pip show %%i >nul 2>&1
    if %errorlevel% neq 0 (
        echo Installing %%i...
        pip install %%i
    ) else (
        echo %%i is already installed.
    )
)

REM Create a VBS script to run the server in the background
echo Set WshShell = CreateObject("WScript.Shell") > start_server.vbs
echo WshShell.Run "cmd /c python -m uvicorn main:app --host 127.0.0.1 --port 49385 --log-level info > server.log 2>&1", 0 >> start_server.vbs
echo Set WshShell = Nothing >> start_server.vbs

REM Start the server
echo Starting the server...
cscript //nologo start_server.vbs

REM Clean up the VBS script
del start_server.vbs

REM Notify the user
echo Server is running. Logs are being written to server.log.
