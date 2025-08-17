# Change Log

All notable changes to the "amiga-blitzbasic2" extension will be documented in this file.
## [0.11.0 ] - 2025-08-18
- Build tools for Amiga OS needs to be copied (once per shared folder / Blitz type) using a command (Ctrl/Cmd+Shift+P) instead of automatically being copied at every build process.
- Option to set compiler options automatically as part of the build process (BB2).
- UAE is brought to focus at compile/run (some actions are needed to get this to work on Linux). This implementation is based on amishell.
- Fixed some bugs that could cause the 'outline' and 'go to symbol' functions to fail.
- The line 'serial_translate=crlf_cr' in the WinUAE configuration file should not be needed any more, but it being there doesn't hurt.
- Node.js dependencies updated to remove vulnerabilities.
- Extension settings are now grouped.
## [0.10.0 ] - 2025-08-12
- [Experimental] AmiBlitz 3.x support (through ARexx, command line support might be added later)
- Fixed bug that broke commands in version 0.9.5
## [0.9.5 ] - 2025-08-08
- Option to launch UAE automatically. You need to give a full command line for launching UAE in the extension settings. See the readme for details. 
## [0.9.1 ] - 2023-04-23
- Fixes for windows compatibility
## [0.9.0 ] - 2022-10-21
- Zip packaging for HD Installation
## [0.8.0 ] - 2022-10-21
- [Experimental] CDTV and CD32 Packaging
- Fix to avoid cannot Open File in BB2 Editor.
## [0.7.0 ] - 2022-08-31
- ADF Packaging
## [0.6.0 ] - 2022-08-21
- Blitz Basic 2 Label, NewType, Statement, Function and Macro are now showing up in the Outline view and Go to Symbol..
## [0.5.0 ] - 2022-08-12
- New keybindings
## [0.4.0 ] - 2022-07-27
- Manage projet with multiple .bba files and includes.
## [0.3.3 ] - 2022-07-27
- Save document on run UAE.
## [0.3.2 ] - 2022-07-25
- Documentation.
## [0.3.0 ] - 2022-07-24
- Extension Settings: shared folder volume name in AmigaOS.
- Extension Settings: UAE serial port for direct connection.
- blitzbasic2.rexx and BB2NagAway integrated in extension and copied automatically in AmigaOS.
## [0.2.0 ] - 2022-07-23
- Integrated documentation (Hover Mode) - No external tool dependencies.
- Launch bb2 compilation through arexx using native javascript - No external tool dependencies.
## [0.1.0 ] - 2021-02-20
- Initial alpha release