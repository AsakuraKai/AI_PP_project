requestImpl.ts:33  GET https://marketplace.visualstudio.com/_apis/public/gallery/vscode/kai/rca-agent-extension/latest 404 (Not Found)
DSn @ requestImpl.ts:33
(anonymous) @ requestService.ts:38
c @ request.ts:81
request @ requestService.ts:38
L @ extensionGalleryService.ts:1455
await in L
K @ extensionGalleryService.ts:1381
C @ extensionGalleryService.ts:826
(anonymous) @ extensionGalleryService.ts:753
B @ extensionGalleryService.ts:750
getExtensions @ extensionGalleryService.ts:633
await in getExtensions
checkForUpdates @ extensionsWorkbenchService.ts:1940
await in checkForUpdates
(anonymous) @ extensionsWorkbenchService.ts:2083
queue @ async.ts:271
(anonymous) @ async.ts:471
(anonymous) @ async.ts:412
Promise.then
trigger @ async.ts:406
trigger @ async.ts:471
Rb @ extensionsWorkbenchService.ts:2081
tb @ extensionsWorkbenchService.ts:1158
sb @ extensionsWorkbenchService.ts:1104
console.ts:139 [Extension Host] [2026-01-09T21:29:55.505Z] [INFO] RCA Agent extension activated - UI removed, backend services available undefined (at console.<anonymous> (file:///c:/VS/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:215:29517))
console.ts:139 [Extension Host] [RCAChatParticipant] Chat participant registered: @rca-agent (at console.<anonymous> (file:///c:/VS/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:215:29517))
console.ts:139 [Extension Host] [2026-01-09T21:29:55.516Z] [INFO] RCA Agent activated - Backend services ready undefined (at console.<anonymous> (file:///c:/VS/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:215:29517))
log.ts:460   ERR [Extension Host] [AnalysisService] Analysis failed: Error: Failed to parse error message
	at AnalysisService.analyzeError (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\services\AnalysisService.js:178:23)
	at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
	at async RCAWebviewProvider._handleAnalyzeError (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\webview\RCAWebviewProvider.js:242:28)
	at async RCAWebviewProvider._handleAnalyzeAllErrors (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\webview\RCAWebviewProvider.js:397:17)
	at async RCAWebviewProvider._handleMessage (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\webview\RCAWebviewProvider.js:90:17)
	at async Kd.value (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\webview\RCAWebviewProvider.js:78:13)
error @ log.ts:460
error @ log.ts:565
error @ logService.ts:51
Uxs @ remoteConsoleUtil.ts:58
$logExtensionHostMessage @ mainThreadConsole.ts:38
S @ rpcProtocol.ts:458
Q @ rpcProtocol.ts:443
M @ rpcProtocol.ts:373
L @ rpcProtocol.ts:299
(anonymous) @ rpcProtocol.ts:161
C @ event.ts:1212
fire @ event.ts:1243
fire @ ipc.net.ts:652
l.onmessage @ localProcessExtensionHost.ts:385
console.ts:139 [Extension Host] [AnalysisService] Analysis failed: Error: Failed to parse error message
	at AnalysisService.analyzeError (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\services\AnalysisService.js:178:23)
	at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
	at async RCAWebviewProvider._handleAnalyzeError (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\webview\RCAWebviewProvider.js:242:28)
	at async RCAWebviewProvider._handleAnalyzeAllErrors (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\webview\RCAWebviewProvider.js:397:17)
	at async RCAWebviewProvider._handleMessage (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\webview\RCAWebviewProvider.js:90:17)
	at async Kd.value (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\webview\RCAWebviewProvider.js:78:13) (at console.<anonymous> (file:///c:/VS/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:215:29517))
jxs @ console.ts:139
$logExtensionHostMessage @ mainThreadConsole.ts:39
S @ rpcProtocol.ts:458
Q @ rpcProtocol.ts:443
M @ rpcProtocol.ts:373
L @ rpcProtocol.ts:299
(anonymous) @ rpcProtocol.ts:161
C @ event.ts:1212
fire @ event.ts:1243
fire @ ipc.net.ts:652
l.onmessage @ localProcessExtensionHost.ts:385
requestImpl.ts:33  GET https://marketplace.visualstudio.com/_apis/public/gallery/vscode/kai/rca-agent-extension/latest 404 (Not Found)
DSn @ requestImpl.ts:33
(anonymous) @ requestService.ts:38
c @ request.ts:81
request @ requestService.ts:38
L @ extensionGalleryService.ts:1455
await in L
K @ extensionGalleryService.ts:1381
C @ extensionGalleryService.ts:826
(anonymous) @ extensionGalleryService.ts:753
B @ extensionGalleryService.ts:750
getExtensions @ extensionGalleryService.ts:633
await in getExtensions
checkForUpdates @ extensionsWorkbenchService.ts:1940
await in checkForUpdates
(anonymous) @ extensionsWorkbenchService.ts:2083
queue @ async.ts:271
(anonymous) @ async.ts:471
(anonymous) @ async.ts:412
Promise.then
trigger @ async.ts:406
trigger @ async.ts:471
Rb @ extensionsWorkbenchService.ts:2081
tb @ extensionsWorkbenchService.ts:1158
sb @ extensionsWorkbenchService.ts:1104
console.ts:139 [Extension Host] [2026-01-09T21:29:55.505Z] [INFO] RCA Agent extension activated - UI removed, backend services available undefined (at console.<anonymous> (file:///c:/VS/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:215:29517))
console.ts:139 [Extension Host] [RCAChatParticipant] Chat participant registered: @rca-agent (at console.<anonymous> (file:///c:/VS/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:215:29517))
console.ts:139 [Extension Host] [2026-01-09T21:29:55.516Z] [INFO] RCA Agent activated - Backend services ready undefined (at console.<anonymous> (file:///c:/VS/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:215:29517))
log.ts:460   ERR [Extension Host] [AnalysisService] Analysis failed: Error: Failed to parse error message
	at AnalysisService.analyzeError (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\services\AnalysisService.js:178:23)
	at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
	at async RCAWebviewProvider._handleAnalyzeError (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\webview\RCAWebviewProvider.js:242:28)
	at async RCAWebviewProvider._handleAnalyzeAllErrors (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\webview\RCAWebviewProvider.js:397:17)
	at async RCAWebviewProvider._handleMessage (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\webview\RCAWebviewProvider.js:90:17)
	at async Kd.value (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\webview\RCAWebviewProvider.js:78:13)
error @ log.ts:460
error @ log.ts:565
error @ logService.ts:51
Uxs @ remoteConsoleUtil.ts:58
$logExtensionHostMessage @ mainThreadConsole.ts:38
S @ rpcProtocol.ts:458
Q @ rpcProtocol.ts:443
M @ rpcProtocol.ts:373
L @ rpcProtocol.ts:299
(anonymous) @ rpcProtocol.ts:161
C @ event.ts:1212
fire @ event.ts:1243
fire @ ipc.net.ts:652
l.onmessage @ localProcessExtensionHost.ts:385
console.ts:139 [Extension Host] [AnalysisService] Analysis failed: Error: Failed to parse error message
	at AnalysisService.analyzeError (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\services\AnalysisService.js:178:23)
	at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
	at async RCAWebviewProvider._handleAnalyzeError (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\webview\RCAWebviewProvider.js:242:28)
	at async RCAWebviewProvider._handleAnalyzeAllErrors (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\webview\RCAWebviewProvider.js:397:17)
	at async RCAWebviewProvider._handleMessage (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\webview\RCAWebviewProvider.js:90:17)
	at async Kd.value (c:\Users\Admin\OneDrive\Desktop\Nuclear Creation\AI\AI_PP_project\vscode-extension\out\vscode-extension\src\webview\RCAWebviewProvider.js:78:13) (at console.<anonymous> (file:///c:/VS/resources/app/out/vs/workbench/api/node/extensionHostProcess.js:215:29517))
jxs @ console.ts:139
$logExtensionHostMessage @ mainThreadConsole.ts:39
S @ rpcProtocol.ts:458
Q @ rpcProtocol.ts:443
M @ rpcProtocol.ts:373
L @ rpcProtocol.ts:299
(anonymous) @ rpcProtocol.ts:161
C @ event.ts:1212
fire @ event.ts:1243
fire @ ipc.net.ts:652
l.onmessage @ localProcessExtensionHost.ts:385
