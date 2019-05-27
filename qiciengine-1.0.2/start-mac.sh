#! /bin/bash
filepath=$(cd "$(dirname "$0")"; pwd)
node $filepath/editorservice/StartService.js

echo "编辑器启动成功，将会自动打开浏览器"