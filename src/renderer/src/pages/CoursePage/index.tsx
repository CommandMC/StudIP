import type { ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'

import Box from '@mui/material/Box'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CommentIcon from '@mui/icons-material/Comment'
import VisibilityIcon from '@mui/icons-material/Visibility'
import FolderIcon from '@mui/icons-material/Folder'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import DownloadingIcon from '@mui/icons-material/Downloading'
import DownloadDoneIcon from '@mui/icons-material/DownloadDone'
import DeleteIcon from '@mui/icons-material/Delete'
import LoopIcon from '@mui/icons-material/Loop'

import type { CourseMetadata, File, Folder } from '../../../../main/api/interfaces.ts'
import useUserState from '../../state.ts'
import LoadingComponent from '../../components/LoadingComponent.tsx'
import { useCallback, useEffect, useState } from 'react'

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

interface AnnouncementCardProps {
    announcement: CourseMetadata['announcements'][number]
}
function AnnouncementCard({ announcement }: AnnouncementCardProps) {
    return (
        <Accordion disableGutters id={announcement.title}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{announcement.title}</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <Stack direction='row' spacing={1}>
                    <Box flexGrow={1} />
                    <Typography>
                        <Link to={`/user/${announcement.author.username}`}>{announcement.author.full_name}</Link>
                    </Typography>
                    <Stack direction='row'>
                        <CommentIcon />
                        <Typography>{announcement.comments}</Typography>
                    </Stack>
                    <Stack direction='row'>
                        <VisibilityIcon />
                        <Typography>{announcement.visits}</Typography>
                    </Stack>
                </Stack>
                <div
                    dangerouslySetInnerHTML={{
                        __html: announcement.description
                    }}
                ></div>
            </AccordionDetails>
        </Accordion>
    )
}

const WEEKDAY_INDEX_TO_WEEKDAY = {
    0: 'Monday',
    1: 'Tuesday',
    2: 'Wednesday',
    3: 'Thursday',
    4: 'Friday',
    5: 'Saturday',
    6: 'Sunday'
}

interface TimeslotCardProps {
    timeslot: CourseMetadata['timeslots'][number]
}
function TimeslotCard({ timeslot }: TimeslotCardProps) {
    return (
        <Paper>
            <Stack direction='row'>
                <Box sx={{ width: '20%' }}>{timeslot.description}</Box>
                <Box>
                    {WEEKDAY_INDEX_TO_WEEKDAY[timeslot.day]}, {timeslot.start_time.hour}:
                    {timeslot.start_time.minute.toString().padStart(2, '0')} - {timeslot.end_time.hour}:
                    {timeslot.end_time.minute.toString().padStart(2, '0')}
                </Box>
                <Box flexGrow={1} />
                {timeslot.locations.length > 0 && (
                    <Stack direction='row' spacing={1}>
                        {timeslot.locations.map((location) => {
                            if (location.id)
                                return (
                                    <Link key={location.id} to={`/location/${location.id}`}>
                                        {location.name}
                                    </Link>
                                )
                            return location.name
                        })}
                    </Stack>
                )}
            </Stack>
        </Paper>
    )
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

function CoursePage() {
    const { course_id } = useParams()
    if (!course_id) return <></>

    const course_info = useUserState((state) => state.course_metadata[course_id])
    const course_files = useUserState((state) => state.course_files[course_id])

    useEffect(() => {
        if (course_info === undefined) useUserState.getState().fetch_course_metadata(course_id)
    }, [course_info])

    useEffect(() => {
        if (course_info && course_info.supports.files && course_files === undefined)
            useUserState.getState().fetch_course_files(course_id)
    }, [course_info, course_files])

    if (course_info === undefined) return <LoadingComponent />

    if (course_info === false) return <>Failed to fetch Course Info</>

    return (
        <Box sx={{ paddingLeft: 3, paddingRight: 3 }}>
            <Typography variant='h4'>{course_info.title}</Typography>
            {course_info.announcements.length > 0 && (
                <>
                    <Typography variant='h6' sx={{ marginTop: 3 }}>
                        Announcements:
                    </Typography>
                    {course_info.announcements.map((announcement, index) => (
                        <AnnouncementCard announcement={announcement} key={index} />
                    ))}
                </>
            )}
            <Typography variant='h6' sx={{ marginTop: 3 }}>
                Timeslots:
            </Typography>
            <Stack spacing={1}>
                {course_info.timeslots.map((timeslot, index) => (
                    <TimeslotCard timeslot={timeslot} key={index} />
                ))}
            </Stack>
            {course_info.supports.files && (
                <>
                    <Typography variant='h6' sx={{ marginTop: 3 }}>
                        Files:
                    </Typography>
                    <CourseFilesWidget files={course_files} course_id={course_id} />
                </>
            )}
        </Box>
    )
}

export default CoursePage
