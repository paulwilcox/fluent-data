for %%I in (.) do set StartDirName=%%~nxI
echo %StartDirName%
if %StartDirName%==lish start node example/server.js
if %StartDirName%==example start node server.js
explorer "http:\\localhost:3000"
