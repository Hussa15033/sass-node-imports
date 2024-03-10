// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

/**
 * Recursively find the path of the nearest node module directory
 * @param path
 */
const findModulePath = async (sassPath: string): Promise<vscode.Uri | null> => {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return null;
  }

  const pathList = await vscode.workspace.findFiles(
    new vscode.RelativePattern(
      workspaceFolder,
      "node_modules/" + sassPath + ".{css,scss}"
    ),
    null,
    1
  );

  return pathList.length === 0 ? null : pathList[0];
};

class SassNodeLinkProvider implements vscode.DocumentLinkProvider {
  async provideDocumentLinks(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.DocumentLink[] | null | undefined> {
    const links: vscode.DocumentLink[] = [];

    const importPattern = /["'](~(.*?)(\.scss)?)["']/g;
    const documentText = document.getText();
    let match;

    while ((match = importPattern.exec(documentText))) {
      const importPath = match[2];
      const fullText = match[1];

      const foundPath = await findModulePath(importPath);

      if (foundPath) {
        // This path exists, add document link

        const startRange = match.index + 1;
        const endRange = startRange + fullText.length;

        const range = new vscode.Range(
          document.positionAt(startRange),
          document.positionAt(endRange)
        );

        const docLink = new vscode.DocumentLink(range, foundPath);

        links.push(docLink);
      }
    }

    return new Promise((resolve, reject) => {
      resolve(links);
    });
  }
  resolveDocumentLink?(
    link: vscode.DocumentLink,
    _: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DocumentLink> {
    return link;
  }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  console.log("Started extension");
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(
      { language: "scss", pattern: "**/*.scss", scheme: "file" },
      new SassNodeLinkProvider()
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
