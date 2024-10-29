current_datetime=$(date +'%Y-%m-%d %H:%M:%S')
echo $current_datetime

git add .
git commit -m "$current_datetime"
git push origin main
