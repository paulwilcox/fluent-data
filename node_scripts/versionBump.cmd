set /p commitMessage="Commit Message (before version bumping): "
git commit -m "%commitMessage%"
node npm_scripts versionBump.js