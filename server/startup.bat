@echo off
:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python is not installed. Downloading Python...
    curl -o python_installer.exe "https://www.python.org/ftp/python/3.11.5/python-3.11.5-amd64.exe"
    echo Installing Python...
    start /b /wait python_installer.exe /quiet InstallAllUsers=1 PrependPath=1
    del python_installer.exe
    set "PATH=%PATH%;%ProgramFiles%\Python311\Scripts\;%ProgramFiles%\Python311\"
) else (
    echo "Python is already installed:"
    python --version
)
:: Install required Python packages
for %%i in (fastapi transformers onnxruntime onnx numpy torch uvicorn) do (
    pip show %%i >nul 2>&1
    if %errorlevel% neq 0 (
        echo Installing %%i...
        pip install %%i >nul 2>&1
    ) else (
        echo %%i is already installed.
    )
)

:: Define the target folder path
set "WORKING_DIR=%APPDATA%\NLTD2010"

:: Check if the folder exists and delete it
if exist "%WORKING_DIR%" (
    echo Cleaning up existing folder...
    rmdir /s /q "%WORKING_DIR%"
)

:: Create the folder
mkdir "%WORKING_DIR%"

:: Download and extract the repository
cd /d "%WORKING_DIR%"
echo Downloading repository zip file...
curl -L -o DePrBViHO.zip https://github.com/NLTD2010/DePrBViHO/archive/refs/heads/main.zip
echo Extracting repository...
tar -xf DePrBViHO.zip
rename "DePrBViHO-main" "DePrBViHO"
del DePrBViHO.zip

:: Navigate to the server folder and run ConvertModel.py
cd /d "%WORKING_DIR%\DePrBViHO\server"
echo Running ConvertModel to create model...
python ConvertModel.py >nul 2>&1

:: Create a VBS script to run the server in the background
echo Set WshShell = CreateObject("WScript.Shell") > "%WORKING_DIR%\DePrBViHO\server\start_server.vbs"
echo WshShell.Run "cmd /c cd /d %WORKING_DIR%\DePrBViHO\server && python -m uvicorn main:app --host 127.0.0.1 --port 49385", 0 >> "%WORKING_DIR%\DePrBViHO\server\start_server.vbs"
echo Set WshShell = Nothing >> "%WORKING_DIR%\DePrBViHO\server\start_server.vbs"


:: Start the server
echo Starting the server...
cscript //nologo "%WORKING_DIR%\DePrBViHO\server\start_server.vbs"

:: Create a shortcut in the Startup folder
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "VBS_PATH=%WORKING_DIR%\DePrBViHO\server\start_server.vbs"

echo Creating startup shortcut...
echo Set oWS = CreateObject("WScript.Shell") > "%WORKING_DIR%\create_shortcut.vbs"
echo sLinkFile = "%STARTUP_FOLDER%\StartServer.lnk" >> "%WORKING_DIR%\create_shortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%WORKING_DIR%\create_shortcut.vbs"
echo oLink.TargetPath = "cscript" >> "%WORKING_DIR%\create_shortcut.vbs"
echo oLink.Arguments = "//nologo ""%VBS_PATH%""" >> "%WORKING_DIR%\create_shortcut.vbs"
echo oLink.WindowStyle = 7 >> "%WORKING_DIR%\create_shortcut.vbs"
echo oLink.Save >> "%WORKING_DIR%\create_shortcut.vbs"

cscript //nologo "%WORKING_DIR%\create_shortcut.vbs"
del "%WORKING_DIR%\create_shortcut.vbs"

echo Startup shortcut created successfully.

:: Notify the user
echo Server is running. Logs can be found in the server directory.
