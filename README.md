# Amiga Blitz Basic 2 Language Support - Javascript Native Edition

This extension adds language support for the Amiga version of Blitz Basic 2 (and Amiblitz). The extension is in alpha state so syntax highlighting is still limited.


## Note

_This a forked version of this project (https://github.com/MickGyver/vscode-amiga-blitzbasic) in order to target a full native javascript extension with the no external tools as possible (except UAE)._

_It might be merge to the source extension soon : https://marketplace.visualstudio.com/items?itemName=mickgyver.amiga-blitzbasic2_

## Compatibility

All OS support VSCode and UAE(or a real Amiga).

## Getting Started

1. Please process to the [requirements](#requirements) to setup your UAE and Amiga OS.

2. Add a file with the extension **.bba** (Blitz Basic Ascii), it's where you will write your Blitz Basic code. 

3. Code enjoy the inline help and snippets.

4. Have your UAE and Amiga OS open.

5. When you do the shortcut to run on UAE (command - F5), it will :
   - write a **copy** of your file with the extension **.bb2** (so TED don't mess up your original .bba file),
   - copy all necessary files for Amiga OS,
   - launch AREXX script to launch TED/Blitz Basic 2 and then **compile and run** automatically your code.
   - sometimes it failed, just retry the shortcut, sometimes you need to reboot your Amiga OS.

6. Enjoy coding in Blitz Basic 2 in a modern way!

## Features

- Syntax highlighting.
- Snippets for most Blitz Basic 2 functions and methods.
- Outline shows macros, labels, functions and statements.
- Integrated help.
![contextual help](https://raw.githubusercontent.com/youenchene/vscode-amiga-blitzbasic/main/resources/images/help.jpg)
- Commands for running the app/game in WinUAE or FSUAE. (ony requires blitzbasic2.rexx and amiga os config in command line tools, see below).
![compil and run into UAE](https://raw.githubusercontent.com/youenchene/vscode-amiga-blitzbasic/main/resources/images/compil.jpg)
- Commands for running the app/game on a real Amiga (requires command line tools, see below).
- Settings to tune the integration to your UAE :
![Extension Settings](https://raw.githubusercontent.com/youenchene/vscode-amiga-blitzbasic/main/resources/images/settings.jpg)

## Requirements

You only need to configure your UAE and Amiga OS :

1. Ensure that AREXX is started with WorkBench. The line:

```
    SYS:System/RexxMast >NIL:
```

should exist in either S/startup-sequence or S/user-startup. If not, add it to the end of
user-startup.
   
2. In WinUae set serial port to TCP://0.0.0.0:1234 and select "Direct" below the drop down box (Settings
   / Host / IO ports). Save the WinUAE configuration and quit WinUAE, add the following to the
   configuration file manually (under the other lines concerning serial): serial_translate=crlf_cr
   
   (NOTE: You need to ensure that your firewall/antivirus allows network traffic for WinUAE.)
   
3. Create the file DEVS:MountList on the virtual harddrive with the following content (if it does not
   already exist)

```   
   AUX:
   Handler = L:Aux-Handler
   Stacksize = 1000
   Priority = 5
```

4. Add the following commands to the end of S:user-startup

```    
   mount aux:
   newshell aux:
```  

5. Add virtual hard disk pointing to the folders containing your code
 
This is the same folder that you added to your Visual Studio Code workspace.

By default, the folder is named **SharedCode** so the virtual  harddrive can be called as `SharedCode:` in Amiga OS.

6. Of Course Amiga OS (3.x) with Blitz Basic 2 installed.

## Known Issues

Syntax highlighting is still very limited.

One file code. (for the moment).

Run to Amiga is not implemented and tested yet in this version.

## Release Notes

## [0.3.2 ]
- Documentation

## [0.3.0 ]
- Extension Settings: shared folder volume name in AmigaOS.
- Extension Settings: UAE serial port for direct connection.
- blitzbasic2.rexx and BB2NagAway integrated in extension and copied automatically in AmigaOS.

### 0.2.0
- Integrated help documentation (Hover Mode) - No external tool dependencies.
- Launch bb2 compilation through arexx using native javascript - No external tool dependencies.

### 0.1.0

- Initial alpha release
