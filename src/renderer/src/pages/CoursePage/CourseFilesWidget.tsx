import { ReactNode, useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'

import FolderIcon from '@mui/icons-material/Folder'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import DownloadingIcon from '@mui/icons-material/Downloading'
import DownloadDoneIcon from '@mui/icons-material/DownloadDone'
import LoopIcon from '@mui/icons-material/Loop'
import DeleteIcon from '@mui/icons-material/Delete'

import useUserState from '../../state.ts'
import LoadingComponent from '../../components/LoadingComponent.tsx'
import { fuzzy_date } from '../../helpers/fuzzy_date.ts'
import type { File, Folder } from '../../../../main/api/interfaces.ts'

function file_size(size_in_bytes: number): string {
    const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB']
    let temp_size = size_in_bytes
    let unit_index = 0
    while (temp_size / 1024 > 1) {
        temp_size /= 1024
        unit_index++
    }
    return `${temp_size.toFixed(2)} ${units[unit_index]}`
}

interface FileWidgetProps {
    file: File
    on_file_click: (file: File) => unknown
}
function FileWidget({ file, on_file_click }: FileWidgetProps) {
    return (
        <Stack direction='row'>
            <Box sx={{ width: '40%' }}>
                <Box sx={{ cursor: 'pointer' }} onClick={() => on_file_click(file)}>
                    <Stack direction='row'>
                        <InsertDriveFileIcon />
                        {file.name}
                    </Stack>
                </Box>
            </Box>
            <Box sx={{ width: '30%' }}>
                <Link to={`/user/${file.author.username}`}>{file.author.full_name}</Link>
            </Box>
            {file_size(file.size)}
            <Box flexGrow={1} />
            <Box title={new Date(file.date_modified * 1000).toString()}>Modified: {fuzzy_date(file.date_modified)}</Box>
        </Stack>
    )
}

interface FolderWidgetProps {
    folder: Folder
    on_folder_click: (label: string, contents: Folder['contents']) => void
}
function FolderWidget({ folder, on_folder_click }: FolderWidgetProps) {
    return (
        <Stack direction='row'>
            <Box sx={{ width: '40%' }}>
                <Box sx={{ cursor: 'pointer' }} onClick={() => on_folder_click(folder.name, folder.contents)}>
                    <Stack direction='row' sx={{ overflow: 'hidden' }}>
                        <FolderIcon />
                        {folder.name}
                    </Stack>
                </Box>
            </Box>
            <Box sx={{ width: '30%' }}>
                <Link to={`/user/${folder.author.username}`}>{folder.author.full_name}</Link>
            </Box>
            {folder.contents.files.length} files, {folder.contents.folders.length} folders
            <Box flexGrow={1} />
            <Box title={new Date(folder.date_modified * 1000).toString()}>
                Modified: {fuzzy_date(folder.date_modified)}
            </Box>
        </Stack>
    )
}

interface CourseFilesWidgetProps {
    files: Folder['contents'] | false | undefined
    course_id: string
}
function CourseFilesWidget({ files, course_id }: CourseFilesWidgetProps) {
    const [selected_files_stack, set_selected_files_stack] = useState<{ label: string; files: Folder['contents'] }[]>(
        []
    )
    const [synchronized_folder, set_synchronized_folder] = useState<string | false | undefined>(undefined)
    const [is_synchronizing, set_is_synchronizing] = useState(false)

    useEffect(() => {
        const configured_sync_folder = window.localStorage.getItem(`${course_id}_file_sync`) ?? false
        set_synchronized_folder(configured_sync_folder)
        if (configured_sync_folder) on_sync_button_click(configured_sync_folder)
    }, [])

    useEffect(() => {
        if (files)
            set_selected_files_stack([
                {
                    label: '<root>',
                    files
                }
            ])
    }, [files])

    const on_folder_click = useCallback(
        (label: string, files: Folder['contents']) => {
            set_selected_files_stack([...selected_files_stack, { label, files }])
        },
        [selected_files_stack]
    )

    const on_file_click = useCallback(async (file: File) => {
        return IPC.download_file(file.name, file.download_url)
    }, [])

    const on_history_click = useCallback(
        (index: number) => {
            const new_selected_files = [...selected_files_stack]
            new_selected_files.length = index + 1
            set_selected_files_stack(new_selected_files)
        },
        [selected_files_stack]
    )

    const on_add_sync_button_click = useCallback(async () => {
        const current_course_obj = (useUserState.getState().courses || []).find((course) => course.id === course_id)
        if (!current_course_obj) return
        const selected_folder = await IPC.select_sync_folder(current_course_obj.name)
        if (!selected_folder) return
        window.localStorage.setItem(`${course_id}_file_sync`, selected_folder)
        set_synchronized_folder(selected_folder)
        on_sync_button_click(selected_folder)
    }, [])

    const on_sync_button_click = useCallback((sync_folder: string) => {
        if (!files) return
        set_is_synchronizing(true)
        IPC.sync_folder(files, sync_folder).then(() => set_is_synchronizing(false))
    }, [])

    const on_remove_sync_button_click = useCallback(() => {
        set_synchronized_folder(false)
    }, [])

    if (files === false) return <Paper>Failed to fetch files</Paper>
    if (files === undefined) return <LoadingComponent />
    if (synchronized_folder === undefined) return <LoadingComponent />

    const currently_displayed_filelist = selected_files_stack.at(-1)?.files
    if (!currently_displayed_filelist) return <LoadingComponent />

    return (
        <Paper>
            <Stack spacing={2}>
                <Stack direction='row'>
                    Currently selected:
                    <Stack sx={{ marginLeft: 1 }} direction='row'>
                        {selected_files_stack
                            .map<ReactNode>(({ label }, index) => (
                                <Box key={index} sx={{ cursor: 'pointer' }} onClick={() => on_history_click(index)}>
                                    {label}
                                </Box>
                            ))
                            .reduce((prev, curr) => [prev, ' / ', curr])}
                    </Stack>
                </Stack>
                <Stack>
                    {currently_displayed_filelist.folders.map((folder) => (
                        <FolderWidget key={folder.id} folder={folder} on_folder_click={on_folder_click} />
                    ))}
                    {currently_displayed_filelist.files.map((file) => (
                        <FileWidget key={file.id} file={file} on_file_click={on_file_click} />
                    ))}
                </Stack>
                <Stack direction='row'>
                    {!synchronized_folder && (
                        <>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                            >
                                Not synchronized
                            </Box>
                            <Box flexGrow={1} />
                            <Button color='success' onClick={on_add_sync_button_click}>
                                Synchronize
                            </Button>
                        </>
                    )}
                    {synchronized_folder && (
                        <>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}
                            >
                                {is_synchronizing ? <DownloadingIcon /> : <DownloadDoneIcon />}
                                Synchronizing to {synchronized_folder}
                            </Box>
                            <Box flexGrow={1} />
                            <Button
                                onClick={() => on_sync_button_click(synchronized_folder)}
                                disabled={is_synchronizing}
                                startIcon={<LoopIcon />}
                            >
                                Sync now
                            </Button>
                            <Button
                                onClick={on_remove_sync_button_click}
                                disabled={is_synchronizing}
                                startIcon={<DeleteIcon />}
                            >
                                Remove sync (keeps files)
                            </Button>
                        </>
                    )}
                </Stack>
            </Stack>
        </Paper>
    )
}

export default CourseFilesWidget
