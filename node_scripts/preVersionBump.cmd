set /p commitMessage="Commit Message (before version bumping): "
git add .
git commit -m "%commitMessage%"
