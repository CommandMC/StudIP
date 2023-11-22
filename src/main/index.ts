import 'source-map-support/register'
import { join } from 'path'
import { app, BrowserWindow, ipcMain, dialog, nativeTheme } from 'electron'
import { stat, mkdir, writeFile } from 'fs/promises'

import { StudIPApi } from './api'
import appIconLight from '../../build/icon_light.png?asset'
import appIconDark from '../../build/icon_dark.png?asset'
import { File, Folder } from './api/interfaces.ts'

let g_api: StudIPApi
let g_window: BrowserWindow

function createWindow() {
    g_window = new BrowserWindow({
        width: 1280,
        height: 720,
        icon: nativeTheme.shouldUseDarkColors ? appIconDark : appIconLight,
        webPreferences: {
            preload: join(__dirname, '../preload/index.js')
        }
    })

    const renderer_url = process.env['ELECTRON_RENDERER_URL']
    if (!app.isPackaged && renderer_url) {
        void g_window.loadURL(renderer_url)
        g_window.webContents.openDevTools()
    } else {
        void g_window.loadFile(join(__dirname, '../renderer/index.html'))
    }
}

ipcMain.handle('login', async (_e, username: string, password: string, server: string) => {
    console.log(`Logging into account ${username}`)
    g_api = new StudIPApi(server)
    const login_success = await g_api.login(username, password)
    if (login_success) console.log('Login successful', g_api.token)
    return login_success ? g_api.token : false
})

ipcMain.handle('login_with_token', async (_e, token: string, server: string) => {
    console.log('Logging in with token')
    g_api = new StudIPApi(server, token)
    const login_success = await g_api.verify_token()
    if (login_success) console.log('Login successful')
    return login_success
})

ipcMain.handle('get_courses', async () => {
    console.log('Fetching courses')
    return g_api.get_courses()
})

ipcMain.handle('get_course', async (_e, course_id: string) => {
    console.log(`Fetching course metadata for ${course_id}`)
    return g_api.get_course(course_id)
})

ipcMain.handle('get_course_files', async (_e, course_id: string) => {
    console.log(`Fetching files for course ${course_id}`)
    return g_api.get_course_files(course_id)
})

ipcMain.handle('download_file', async (_e, file_name: string, download_url: string): Promise<void> => {
    const { canceled, filePath: file_path } = await dialog.showSaveDialog(g_window, {
        defaultPath: file_name,
        title: `Save "${file_name}"`,
        filters: [{ name: 'All Files', extensions: ['*'] }]
    })
    if (canceled || !file_path) return
    const data = await g_api.get_file_contents(download_url)
    await writeFile(file_path, Buffer.from(data))
})

async function sync_folder(folder: Folder, path: string) {
    const full_path = join(path, folder.name)
    // Make sure the folder exists
    try {
        await stat(full_path)
    } catch (e) {
        await mkdir(full_path, { recursive: true })
    }

    const promises: Promise<unknown>[] = []
    for (const child_folder of folder.contents.folders) promises.push(sync_folder(child_folder, full_path))
    for (const child_file of folder.contents.files) promises.push(sync_file(child_file, full_path))
    return Promise.all(promises)
}

async function sync_file(file: File, path: string) {
    const full_path = join(path, file.name)
    let need_to_download = false

    // Case 1: File doesn't exist
    let stat_result
    try {
        stat_result = await stat(full_path)
    } catch {
        console.log(`Failed to stat ${full_path}, re-downloading`)
        need_to_download = true
    }

    // Case 2: File isn't the same size (content changed in some way)
    if (!need_to_download && stat_result) {
        if (stat_result.size !== file.size) {
            console.log(`Size of ${file.name} differs, ${stat_result.size} != ${file.size}`)
            need_to_download = true
        }
    }

    if (!need_to_download) return

    g_api.get_file_contents(file.download_url).then((data) => writeFile(full_path, Buffer.from(data)))
}

ipcMain.handle('sync_folder', async (_e, contents: Folder['contents'], path: string) => {
    console.log('Synchronizing to', path)
    const promises: Promise<unknown>[] = []
    await mkdir(path, { recursive: true })
    for (const folder of contents.folders) promises.push(sync_folder(folder, path))
    for (const file of contents.files) promises.push(sync_file(file, path))
    await Promise.all(promises)
    console.log(`Sync of ${path} done`)
})

ipcMain.handle('select_sync_folder', async (_e, course_name: string): Promise<string | false> => {
    const { filePaths: file_paths } = await dialog.showOpenDialog(g_window, {
        properties: ['openDirectory'],
        message: 'Choose folder to sync course files into',
        defaultPath: course_name
    })
    const selected_file_path = file_paths.pop()
    return selected_file_path ?? false
})

app.whenReady().then(createWindow)
