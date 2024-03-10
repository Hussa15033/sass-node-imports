// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import path from "path";
import * as vscode from "vscode";

/**
 * Recursively find the path of the nearest node module directory
 * @param path
 */
const findModulePath = (sassPath: string): Promise<vscode.Uri> => {
  return new Promise((resolve, reject) => {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      reject("Path not found");
      return;
    }

    const paths = vscode.workspace.findFiles(
      path.join("node_modules", sassPath),
      null,
      1
    );

    return paths.then((pathList) => {
      if (pathList.length === 0) {
        reject("Path not found");
      } else {
        resolve(pathList[0]);
      }
    });
  });
};

class SassNodeDefinitionProvider implements vscode.DefinitionProvider {
  public provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Thenable<vscode.Location> {
    console.log("Something happened...?");

    const importPattern = /["']~(.*?)["']/i;
    const lineText = document.lineAt(position.line).text;

    const match = importPattern.exec(lineText);

    return new Promise((resolve, reject) => {
      if (match) {
        const sassPath = match[1];
        findModulePath(sassPath)
          .then((moduleFilePath) => {
            const definitionLocation = new vscode.Location(
              vscode.Uri.file(moduleFilePath.fsPath),
              new vscode.Position(0, 0)
            );
            resolve(definitionLocation);
          })
          .catch(reject);
      } else {
        reject("Path not found");
      }
    });
  }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log("Started extension");
  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      { language: "scss", pattern: "**/*.scss" },
      new SassNodeDefinitionProvider()
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
