import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'

import Box from '@mui/material/Box'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import CommentIcon from '@mui/icons-material/Comment'
import VisibilityIcon from '@mui/icons-material/Visibility'
import OpenInBrowserIcon from '@mui/icons-material/OpenInBrowser'

import LoadingComponent from '../../components/LoadingComponent.tsx'
import CourseFilesWidget from '../../components/CourseFilesWidget.tsx'
import useCourseData from '../../helpers/useCourseData.ts'
import type { CourseMetadata } from '../../../../main/api/interfaces.ts'

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

function CoursePage() {
    const { course_id } = useParams()
    if (!course_id) return <></>

    const { course_info, course_files } = useCourseData(course_id)

    const open_course_page_on_studip = useCallback(() => {
        const session_server = localStorage.getItem('session_server')
        if (!session_server) return
        IPC.open_url(`${session_server}seminar_main.php?auswahl=${course_id}`)
    }, [course_id])

    if (course_info === undefined) return <LoadingComponent />
    if (course_info === false) return <>Failed to fetch Course Info</>

    return (
        <Box sx={{ paddingLeft: 3, paddingRight: 3 }}>
            <Box display='flex' justifyContent='space-between'>
                <Typography variant='h4'>{course_info.title}</Typography>
                <Tooltip title='Open on StudIP'>
                    <IconButton onClick={open_course_page_on_studip}>
                        <OpenInBrowserIcon />
                    </IconButton>
                </Tooltip>
            </Box>
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
