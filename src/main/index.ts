import { join } from 'path'
import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { createWriteStream } from 'fs'

import { StudIPApi } from './api'
import appIcon from '../../build/icon.png?asset'

let g_api: StudIPApi
let g_window: BrowserWindow

function createWindow() {
    g_window = new BrowserWindow({
        width: 1280,
        height: 720,
        icon: appIcon,
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
    const data_stream = await g_api.get_file_contents(download_url)
    const write_stream = createWriteStream(file_path)
    data_stream.pipe(write_stream)
})

app.whenReady().then(createWindow)
