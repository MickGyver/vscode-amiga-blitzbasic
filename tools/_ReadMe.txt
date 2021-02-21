--------------------------------------------------------------------------------------------------------
$$$$$$$\  $$\ $$\   $$\                     $$$$$$$\                      $$\                  $$$$$$\  
$$  __$$\ $$ |\__|  $$ |                    $$  __$$\                     \__|                $$  __$$\ 
$$ |  $$ |$$ |$$\ $$$$$$\   $$$$$$$$\       $$ |  $$ | $$$$$$\   $$$$$$$\ $$\  $$$$$$$\       \__/  $$ |
$$$$$$$\ |$$ |$$ |\_$$  _|  \____$$  |      $$$$$$$\ | \____$$\ $$  _____|$$ |$$  _____|       $$$$$$  |
$$  __$$\ $$ |$$ |  $$ |      $$$$ _/       $$  __$$\  $$$$$$$ |\$$$$$$\  $$ |$$ /            $$  ____/ 
$$ |  $$ |$$ |$$ |  $$ |$$\  $$  _/         $$ |  $$ |$$  __$$ | \____$$\ $$ |$$ |            $$ |      
$$$$$$$  |$$ |$$ |  \$$$$  |$$$$$$$$\       $$$$$$$  |\$$$$$$$ |$$$$$$$  |$$ |\$$$$$$$\       $$$$$$$$\ 
\_______/ \__|\__|   \____/ \________|      \_______/  \_______|\_______/ \__| \_______|      \________|

                                 ** For Visual Studio Code! **
--------------------------------------------------------------------------------------------------------

Below are the steps needed to set up a convenient environment for developing games and programs for the
Amiga with Blitz Basic 2. These instructions are written for Windows and WinUAE (or real Amiga) but a
similar setup can also be achieved on Linux and OS X. What you will get:

- Syntax highlighting for Blitz Basic 2 source files.
- Snippets with auto completion for a lot of the Blitz Basic 2 commands.
- An automated build/run process using WinUAE or real Amiga.
- Easy source navigation with a working outline that lists functions, statements, macros, labels and
  todo/fixme/hack comments. 
- Comment / uncomment multiple lines at once.
- Code folding.
- Minimap of source files.
- Themes (all VS Code themes work for the BB2 source files).
- Plus a lot of other conveniences a modern text editor brings.


--------------------------------------------------------------------------------------------------------
Prerequisites
--------------------------------------------------------------------------------------------------------
I assume you have an installation of WinUAE and have setup a virtual harddrive with Workbench 3.0/3.1
and Blitz Basic 2. You can get my recently fixed version of the Ultimate Blitz Basic 2.1+ CD that
installs BB2, the support suite, new command set and some extra libraries. You will find that one here:
http://eab.abime.net/showthread.php?t=98664


--------------------------------------------------------------------------------------------------------
STEP ONE: Installing Visual Studio Code
--------------------------------------------------------------------------------------------------------

Visual Stuido Code is free and can be found here: https://code.visualstudio.com/. 
There is not much to say about actually installing it, however, there are is one optional package you
install if you want file icons to show, that is: vscode-icons, you can search for it in the marketplace
in VS Code.


--------------------------------------------------------------------------------------------------------
STEP TWO: Installing the Blitz Basic 2 language definition
--------------------------------------------------------------------------------------------------------
You just need to search for 'blitz' in the VS Code marketplace (View / Extensions) and the 'Amiga Blitz
Basic 2' extension should show up. Click install.

To enable the HELP function that shows info for methods and functions built into Blitz Basic 2, copy the
files 'BB2Doc.exe' and 'bb2doc.xml' to the Windows folder (or somewhere else in the PATH).


--------------------------------------------------------------------------------------------------------
STEP THREE: Setting up build automation
--------------------------------------------------------------------------------------------------------
1. Ensure that AREXX is started with WorkBench. The line:

   SYS:System/RexxMast >NIL:
   
   should exist in either S/startup-sequence or S/user-startup. If not, add it to the end of
   user-startup.
   
2. In WinUae set serial port to TCP://0.0.0.0:1234 and select "Direct" below the drop down box (Settings
   / Host / IO ports). Save the WinUAE configuration and quit WinUAE, add the following to the
   configuration file manually (under the other lines concerning serial): serial_translate=crlf_cr
   
   (NOTE: You need to ensure that your firewall/antivirus allows network traffic for WinUAE.)
   
3. Create the file DEVS:MountList on the virtual harddrive with the following content (if it does not
   already exist)
       
   AUX:
   Handler = L:Aux-Handler
   Stacksize = 1000
   Priority = 5

4. Add the following commands to the end of S:user-startup
       
   mount aux:
   newshell aux:
   
5. Copy the file 'blitzbasic2.rexx' to the 'S' folder of the virtual Amiga harddrive. The path to the
   Blitz Basic 2 executable in the arexx script is 'Blitz2:Blitz2', change it if needed (shouldn't be
   necessary).

6. Copy the file 'BB2NagAway' to the 'C' folder of the virtual Amiga hardrive.

7. Copy the files 'BringToFront.exe', 'ConvertEOL.exe' and 'WinUAEArexx.exe' to the 'Windows'
   (%SystemRoot%) folder. If you already have any of these tools, replace them, because at least
   BringToFront.exe has been updated.

   (NOTE: You need to ensure that your firewall/antivirus allows network traffic for WinUAEArexx.exe.)


--------------------------------------------------------------------------------------------------------
STEP FOUR: Setting up a project
--------------------------------------------------------------------------------------------------------
1. On Windows, create a folder for your project and in that folder create a new text file. Name the file
   'projectname_asc.bb2'. (You need to include the _asc suffix because the source files will be copied 
   to filenames without that suffix in the build process.) You can create any number of .bb2 source
   files in this folder.
   
2. Copy the file 'run.bat' and/or 'run_amiga.bat' to the folder created above and edit it according to
   your project and environment, notes are included in the .bat files.
   
3. Open the project folder in VS Code and you should now be able to code away. Pressing CTRL+F1 should
   show help for the keyword at the cursor and pressing CTRL+F5 should start Blitz Basic 2 in WinUAE and
	 build the project (CTRL+F6 to build on a real Amiga). You can edit the compiler settings from SuperTED
	 in WinUAE or on the Amiga, when you save the file, the tokenized version will be overwritten, so you
	 still have your _asc.bb2 files intact.
   
   
--------------------------------------------------------------------------------------------------------
STEP FIVE: Optional tweaks
--------------------------------------------------------------------------------------------------------
1. If you installed the vscode-icons package, you can change the icon for .bb2 files to your liking. For
   a Blitz Basic icon, add the following to your settings.json file, by going to Preferences / Settings.
	 Write 'vsicons.associations.files' (without the quotes) in the search field and click 'edit in
	 settings.json' below. Edit the entry to look like this:

   "vsicons.associations.files": [
    {
      "icon": "blitzbasic",
      "extensions": ["bb", "bb2"],
      "languages": ["languages.blitzbasic", "languages.abb2"],
      "format": "FileFormat.svg",
    }
   ]

   (Ids for available icons can be found here: https://github.com/vscode-icons/vscode-icons/wiki/ListOfFiles)
   
  
--------------------------------------------------------------------------------------------------------
CHANGELOG
--------------------------------------------------------------------------------------------------------

Version 0.1.0
- Initial alpha release







