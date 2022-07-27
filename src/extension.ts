// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as xml2js from 'xml2js';
var path = require("path");
var net = require('net');



const BB2_MODE: vscode.DocumentFilter = { language: 'abb2', scheme: 'file' };

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated


    const settings = vscode.workspace.getConfiguration('AmigaBlitzBasic2')

    let sharedFolder =settings.sharedFolder;
    if (sharedFolder.substring(sharedFolder.length-1,sharedFolder.length)) {
        sharedFolder+=':';
    }
    
    console.log("Loading Blitz Basic 2 documentation...");
    let xml=fs.readFileSync(context.extensionPath+'/resources/doc/bb2doc.xml','utf8');
    let bb2doc: {[key: string]: any}=[];
    xml2js.parseString(xml, function (err, result) {
        if (result != undefined) {
            result.bb2doc.command.forEach((val:any) => {
                bb2doc[val.$.name.toString()]=val;
            });
            console.log('Blitz Basic 2 documentation Loaded');
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
                    if (command.shortDescription.toString().length>0) {
                        mds.appendMarkdown('_'+command.shortDescription.toString()+'_'); 
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
	let runuae = vscode.commands.registerCommand('amiga-blitzbasic2.runwinuae', () => {
        let file = getCurrentFile();
        if(file.length > 0)
        {
            vscode.window.showInformationMessage('Running in UAE...');
            if (vscode.window.activeTextEditor != undefined && vscode.workspace.workspaceFolders!= undefined) {

                const ext=path.extname(vscode.window.activeTextEditor.document.fileName)
                
                if (ext == '.bb' || ext == '.bb2' || ext == '.bba') {

                    vscode.window.activeTextEditor.document.save();

                    const folder=path.dirname(vscode.window.activeTextEditor.document.fileName)
                    const mainFile=path.basename(vscode.window.activeTextEditor.document.fileName)
                    const currentSubfolder= file.substring(0,file.length-mainFile.length)
                    let includes: string[]=[];
                    var files = fs.readdirSync(folder);
                    files.forEach((f) => {
                        if (path.extname(f)=='.bba') {
                        replaceFile(folder+'/'+f,folder+'/'+f.replace('.bba','.bb2')); //.bba file on vscode side, .bb2 for Ted on the amiga.
                        if (f!= mainFile) {
                            includes.push(sharedFolder+currentSubfolder+f.replace('.bba','.bb2'))
                        }
                        }
                    });
                    const root = vscode.workspace.workspaceFolders[0];
                    let out = root.uri.fsPath;
                    let dir = out + '/build';
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, 0o744);
                    }
                    replaceFile(context.extensionPath + '/resources/amiga/blitzbasic2.rexx',dir+'/blitzbasic2.rexx'); 
                    replaceFile(context.extensionPath + '/resources/amiga/BB2NagAway',dir+'/BB2NagAway'); 
    
                    console.log('Connecting in TCP (AUX:) to UAE');

                    let command:string = "rx S:blitzbasic2.rexx ";
                    command+=" \""+sharedFolder+file.replace('.bba','.bb2')+"\"";
                    includes.forEach((include) => {
                        command+=" \""+include+"\"";
                    });
                    command+="\r\n";

                    console.log(command);
                
                    var client  = new net.Socket();
                    client.connect({
                    port: settings.UAEPort
                    });
                    
                    client.on('connect',function(){
                        console.log('Client: connection established with server');
                        // writing data to server
                        client.write("copy "+sharedFolder+"/build/blitzbasic2.rexx S:\r\n"); //To avoid when things goes wrong on the amiga
                        client.write("copy "+sharedFolder+"/build/BB2NagAway C:\r\n"); 
                        client.write(command);

                    });
                    
                    client.setEncoding('utf8');
                    
                    client.on('data',function(data:any){
                    console.log('Data from server:' + data);
                    });
                    
                    setTimeout(function(){
                    client.end('Bye bye server');
                    },1000);

                }
            }
        }
	});
	context.subscriptions.push(runuae);

    let runamiga = vscode.commands.registerCommand('amiga-blitzbasic2.runamiga', () => {
        let path = getCurrentFile();
        if(path.length > 0)
        {
            //TODO to be updated with native js code
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

function replaceFile(srcFile:string,destFile:string) {
    if (fs.existsSync(destFile)) {
        fs.unlink(destFile, function (err) { if (err) {
            console.log(err);
        } }); // delete if needed
    }
    fs.copyFile(srcFile, destFile, fs.constants.COPYFILE_EXCL, (err) => { if (err) {
        console.log(err);
    } });
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
