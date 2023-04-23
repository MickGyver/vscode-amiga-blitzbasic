// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as xml2js from 'xml2js';
var naturalCompare = require("natural-compare-lite")
var path = require('path');
var net = require('net');
import { zip, COMPRESSION_LEVEL } from 'zip-a-folder';
import Adf from './adfFS';
import { stringify } from 'querystring';



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

    context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            BB2_MODE, new GoDocumentSymbolProvider()));

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
	let runuae = vscode.commands.registerCommand('amiga-blitzbasic2.runuae', () => {
        runAndLoadInUAE(context,settings,sharedFolder,false,true);
	});
	context.subscriptions.push(runuae);

    let openalluae = vscode.commands.registerCommand('amiga-blitzbasic2.openalluae', () => {
        runAndLoadInUAE(context,settings,sharedFolder,true,false);
	});
	context.subscriptions.push(openalluae);

    let runalluae = vscode.commands.registerCommand('amiga-blitzbasic2.runalluae', () => {
        runAndLoadInUAE(context,settings,sharedFolder,true,true);
	});
	context.subscriptions.push(runalluae);

    let buildADFCommand = vscode.commands.registerCommand('amiga-blitzbasic2.buildADF', () => {
        buildSupport(context,sharedFolder,'ADF');
	});
	context.subscriptions.push(buildADFCommand);

    let buildISOCommand = vscode.commands.registerCommand('amiga-blitzbasic2.buildISO', () => {
        buildSupport(context,sharedFolder,"ISO");
	});
    let buildZIPCommand = vscode.commands.registerCommand('amiga-blitzbasic2.buildZIP', () => {
        buildSupport(context,sharedFolder,"ZIP");
	});
	context.subscriptions.push(buildZIPCommand);

	context.subscriptions.push(
        vscode.languages.registerDocumentSymbolProvider(
            {scheme: "file", language: "abb2"}, 
            new ABB2DocumentSymbolProvider()
        )
    );
}

// this method is called when your extension is deactivated
export function deactivate() {}



function runAndLoadInUAE(context: vscode.ExtensionContext,settings:vscode.WorkspaceConfiguration,sharedFolder:string,all:boolean,run:boolean) {
    let file = getCurrentFile();
    if(file.length > 0)
    {
        if (run && !all)
        {
            vscode.window.showInformationMessage('Opening current and Running current in UAE...');
        }
        if (run && all)
        {
            vscode.window.showInformationMessage('Opening all and Running current in UAE...');
        }
        if (!run&& all)
        {
            vscode.window.showInformationMessage('Opening all file in UAE...');
        }
        if (vscode.window.activeTextEditor != undefined && vscode.workspace.workspaceFolders!= undefined) {

            const ext=path.extname(vscode.window.activeTextEditor.document.fileName)
            
            if (ext == '.bb' || ext == '.bb2' || ext == '.bba') {

                vscode.window.activeTextEditor.document.save();

                const folder=path.dirname(vscode.window.activeTextEditor.document.fileName)
                const mainFile=path.basename(vscode.window.activeTextEditor.document.fileName)
                const currentSubfolder= file.substring(0,file.length-mainFile.length)
                let includes: string[]=[];
                if (all) {
                    var files = fs.readdirSync(folder);
                    files.forEach((f) => {
                        if (path.extname(f)=='.bba') {
                        replaceFile(folder+'/'+f,folder+'/'+f.replace('.bba','.bb2')); //.bba file on vscode side, .bb2 for Ted on the amiga.
                        if (f!= mainFile) {
                            includes.push(sharedFolder+currentSubfolder+f.replace('.bba','.bb2'))
                        }
                        }
                    });
                } else {
                    replaceFile(folder+'/'+mainFile,folder+'/'+mainFile.replace('.bba','.bb2')); //.bba file on vscode side, .bb2 for Ted on the amiga.
                }
                let dir = folder + '/build';
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, 0o744);
                }
                if (run) {
                    replaceFile(context.extensionPath + '/resources/amiga/blitzbasic2.rexx',dir+'/blitzbasic2.rexx'); 
                }
                else {
                    replaceFile(context.extensionPath + '/resources/amiga/blitzbasic2-open.rexx',dir+'/blitzbasic2-open.rexx'); 
                }
                replaceFile(context.extensionPath + '/resources/amiga/BB2NagAway',dir+'/BB2NagAway'); 

                console.log('Connecting in TCP (AUX:) to UAE');

                let command:string;
                if (run) {
                 command="rx S:blitzbasic2.rexx ";
                }
                else {
                    command="rx S:blitzbasic2-open.rexx ";
                }
                command+=" \""+sharedFolder+file.replace('.bba','.bb2').replace('\\','/')+"\"";
                includes.forEach((include) => {
                    command+=" \""+include.replace('\\','/')+"\"";
                });
                command+="\r\n";

                console.log(command);
            
                var client  = new net.Socket();
                client.connect({
                    port: settings.UAEPort
                });
                
                let outData:string;
                client.on('connect',function(){
                    console.log('Client: connection established with server');
                    client.write("\r\n"); // to avoid bug
                    // writing data to server
                    if (run) {
                        client.write("copy "+sharedFolder+currentSubfolder.replace('\\','/')+"build/blitzbasic2.rexx S:\r\n"); //To avoid when things goes wrong on the amiga
                    }
                    else {
                        client.write("copy "+sharedFolder+currentSubfolder.replace('\\','/')+"build/blitzbasic2-open.rexx S:\r\n");
                    }
                    client.write("copy "+sharedFolder+currentSubfolder.replace('\\','/')+"build/BB2NagAway C:\r\n"); 
                    client.write(command);

                });
                
                client.setEncoding('utf8');
                
                client.on('data',function(data:any){
                    outData+=data
                });
                
                setTimeout(function(){
                console.log(outData);
                client.end('Bye bye server');
                },1000);

            }
        }
    }
}

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
        fs.unlinkSync(destFile); // delete if needed
    }
    fs.copyFileSync(srcFile, destFile, fs.constants.COPYFILE_EXCL);
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

class GoDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
    public provideDocumentSymbols(document: vscode.TextDocument,
            token: vscode.CancellationToken): Thenable<vscode.SymbolInformation[]> {
        return new Promise((resolve, reject) => {
            var symbols: vscode.SymbolInformation[]= [];
            for (var i = 0; i < document.lineCount; i++) {
                var line = document.lineAt(i);
                if (line.text.startsWith(".") && line.text.includes(":")) {
                    let stra: string[]=line.text.split(".", 2);
                    let strb: string[]=stra[1].split(":", 1);
                    symbols.push(new vscode.SymbolInformation(
                        strb[0],
                        vscode.SymbolKind.Module,
                        "GoSub",
                       new vscode.Location(document.uri,line.range)
                    ))
                }
                if (line.text.toLowerCase().startsWith("statement")) {
                    let stra: string[]=line.text.split(" ", 2);
                    let strb: string[]=stra[1].split("{", 1);
                    symbols.push(new vscode.SymbolInformation(
                        strb[0],
                        vscode.SymbolKind.Method,
                        "Statement",
                       new vscode.Location(document.uri,line.range)
                    ))
                }
                if (line.text.toLowerCase().startsWith("function")) {
                    let stra: string[]=line.text.split(" ", 2);
                    let strb: string[]=stra[1].split("{", 1);
                    symbols.push(new vscode.SymbolInformation(
                        strb[0],
                        vscode.SymbolKind.Function,
                        "Function",
                       new vscode.Location(document.uri,line.range)
                    ))
                }
                if (line.text.toLowerCase().startsWith("macro")) {
                    let stra: string[]=line.text.split(" ", 2);
                    let strb: string[]=stra[1].split("{", 1);
                    symbols.push(new vscode.SymbolInformation(
                        strb[0],
                        vscode.SymbolKind.Function,
                        "Macro",
                       new vscode.Location(document.uri,line.range)
                    ))
                }
                if (line.text.toLowerCase().startsWith("newtype")) {
                    let stra: string[]=line.text.split(" ", 2);
                    let strb: string[]=stra[1].split(".", 2);
                    symbols.push(new vscode.SymbolInformation(
                        strb[1],
                        vscode.SymbolKind.Struct,
                        "Type",
                       new vscode.Location(document.uri,line.range)
                    ))
                }
            }

            resolve(symbols);
        });
    }
}

async function buildSupport(context: vscode.ExtensionContext,sharedFolder:string,targetType:string) {
    const settings = vscode.workspace.getConfiguration('AmigaBlitzBasic2')
                       
    let file = getCurrentFile();
    if(file.length > 0)
    {
        if (vscode.window.activeTextEditor != undefined && vscode.workspace.workspaceFolders!= undefined) {

            vscode.window.showInformationMessage('Building '+targetType+'...');

            const folder=path.dirname(vscode.window.activeTextEditor.document.fileName)
            const mainFile=path.basename(vscode.window.activeTextEditor.document.fileName)
            const currentSubfolder= file.substring(0,file.length-mainFile.length)
            const root = vscode.workspace.workspaceFolders[0];
            let dirBuild = root.uri.fsPath+"/"+currentSubfolder + 'build';
            if (!fs.existsSync(dirBuild)) {
                fs.mkdirSync(dirBuild, 0o744);
            }
            let packagingConfig:any=null
            if (fs.existsSync(folder+"/packaging.json")) {
                packagingConfig = JSON.parse(fs.readFileSync(folder+"/packaging.json", 'utf-8'))
            }
            if (packagingConfig) {
                for(const support of packagingConfig.supports) {
                    if (support.type.toUpperCase()=="ADF" && targetType=='ADF') {

                        const adf=new Adf();
                        //init ADF

                        let adfSrc=context.extensionPath + '/resources/packaging/blank.adf';
                        if (support.boot) {
                            adfSrc=context.extensionPath + '/resources/packaging/boot.adf';
                        }
                        const adfPath=dirBuild+'/'+support.supportName+'.adf';            
                        
                        var myArrayBuffer=fs.readFileSync(adfSrc).buffer
                        adf.loadDisk(myArrayBuffer, function(success:any){
                            if (success){
                                var info = adf.getInfo();
                                if (info.diskFormat == "DOS"){
                                    
                                    adf.setDiskName(support.supportName);
                                    if (support.filesToIncludeOnRoot) {
                                        support.filesToIncludeOnRoot.forEach((fileToAdd:string) => {
                                            uploadAdf(folder+"/"+fileToAdd,adf.rootSector,adf)
                                        });  
                                    }
                                    if (support.foldersToInclude) {
                                        support.foldersToInclude.forEach((folderToAdd:string) => {
                                            uploadFolder(folder,folderToAdd,adf.rootSector,adf)
                                        });  
                                    }

                                    const sFolderSector=adf.createFolder("S",adf.rootSector);
                                    let startupSequence=fs.readFileSync(context.extensionPath+'/resources/packaging/startup-sequence','utf-8');
                                    startupSequence=startupSequence.replace('%exe%',support.exeToLaunch);
                                    fs.writeFileSync(dirBuild+'/startup-sequence',new Uint8Array(Buffer.from(startupSequence)),'utf-8');
                                    uploadAdf(dirBuild+'/startup-sequence',sFolderSector,adf)

                                    const libsFolderSector=adf.createFolder("Libs",adf.rootSector);
                                    if (support.includeDiskFontLibrary) {
                                        uploadAdf(context.extensionPath+'/resources/packaging/diskfont.library',libsFolderSector,adf)
                                    }
                                    if (support.includeMathTransLibrary) {
                                        uploadAdf(context.extensionPath+'/resources/packaging/mathtrans.library',libsFolderSector,adf)
                                    }

                                    // Write target disk.
                                    const outDisk=adf.getDisk()
                                    // delete target if needed
                                    if (fs.existsSync(adfPath)) {
                                        fs.unlinkSync(adfPath);
                                    }
                                    var writeStream = fs.createWriteStream(adfPath);
                                    writeStream.write(toBuffer(outDisk.buffer))
                                    writeStream.end();
                                    vscode.window.showInformationMessage('ADF Ready for support : '+support.supportName+' !');
                                }
                            }
                        }); 
                    }

                    if (support.type.toUpperCase()=="ZIP" && targetType=='ZIP') {

                        //prepare files

                        const dirBuildZIP = dirBuild+'/zip';
                        const dirBuildZIPInside = dirBuildZIP+'/'+support.supportName;

                        if (fs.existsSync(dirBuildZIP)) {
                            fs.rmdirSync(dirBuildZIP, { recursive: true });
                        }
                        fs.mkdirSync(dirBuildZIP, 0o744);
                        fs.mkdirSync(dirBuildZIPInside, 0o744);

                        if (support.filesToIncludeOnRoot) {
                            support.filesToIncludeOnRoot.forEach((fileToAdd:string) => {
                                replaceFile(folder+"/"+fileToAdd,dirBuildZIPInside+"/"+fileToAdd);  
                            });  
                        }
                        if (support.foldersToInclude) {
                            support.foldersToInclude.forEach((folderToAdd:string) => {
                                uploadFolderLocal(folder,folderToAdd,dirBuildZIPInside)
                            });  
                        }

                        if (support.folderIcon) {
                            replaceFile(folder+"/"+support.folderIcon,dirBuildZIP+"/"+support.supportName+".info"); 
                        }

                        if (fs.existsSync(dirBuild+'/'+support.supportName+'.zip')) {
                            fs.unlinkSync(dirBuild+'/'+support.supportName+'.zip');
                        }

                        await zip(dirBuildZIP, dirBuild+'/'+support.supportName+'.zip',{compression: COMPRESSION_LEVEL.uncompressed});


                        vscode.window.showInformationMessage('ZIP Ready for support : '+support.supportName+' !');
       
                    }

                    if ( targetType=='ISO' && (support.type.toUpperCase()=='CDTV' || support.type.toUpperCase()=='CD32')) { 

                        if (settings.ISOCD.length > 0) {
                            replaceFile(settings.ISOCD,dirBuild+'/isocd'); 
                        }

                        //prepare files
            
                        const dirBuildISO = dirBuild+'/iso-build-'+support.type.toUpperCase();

                        if (fs.existsSync(dirBuildISO)) {
                            fs.rmdirSync(dirBuildISO, { recursive: true });
                        }
                        fs.mkdirSync(dirBuildISO, 0o744);

                        if (support.filesToIncludeOnRoot) {
                            support.filesToIncludeOnRoot.forEach((fileToAdd:string) => {
                                replaceFile(folder+"/"+fileToAdd,dirBuildISO+"/"+fileToAdd);  
                            });  
                        }
                        if (support.foldersToInclude) {
                            support.foldersToInclude.forEach((folderToAdd:string) => {
                                uploadFolderLocal(folder,folderToAdd,dirBuildISO)
                            });  
                        }

                        fs.mkdirSync(dirBuildISO+"/S", 0o744);
                        let startupSequence=fs.readFileSync(context.extensionPath+'/resources/packaging/startup-sequence-iso','utf-8');
                        startupSequence=startupSequence.replace('%exe%',support.exeToLaunch);
                        fs.writeFileSync(dirBuildISO+'/S/startup-sequence',new Uint8Array(Buffer.from(startupSequence)),'utf-8');

                        fs.mkdirSync(dirBuildISO+"/Libs", 0o744);
                        if (support.includeDiskFontLibrary) {
                            replaceFile(context.extensionPath+'/resources/packaging/diskfont.library',dirBuildISO+'/Libs/diskfont.library'); 
                        }
                        if (support.includeMathTransLibrary) {
                            replaceFile(context.extensionPath+'/resources/packaging/mathtrans.library',dirBuildISO+'/Libs/mathtrans.library'); 
                        }

                        fs.mkdirSync(dirBuildISO+"/C", 0o744);
                        if (settings.RMTM.length > 0) {
                            replaceFile(settings.RMTM,dirBuildISO+'/C/rmtm'); 
                        }

                        if (settings.CDTVTM.length > 0 && support.type.toUpperCase()=='CDTV') {
                            replaceFile(settings.CDTVTM,dirBuildISO+'/CDTV.TM'); 
                        }

                        if (settings.CD32TM.length > 0 && support.type.toUpperCase()=='CD32') {
                            replaceFile(settings.CD32TM,dirBuildISO+'/CD32.TM');     
                        }


                        // Prepare Layout
                        const isoPath=sharedFolder+currentSubfolder+"build/"+support.supportName+".iso"

                        replaceFile(context.extensionPath+'/resources/packaging/Layout',dirBuild+'/Layout'+support.type.toUpperCase());
                        let layout=fs.readFileSync(dirBuild+'/Layout'+support.type.toUpperCase(),'utf-8');
                        layout+='\n';
                        layout+=support.supportName+'\n';
                        if (support.supportVolumeSet) {
                            layout+=support.supportVolumeSet+'\n';
                        } else {
                            layout+='\n';
                        }
                        if (support.supportPublisher) {
                            layout+=support.supportPublisher+'\n';
                        } else {
                            layout+='\n';
                        }
                        if (support.supportPreparer) {
                            layout+=support.supportPreparer+'\n';
                        } else {
                            layout+='\n';
                        }
                        if (support.supportApplication) {
                            layout+=support.supportApplication+'\n';
                        } else {
                            layout+='\n';
                        }
                        layout+='\n';
                        layout+=isoPath+"\n";
                        // End of Header
                        let isoDesc={
                            folders: new Map<string, [string]>(),
                            elems: new Array<LayoutElem>(),
                            count: 1
                        };
                        
                        listFolderForISO(dirBuildISO,isoDesc,1,{countFolder: 1},1)
                        
                        // folder list
                        layout+='000'+isoDesc.count+'	'+sharedFolder+currentSubfolder+'build/iso-build-'+support.type.toUpperCase()+'\n'
                        layout+=' 0001	<Root Dir>\n'
                        isoDesc.folders.forEach( (value,key) => { 
                            value.forEach(name => {
                                layout+=' '+key.padStart(4,'0')+'	'+name+'\n'
                            })
                        });

                        layout+='\n';

                        layout+='H0000	<ISO Header>\n';
                        layout+='P0000	<Path Table>\n';
                        layout+='P0000	<Path Table>\n';
                        layout+='C0000	<Trademark>\n';
                        layout+='D0001	<Root Dir>\n';

                        isoDesc.elems.forEach( (elem) => { 
                            if (elem.type=='file') {
                                layout+='F'+elem.folderRef.padStart(4,'0')+'	'+elem.name+'\n'
                            }
                            if (elem.type=='folder') {
                                layout+='D'+elem.folderRef.padStart(4,'0')+'	'+elem.name+'\n'
                            }
                        });

                        layout+='E0000	65536\n';

                        fs.writeFileSync(dirBuild+'/Layout'+support.type.toUpperCase(),new Uint8Array(Buffer.from(layout)),'utf-8');

                        if (fs.existsSync(dirBuild+"/"+support.supportName+".iso")) {
                            fs.unlinkSync(dirBuild+"/"+support.supportName+".iso");
                        }

                        var client  = new net.Socket();


                        client.setEncoding('utf8');
                        
                        client.on('data',function(data:any){
                            console.log(data);
                        });

                        client.on('connect',function(){
                            console.log('Client: connection established with server');
                            client.write("\r\n"); // to avoid bug
                            // writing data to server
                            client.write("copy "+sharedFolder+currentSubfolder+"build/isocd RAM:\r\n"); 
                            client.write("copy "+sharedFolder+currentSubfolder+"build/iso-build-"+support.type.toUpperCase()+"/"+support.type.toUpperCase()+".TM RAM:\r\n"); 
                            client.write("copy "+sharedFolder+currentSubfolder+"build/Layout"+support.type.toUpperCase()+" RAM:\r\n");
                            client.write("RAM:\r\n");
                            const command="isocd -lLayout"+support.type.toUpperCase()+" -c"+support.type.toUpperCase()+".TM -b \r\n"
                            console.log(command);
                            client.write(command); 
                        });
                        
     
                        client.connect({
                            port: settings.UAEPort
                        });

                        setTimeout(function(){
                            client.end('Bye bye server');
                        },1000);
        

                        if (support.type.toUpperCase() == 'CDTV') {
                            vscode.window.showInformationMessage('ISO for CDTV and CD32 ready for support : '+support.supportName+' !');
                        } else {
                            vscode.window.showInformationMessage('ISO for CD32 only ready for support : '+support.supportName+' !');
                        }
                        vscode.window.showInformationMessage('Wait 20 seconds...');
                        await delay(20000);
                    }
                }
            }
        }
    }
}


function delay(milliseconds : number) {
    return new Promise(resolve => setTimeout( resolve, milliseconds));
}

function uploadFolder(folderPath:string,folderName:string,sector:any,adfDisk:any){
    const folderSector=adfDisk.createFolder(folderName,sector);
    let files=fs.readdirSync(folderPath+"/"+folderName);
    files.forEach(fileToAdd => {
        const srcFile=folderPath+"/"+folderName+"/"+fileToAdd;
        const isDir = fs.existsSync(srcFile) && fs.lstatSync(srcFile).isDirectory();
        if (isDir) {
            uploadFolder(folderPath+"/"+folderName,fileToAdd,folderSector,adfDisk)
        } else {
            if (fileToAdd != ".DS_Store") {
                uploadAdf(srcFile,folderSector,adfDisk)
            }
        }
    });
}

function uploadAdf(srcFile:string,folderSector:any,adfDisk:any) {
    if (fs.existsSync(srcFile)) {
        const bufferFile=new Uint8Array(fs.readFileSync(srcFile))
        adfDisk.writeFile(path.basename(srcFile),bufferFile,folderSector)
    } else {
        console.log("Can't find file, skip.")
    }
}

function toBuffer(ab:ArrayBuffer) {
    const buf = Buffer.alloc(ab.byteLength);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        buf[i] = view[i];
    }
    return buf;
}

function uploadFolderLocal(folderPath:string,folderName:string,targetFolder:string){
    fs.mkdirSync(targetFolder+'/'+folderName);
    let files=fs.readdirSync(folderPath+"/"+folderName);
    files.forEach(fileToAdd => {
        const srcFile=folderPath+"/"+folderName+"/"+fileToAdd;
        const isDir = fs.existsSync(srcFile) && fs.lstatSync(srcFile).isDirectory();
        if (isDir) {
            uploadFolderLocal(folderPath+"/"+folderName,fileToAdd,targetFolder+'/'+folderName);
        } else {
            if (fileToAdd != ".DS_Store") {
                replaceFile(folderPath+"/"+folderName+"/"+fileToAdd,targetFolder+'/'+folderName+'/'+fileToAdd);  
            }
        }
    });
}

function listFolderForISO(dest:string, isoDesc:  { folders: Map<string, [string]>, elems:Array<LayoutElem>, count:number },level:number,counter: { countFolder:number}, posFolder:number ){
    let files=fs.readdirSync(dest);
    files.sort((a,b) => { return naturalCompare(a.toLowerCase(), b.toLowerCase());});
    let actions=new Array<Action>();
    files.forEach(fileToAdd => {
        const srcFile=dest+"/"+fileToAdd;
        const isDir = fs.existsSync(srcFile) && fs.lstatSync(srcFile).isDirectory();
        if (isDir) {
            let sLevel=level.toString();
            if (!isoDesc.folders.has(sLevel)) {
                isoDesc.folders.set(sLevel,[fileToAdd]);
            } else {
                isoDesc.folders.get(sLevel)?.push(fileToAdd);
            }
            isoDesc.count=isoDesc.count+1;
            //
            counter.countFolder=counter.countFolder+1;
            
            let folder:LayoutElem = {
                type: 'folder',
                name: fileToAdd,
                folderRef: counter.countFolder.toString()
            };
            isoDesc.elems.push(folder);

            actions.push({
                srcFile:srcFile,isoDesc:isoDesc,level:level+1,counter:counter,posFolder:counter.countFolder
            })
            
        } else {
            let file:LayoutElem = {
                type: 'file',
                name: fileToAdd,
                folderRef: posFolder.toString()
            };
            isoDesc.elems.push(file);
        }
    });
    actions.forEach(a => {
        listFolderForISO(a.srcFile,a.isoDesc,a.level,a.counter,a.posFolder);
    });
    
    return isoDesc;
}

interface LayoutElem {
    type: string,
    name: string;
    folderRef: string;
}

interface Action {
    srcFile:string;
    isoDesc: { folders: Map<string, [string]>, elems:Array<LayoutElem>, count:number };
    level:number;
    counter: { countFolder:number};
    posFolder: number;
}