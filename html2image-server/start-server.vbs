Set WshShell = CreateObject("WScript.Shell")
' 获取脚本所在目录
scriptPath = WScript.ScriptFullName
scriptDir = Left(scriptPath, InStrRev(scriptPath, "\"))
' 切换到脚本目录并启动服务
WshShell.CurrentDirectory = scriptDir
WshShell.Run "node server.js", 0, False