# Amiga Blitz Basic 2 Language Support

This extension adds language support for the Amiga version of Blitz Basic 2 (and Amiblitz). The extension is in alpha state so syntax highlighting is still limited.

_This a test version in order to target a full native javascript extension with the less external tools as possible._

_It might be merge to the source extension soon : https://marketplace.visualstudio.com/items?itemName=mickgyver.amiga-blitzbasic2_

## Features

- Syntax highlighting.
- Snippets for most Blitz Basic 2 functions and methods.
- Outline shows macros, labels, functions and statements.
- Integrated help.
- Commands for running the app/game in WinUAE or FSUAE. (ony requires blitzbasic2.rexx and amiga os config in command line tools, see below).
- Commands for running the app/game on a real Amiga (requires command line tools, see below).

## Requirements

A few command line tools and batch files are needed to enable all the features, you can download them here: https://github.com/MickGyver/vscode-amiga-blitzbasic/blob/main/tools/vscode-amiga-blitzbasic2-tools.zip

Code must be within a **SharedCode** folder mount as virtual harddrive `SharedCode:` in UAE and Amiga OS.

## Known Issues

Syntax highlighting is still very limited.

## Release Notes

### 0.2.0
- Integrated help documentation (Hover Mode) - No external tool dependencies.
![contextual help](https://raw.githubusercontent.com/youenchene/vscode-amiga-blitzbasic/publishing/resources/images/help.jpg)

- Launch bb2 compilation through arexx using native javascript - No external tool dependencies.
![compil and run in UAE](https://raw.githubusercontent.com/youenchene/vscode-amiga-blitzbasic/publishing/resources/images/compil.jpg)

### 0.1.0

- Initial alpha release
