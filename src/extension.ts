// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as xml2js from 'xml2js';
var path = require("path");



const BB2_MODE: vscode.DocumentFilter = { language: 'abb2', scheme: 'file' };

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated

    
    console.log("Loading Blitz Basic 2 documentation...");
    let xml=fs.readFileSync(context.extensionPath+'/resources/bb2doc.xml','utf8');
    let bb2doc: {[key: string]: any}=[];
    xml2js.parseString(xml, function (err, result) {
        if (result != undefined) {
            result.bb2doc.command.forEach((val:any) => {
                bb2doc[val.$.name.toString()]=val;
            });
            vscode.window.showInformationMessage('Blitz Basic 2 documentation Loaded');
        }
      });



	console.log('Congratulations, your extension "Amiga Blitz Basic 2" is now active!');


    vscode.languages.registerHoverProvider('abb2', {
        provideHover(document, position, token) {

            const range = document.getWordRangeAtPosition(position);
            const word = document.getText(range);

            if (bb2doc != undefined) {
                let command=bb2doc[word];
                if (command != undefined) {
                   
                    const mds = new vscode.MarkdownString();
                    mds.appendMarkdown('<span style="color:#5471C9;">'+ command.keyword.toString()+ '<span>');
                    if (command.parameters.toString().substring(0,2) != '\r\n') {
                        mds.appendMarkdown(' <span style="color:#9E622C;">'+command.parameters.toString()+'<span>');
                    }
                    mds.appendMarkdown('\n\n');
                    mds.appendMarkdown(command.longDescription.toString());
                    mds.isTrusted = true;
                    return new vscode.Hover(mds);
                }
            }
        }
    });

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let runwinuae = vscode.commands.registerCommand('amiga-blitzbasic2.runwinuae', () => {
        let file = getCurrentFile();
        if(file.length > 0)
        {
            vscode.window.showInformationMessage('Running in UAE...');
            const editor = vscode.window.activeTextEditor;
            const terminal = vscode.window.createTerminal(`Ext Terminal`);
            terminal.show();
            terminal.sendText("mono WinUAEArexx.exe S:blitzbasic2.rexx 1000 \"SharedCode:"+file+"\"");
        }
	});
	context.subscriptions.push(runwinuae);

    let runamiga = vscode.commands.registerCommand('amiga-blitzbasic2.runamiga', () => {
        let path = getCurrentFile();
        if(path.length > 0)
        {
            vscode.window.showInformationMessage('Running on Amiga...');
            const editor = vscode.window.activeTextEditor;
            const terminal = vscode.window.createTerminal(`Ext Terminal`);
            terminal.show();
            terminal.sendText(path+"run_amiga.bat");
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


function getCurrentFile() : string {
    let currentlyOpenTabfilePath: string;
    let currentlyOpenTabfileName: string;
    let out: string;
    if((vscode.window.activeTextEditor != undefined) && (vscode.workspace.workspaceFolders))
    {
        currentlyOpenTabfilePath = vscode.window.activeTextEditor.document.fileName;
        currentlyOpenTabfileName = path.basename(currentlyOpenTabfilePath);
        let root: vscode.WorkspaceFolder;
        root = vscode.workspace.workspaceFolders[0];
        out = root.uri.fsPath;

        currentlyOpenTabfileName=currentlyOpenTabfilePath.substring(out.length+1,currentlyOpenTabfilePath.length);   
    return currentlyOpenTabfileName;
    }
    else {
        return "";
    }
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
