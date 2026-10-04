Set oWS = CreateObject("WScript.Shell")
sDesktop = oWS.SpecialFolders("Desktop")
Set oLink = oWS.CreateShortcut(sDesktop & "\نذاكر.lnk")
oLink.TargetPath = "C:\Users\shawk\Desktop\تشغيل نذاكر.bat"
oLink.WorkingDirectory = "C:\Users\shawk\Desktop\nezaker"
oLink.WindowStyle = 1
oLink.Description = "نذاكر - المنصة الطبية الذكية"
oLink.Save
