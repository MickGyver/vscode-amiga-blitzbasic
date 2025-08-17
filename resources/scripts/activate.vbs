' Activates (brings window to front) the first of the specified applications.
' We need to be able to specify several .exe files because there are several versions of Winuae.
' %1 %2 ... : names (including the .exe extension) of the applications to activate

On Error Resume Next
Activate

Sub Activate
	q = Chr(34)
	Set shell = WScript.CreateObject("WScript.Shell")
	Set args = WScript.Arguments
	For a = 0 To WScript.Arguments.Count - 1
		app = args(a)
		cmd = "tasklist /fo csv /fi " + q + "imagename eq " + app + q
		output = shell.Exec(cmd).StdOut.ReadAll()
		lines = Split(output, vbNewLine)
		If UBound(lines) > 1 then
			cols = Split(lines(1), q + "," + q)
			pid = CInt(cols(1))
			shell.AppActivate pid
			Exit sub
		End if
	Next
End Sub
