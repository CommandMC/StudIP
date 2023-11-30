/* eslint-disable @typescript-eslint/no-unsafe-return */
import { contextBridge, ipcRenderer } from 'electron'
import type { Course } from '../main/api/schemas.ts'
import type { CourseMetadata, Folder, Message, MessageDetails } from '../main/api/interfaces.ts'

const ipc = {
    login: async (username: string, password: string, server: string): Promise<string | false> =>
        ipcRenderer.invoke('login', username, password, server),
    login_with_token: async (token: string, host: string): Promise<boolean> =>
        ipcRenderer.invoke('login_with_token', token, host),
    get_courses: async (): Promise<Course[] | false> => ipcRenderer.invoke('get_courses'),
    get_course: async (course_id: string): Promise<CourseMetadata | false> =>
        ipcRenderer.invoke('get_course', course_id),
    get_course_files: async (course_id: string): Promise<Folder['contents'] | false> =>
        ipcRenderer.invoke('get_course_files', course_id),
    download_file: async (file_name: string, download_url: string): Promise<void> =>
        ipcRenderer.invoke('download_file', file_name, download_url),
    sync_folder: async (contents: Folder['contents'], path: string) =>
        ipcRenderer.invoke('sync_folder', contents, path),
    select_sync_folder: async (course_name: string): Promise<string | false> =>
        ipcRenderer.invoke('select_sync_folder', course_name),
    encrypt_password: async (password: string): Promise<void> => ipcRenderer.invoke('encrypt_password', password),
    decrypt_password: async (): Promise<string | false> => ipcRenderer.invoke('decrypt_password'),
    get_messages: async (): Promise<Message[] | false> => ipcRenderer.invoke('get_messages'),
    get_message_details: async (message_id: string): Promise<MessageDetails> =>
        ipcRenderer.invoke('get_message_details', message_id)
}

contextBridge.exposeInMainWorld('IPC', ipc)

export { ipc }
