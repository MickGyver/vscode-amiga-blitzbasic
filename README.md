# Amiga Blitz Basic 2 Language Support - Javascript Native Edition

This extension adds language support for the Amiga version of Blitz Basic 2 (and Amiblitz) with limited syntax highlighting support. Big thanks to Youen Chéné who has made a lot of improvements to this extension!

## TL;DR

**!! NEW KEY BINDINGS !!**

To open and run your current Blitz Basic 2 source file (.bba) on UAE, use the shortcut `Ctrl-F6` (Win, Linux) or `Cmd-F6`(Mac).

To open the Blitz Basic 2 source files (.bba) in your current folder, use the shortcut `Ctrl-F7` (Win, Linux) or `Cmd-F7`(Mac).

To open the Blitz Basic 2 source files (.bba) in your current folder AND run them on UAE, use the shortcut `Ctrl-F8` (Win, Linux) or `Cmd-F8`(Mac).

To package an ADF, use the shortcut `Ctrl-F4` (Win, Linux) or `Cmd-F4`(Mac). You need to manually create an executable in Blitz Basic 2 before using this feature.

To package an ISO for CTDV or CD32, use the shortcut `Ctrl-F3` (Win, Linux) or `Cmd-F3`(Mac). You need to manually create an executable in Blitz Basic 2 before using this feature.

To package a ZIP archive for HD Install, use the shortcut `Ctrl-F2` (Win, Linux) or `Cmd-F2`(Mac). You need to manually create an executable in Blitz Basic 2 before using this feature.

The feature "Run on real Amiga" is deactivated for the time being (the feature needs testing).

## Note

This version now includes the native javascript improvements by Youen Chéné, so no external tools are needed now, except for UAE of course.

## Compatibility

All operating systems that can run both VS Code and UAE.

## Getting Started

1. Please process to the [requirements](#requirements) to setup UAE and Amiga OS.

2. Add a source file with the extension **.bba** (Blitz Basic Ascii), it's where you will write your Blitz Basic code. 

3. Code and enjoy the inline help and snippets.

4. Have UAE and Amiga OS open.

5. When you execture the shortcut to run on UAE (`Cmd - F6`or `Ctrl - F6`), VS Code will :
   - write a **copy** of your file with the extension **.bb2** (so TED don't mess up your original .bba file)
   - copy all necessary files for Amiga OS,
   - launch the AREXX script to launch TED/Blitz Basic 2 and then **compile and run** your code automatically.
   - sometimes the process can fail, just retry the shortcut, sometimes you need to reboot your Amiga OS.

6. Enjoy coding in Blitz Basic 2 in a modern way!

7. Once you've generate an executable, you can now add a `packaging.json` file and hit `Cmd - F3`or `Ctrl - F3` to generate an ADF. The ADF is generated and available in the build folder.

## Features

### - Syntax highlighting.
### - Snippets for most Blitz Basic 2 functions and methods.
### - Outline shows macros, labels, functions and statements.
### - Integrated help.

![contextual help](https://raw.githubusercontent.com/MickGyver/vscode-amiga-blitzbasic/main/resources/images/help.jpg)

### - Commands for running the app/game in WinUAE or FSUAE. (ony requires blitzbasic2.rexx and amiga os config in command line tools, see below).

![compil and run into UAE](https://raw.githubusercontent.com/MickGyver/vscode-amiga-blitzbasic/main/resources/images/compil.jpg)

### - Commands for running the app/game on a real Amiga (requires command line tools, see below).
### - Settings to tune the integration of your UAE installation:

![Extension Settings](https://raw.githubusercontent.com/MickGyver/vscode-amiga-blitzbasic/main/resources/images/settings.jpg)

### - Outline View and `Go to Symbol` (Cmd/Ctrl + Shift + O) integration.

![Outline](https://raw.githubusercontent.com/MickGyver/vscode-amiga-blitzbasic/main/resources/images/outline.jpg)

![GoToSymbol](https://raw.githubusercontent.com/MickGyver/vscode-amiga-blitzbasic/main/resources/images/gotosymbol.jpg)

### - Generate ADF from a `packaging.json` file created at the root folder of your project using  `Ctrl-F4` (Win, Linux) or `Cmd-F4`(Mac) :

```json
{
    "supports": [
        {
            "type": "adf",
            "boot": true,
            "supportName": "Blower",
            "exeToLaunch": "blower.exe",
            "includeDiskFontLibrary": true,
            "includeMathTransLibrary": false,
            "filesToIncludeOnRoot": [
                "blower.exe",
                "blower.exe.info"
            ],
            "foldersToInclude": [
                "assets"
            ]
        }
    ]
}
```

Each support entry (multi disk and multi support) support the following parameters (all mandatory) :

`type` : `adf`

`boot` : `true` to create a bootable disk (first disk of the game/app), `false` for any other disk.

`supportName`: name of your adf, floppy, cdrom. It's the name that will be shown by Workbench. Choose a different name for each support entry of the config file.

`exeToLaunch`: the exe to launch in startup sequence.

`includeDiskFontLibrary`: for bootable support, `true` if you do disk access in your software.

`includeMathTransLibrary`: for bootable support, `true` if you do advanced mathematical as sinus or cosinus.

`filesToIncludeOnRoot`: list all the files to include on the root folder of the support, typically your executable and .info files.

`filesToIncludeOnRoot`: list all the folders to include on the root folder of the support, typically your assets. All sub-folders are included automatically.


**At the end of the process, your ADF file is available in the build folder**.

### - [Experimental] Generate ISO for CDTV and CD32 from a `packaging.json` file created at the root folder of your project using  `Ctrl-F3` (Win, Linux) or `Cmd-F3`(Mac) :

Before you start you need extra files that are under copyright from the CDTV and CD32 Commodore Developer Kit (dig into google and eababime.net forums) :

- CDTV.TM file (from CDTV and CD32 dev kit)
- CD32.TM file (from CD32 dev kit)
- RMTM executable file (from CDTV dev kit)
- isocd executable file (from CD32 dev kit)

You need to enter the path of these files into the extension settings :

![Extension Settings for ISO packaging](https://raw.githubusercontent.com/MickGyver/vscode-amiga-blitzbasic/main/resources/images/iso-settings.jpg)

```json
{
    "supports": [
        {
            "type": "cdtv",
            "boot": true,
            "supportName": "Blower",
            "supportVolumeSet": "",
            "supportPublisher": "Micrix Production",
            "supportPreparer": "",
            "supportApplication": "",
            "exeToLaunch": "blower.exe",
            "includeDiskFontLibrary": true,
            "includeMathTransLibrary": false,
            "filesToIncludeOnRoot": [
                "blower.exe",
                "blower.exe.info"
            ],
            "foldersToInclude": [
                "assets"
            ]
        },
        {
            "type": "cd32",
            "boot": true,
            "supportName": "Blower_CD32",
            "supportVolumeSet": "",
            "supportPublisher": "Micrix Production",
            "supportPreparer": "",
            "supportApplication": "",
            "exeToLaunch": "blower.exe",
            "includeDiskFontLibrary": true,
            "includeMathTransLibrary": false,
            "filesToIncludeOnRoot": [
                "blower.exe",
                "blower.exe.info"
            ],
            "foldersToInclude": [
                "assets"
            ]
        }
    ]
}
```

`supportVolumeSet`: (optional) Identifier of the volume set of which this volume is a member.

`supportPublisher`: (optional) The volume publisher

`supportPreparer`: (optional) The identifier of the person(s) who prepared the data for this volume. 

`supportApplication`: (optional) Identifies how the data are recorded on this volume. 

More information on https://wiki.osdev.org/ISO_9660

The iso packaging works this way :

- it first prepares a folder for the iso
- it then generates and copies the ISO Layout for isocd
- it launches the isocd command line in UAE and then closes isocd
- your iso will be available in the build folder

[Quick demonstration](https://www.youtube.com/watch?v=0EuKqFit3tg)

### - Generate a ZIP archive for Hard Disk Installation from a `packaging.json` file created at the root folder of your project using  `Ctrl-F2` (Win, Linux) or `Cmd-F2`(Mac) :

```json
{
    "supports": [
        {
            "type": "zip",
            "supportName": "Blower_HD",
            "folderIcon": "Blower_HD.info",
            "exeToLaunch": "blower.exe",
            "filesToIncludeOnRoot": [
                "blower.exe",
                "blower.exe.info"
            ],
            "foldersToInclude": [
                "assets"
            ]
        }
    ]
}
```

Each support entry (multi disk and multi support) support the following parameters (all mandatory) :

`folderIcon`: icon path (.info) for the containing folder inside the zip file. The folder of your game in your hard disk will appear with this icon.

**At the end of the process, your ZIP archiveis available in the build folder**.

## Requirements

You only need to configure UAE and Amiga OS:

1. Install Amiga OS (3.x) and Blitz Basic 2 if you haven't already done so.

1. Ensure that AREXX is started with WorkBench. The line:

    ```
    SYS:System/RexxMast >NIL:
    ```

    should exist in either S/startup-sequence or S/user-startup. If not, add it to the end of
    user-startup.
   
2. In WinUae set serial port to TCP://0.0.0.0:1234 and select "Direct" below the drop down box (Settings
    / Host / IO ports). Deselect any other options for the serial port. Save the WinUAE configuration and
    quit WinUAE, open the configuration file in a text editor and add the following to the configuration
    file manually (under the other lines concerning serial):

    serial_translate=crlf_cr
   
    NOTE: You need to ensure that your firewall/antivirus allows network traffic for WinUAE.
   
4. Create the file DEVS:MountList on the virtual harddrive with the following content (if it does not
    already exist)

    ```   
    AUX:
    Handler = L:Aux-Handler
    Stacksize = 1000
    Priority = 5
    ```

5. Add the following commands to the end of S:user-startup

    ```    
    mount aux:
    newshell aux:
    ```  

6. Add a virtual hard disk pointing to the folder containing your Blitz Basic 2 projects (this folder can have sub folders with code).
 
    This same folder must be your Visual Studio Code workspace folder.

    The device name and volume label of the virtual harddrive must match the "Shared Folder" setting for this extension. By default,
    the folder is named **SharedCode** but you can change this in the settings for the extension (on user or workspace level). 

## Known Issues

Syntax highlighting is limited.

Run on real Amiga is not implemented and tested yet in this version.

Random couldn't open file error on Ted/Blitz2. (try an older version of UAE, personally I had these errors in WinUAE 6.0 but 4.4 works perfectly).


## To contact the contributors

[@MickGyver](https://twitter.com/MickGyver)

[@youen_chene](https://twitter.com/youen_chene)

## Release Notes
## 0.9.1
- Fixes for windows compatibility
## 0.9.0
- Zip packaging for HD Installation'
## 0.8.0
- [Experimental] CDTV and CD32 Packaging
- Fix to avoid cannot Open File in BB2 Editor.
## 0.7.0
- ADF Packaging
## 0.6.0
- Blitz Basic 2 Label, NewType, Statement, Function and Macro are now showing up in the Outline view and Go to Symbol..
## 0.5.0
- New keybindings
## 0.4.0
- Manage projet with multiple .bba files and includes.
## 0.3.3
- Save document on run UAE.
## 0.3.2
- Documentation
## 0.3.0
- Extension Settings: shared folder volume name in AmigaOS.
- Extension Settings: UAE serial port for direct connection.
- blitzbasic2.rexx and BB2NagAway integrated in extension and copied automatically in AmigaOS.
### 0.2.0
- Integrated help documentation (Hover Mode) - No external tool dependencies.
- Launch bb2 compilation through arexx using native javascript - No external tool dependencies.
### 0.1.0
- Initial alpha release
