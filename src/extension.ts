// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "yii-view-opener.open-view",
    () => {
      const editor = vscode.window.activeTextEditor;

      if (editor) {
        // Get the content of the line
        const lineContent = getLineContent(editor);

        // Get the file name
        const fileName = getFileName(editor);

        // Get the view name
        const viewName = getViewName(editor, lineContent ?? "");

        // Get the folder name
        const folderName = getFolder(fileName ?? "");

        // Open the file
        if (folderName && viewName && fileName) {
          openFile(fileName, folderName, viewName);
        }
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function getLineContent(
  editor: vscode.TextEditor | undefined
): string | null {
  if (editor) {
    // Get the selection range
    const selection = editor.selection;

    // Get the start position of the selection
    const start = selection.start;

    // Get the line content using the start position
    const line = editor.document.lineAt(start.line);

    // Get the content of the line and remove the white spaces
    return line.text.trim();
  }
  return null;
}

export function getFileName(
  editor: vscode.TextEditor | undefined
): string | null {
  if (editor) {
    const document = editor.document;
    return document.fileName;
  }
  return null;
}

export function getViewName(
  editor: vscode.TextEditor | undefined,
  lineContent: string
): string | null {
  // Try to get the view name from the render method
  let regex = /\$this->render\('([^']+)'/;
  let match = lineContent?.match(regex);
  if (editor && match) {
    return match[1];
  }

  // Try to get the view name from the renderPartial method
  regex = /\$this->renderPartial\('([^']+)'/;
  match = lineContent?.match(regex);
  if (editor && match) {
    return match[1];
  }

  return null;
}

export function getFolder(filename: string): string | null {
  // Find the index of the last '\' character
  const lastBackslashIndex = filename.lastIndexOf("\\");

  if (lastBackslashIndex !== -1) {
    // Extract the text after the last '\' character
    let folderName = filename.substring(lastBackslashIndex + 1);

    // Remove the 'Controller' word and the '.php' extension
    folderName = folderName.replace("Controller", "").replace(".php", "");

    return folderName;
  }
  return null;
}

export function convertToDashCase(text: string): string {
  // Convert the text to dash case
  return text.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

export function openFile(
  fileName: string,
  folderName: string,
  viewName: string
) {
  // Get the folders paths
  const actualPath = path.resolve(__dirname, fileName);
  const parentFolder = path.dirname(actualPath);
  const grandparentFolder = path.dirname(parentFolder);

  // Try to open the file with Camel Case folder: ../views/folderName/view.php
  const camelCaseFolderFilePath = path.join(
    grandparentFolder,
    "views",
    folderName,
    `${viewName}.php`
  );
  openFileIfExistis(camelCaseFolderFilePath);

  // Try to open file with Dash Case folder: ../views/folder-name/view.php
  const dashedFolderFilePath = path.join(
    grandparentFolder,
    "views",
    convertToDashCase(folderName),
    `${viewName}.php`
  );
  openFileIfExistis(dashedFolderFilePath);

  // Try to open the file in the same folder
  const sameFolderFilePath = path.join(parentFolder, `${viewName}.php`);
  openFileIfExistis(sameFolderFilePath);
}

export function openFileIfExistis(filePath: string) {
  if (fs.existsSync(filePath)) {
    const uri = vscode.Uri.file(filePath);
    vscode.commands.executeCommand("vscode.open", uri);
    return;
  }
}

// This method is called when your extension is deactivated
export function deactivate() {
  console.log("Bye-bye love...");
}
