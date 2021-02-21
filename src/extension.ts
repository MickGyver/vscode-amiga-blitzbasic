// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "Amiga Blitz Basic 2" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let runwinuae = vscode.commands.registerCommand('amiga-blitzbasic2.runwinuae', () => {
        let path = getPath();
        if(path.length > 0)
        {
            vscode.window.showInformationMessage('Running in WinUAE...');
            const editor = vscode.window.activeTextEditor;
            const terminal = vscode.window.createTerminal(`Ext Terminal`);
            terminal.show();
            terminal.sendText(path+"run.bat");
        }
	});
	context.subscriptions.push(runwinuae);

    let runamiga = vscode.commands.registerCommand('amiga-blitzbasic2.runamiga', () => {
        let path = getPath();
        if(path.length > 0)
        {
            vscode.window.showInformationMessage('Running on Amiga...');
            const editor = vscode.window.activeTextEditor;
            const terminal = vscode.window.createTerminal(`Ext Terminal`);
            terminal.show();
            terminal.sendText(getPath()+"run_amiga.bat");
        }
	});
	context.subscriptions.push(runamiga);

    let showhelp = vscode.commands.registerCommand('amiga-blitzbasic2.showhelp', () => {
        const editor = vscode.window.activeTextEditor;
        const terminal = vscode.window.createTerminal(`Ext Terminal`);
        if(editor === undefined)
        {
            vscode.window.showInformationMessage("Nothing to show help for...");
        }
        else
        {
            let cursorPosition = editor.selection.start;
            let wordRange = editor.document.getWordRangeAtPosition(cursorPosition);
            let highlight = editor.document.getText(wordRange);

            if(wordRange?.isSingleLine && highlight.length > 0 )
            {
                terminal.show();
                terminal.sendText("BB2Doc " + highlight);
            }
            else
                vscode.window.showInformationMessage("Nothing to show help for...");
        }    
	});
	context.subscriptions.push(runamiga);

	context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            {scheme: "file", language: "abb2"}, 
            new ABB2DocumentSymbolProvider()
        )
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}

function getPath() : string {
    let path: string;
    if (!vscode.workspace.workspaceFolders) {
        if(vscode.workspace.rootPath === undefined) {
            if(vscode.window.activeTextEditor === undefined)
            {
                path = "";
            }
            else
            {
                path = vscode.window.activeTextEditor.document.uri.fsPath;
                path = path.substring(0,path.lastIndexOf("\\")+1);
            }          
        }
        else
            path = vscode.workspace.rootPath;
    } else {
        let root: vscode.WorkspaceFolder;
        root = vscode.workspace.workspaceFolders[0];
        path = root.uri.fsPath;
    }
    if(!path.endsWith("\\") && path.length > 0)
        path += "\\";

    return path;
}

class ABB2DocumentSymbolProvider implements vscode.DocumentSymbolProvider {

    /*private format(cmd: string):string{
        return cmd.substr(1).toLowerCase().replace(/^\w/, c => c.toUpperCase())
    }*/

    public provideDocumentSymbols(
        document: vscode.TextDocument,
        token: vscode.CancellationToken): Promise<vscode.DocumentSymbol[]> 
        {
        return new Promise((resolve, reject) => 
        {
            let symbols: vscode.DocumentSymbol[] = [];
            let nodes = [symbols]

            for (var i = 0; i < document.lineCount; i++) {
                var line = document.lineAt(i);

                let tokens = line.text.split(" ")

				if(line.text.endsWith(":"))
				{
					let marker_symbol = new vscode.DocumentSymbol(
                        tokens[0].substring(0,tokens[0].length-1),
                        '',
                        vscode.SymbolKind.Enum,
                        line.range, line.range)


                    nodes[nodes.length-1].push(marker_symbol)
				}
				else if(line.text.startsWith("."))
				{
					let marker_symbol = new vscode.DocumentSymbol(
                        tokens[0].substring(1,tokens[0].length),
                        '',
                        vscode.SymbolKind.Enum,
                        line.range, line.range)


                    nodes[nodes.length-1].push(marker_symbol)
				}
				else if(line.text.startsWith("Function"))
				{
					var text = line.text.replace(/\s\s+/g, ' ');
					var index = text.indexOf( ' ', text.indexOf( ' ' ) + 1 );

					let marker_symbol = new vscode.DocumentSymbol(
                        text.substring(index+1),
                        '',
                        vscode.SymbolKind.Function,
                        line.range, line.range)


                    nodes[nodes.length-1].push(marker_symbol)
				}
				else if(line.text.startsWith("Statement"))
				{
					var text = line.text.replace(/\s\s+/g, ' ');
					var index = text.indexOf(' ');

					let marker_symbol = new vscode.DocumentSymbol(
                        text.substring(index+1),
                        '',
                        vscode.SymbolKind.Method,
                        line.range, line.range)


                    nodes[nodes.length-1].push(marker_symbol)
				}
				else if(line.text.startsWith("Macro"))
				{
					var text = line.text.replace(/\s\s+/g, ' ');
					var index = text.indexOf(' ');

					let marker_symbol = new vscode.DocumentSymbol(
                        text.substring(index+1),
                        '',
                        vscode.SymbolKind.Key,
                        line.range, line.range)


                    nodes[nodes.length-1].push(marker_symbol)
				}
            }
            resolve(symbols);
        });
    }
}
