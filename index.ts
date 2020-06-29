import { execSync } from 'child_process';

import WorkspaceClient, { IRemoteAPI, IRestAPIConfig } from '@eclipse-che/workspace-client';
import { che } from '@eclipse-che/api';

// Eclipse Che Workspace Rest API client 作成
const restApiClient = createRestClient();

// ワークスペース情報取得要求
const CHE_WORKSPACE_ID: string = process.env.CHE_WORKSPACE_ID;
const promise: Promise<che.workspace.Workspace> = restApiClient.getById<che.workspace.Workspace>(CHE_WORKSPACE_ID);

promise.then((workspace:che.workspace.Workspace) => {
    // ワークスペース情報取得要求に成功したら、project をクローンする。
    cloneAllProject(workspace);
}).catch( (e) => {
    // ワークスペース情報取得要求に失敗したら、エラー終了。
    console.log(e);
    process.exit(1);
});

/**
 * Eclipse Che Workspace Rest API client 作成
 */
function createRestClient(): IRemoteAPI {
    // ワークスペース情報取得のための REST クライアント
    const restAPIConfig: IRestAPIConfig = {};
    restAPIConfig.baseUrl = process.env.CHE_API;

    const CHE_MACHINE_TOKEN = process.env.CHE_MACHINE_TOKEN;
    if (CHE_MACHINE_TOKEN) {
        restAPIConfig.headers = {};
        restAPIConfig.headers['Authorization'] = 'Bearer ' + CHE_MACHINE_TOKEN;
    }

    return WorkspaceClient.getRestApi(restAPIConfig);
}

/**
 * devfile で指定された project をクローンする
 *
 * v0.0.1 時点では git のみサポート
 */
function cloneAllProject(workspace:che.workspace.Workspace): void {
    const CHE_PROJECTS_ROOT = process.env.CHE_PROJECTS_ROOT;

    // devfile で指定された project をクローンする
    // v0.0.1 時点では git のみサポート
    const projects = workspace.devfile.projects ? workspace.devfile.projects : [];
    projects.forEach((e) => {
        if (e.source.type !== 'git') {
            console.log('Not support source type: ' + e.source.type + ', che-project-cloner support only "git".');
            return;
        }

        const location = e.source.location;
        const branch = e.source.branch;
        const branchOption = branch ? '-b ' + e.source.branch : '';

        const buf = execSync('git clone ' + branchOption + ' ' + location, {cwd: CHE_PROJECTS_ROOT});
        console.log(buf.toString('utf-8'));
    });
}