import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Course } from '../../../../main/api/schemas.ts'

import Card from '@mui/material/Card'
import Stack from '@mui/material/Stack'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'

import Newspaper from '@mui/icons-material/Newspaper'
import Message from '@mui/icons-material/Message'
import RecentActors from '@mui/icons-material/RecentActors'
import FileCopy from '@mui/icons-material/FileCopy'
import CalendarMonth from '@mui/icons-material/CalendarMonth'
import BarChart from '@mui/icons-material/BarChart'
import PhotoCamera from '@mui/icons-material/PhotoCamera'
import OndemandVideo from '@mui/icons-material/OndemandVideo'
import TaskAlt from '@mui/icons-material/TaskAlt'
import Article from '@mui/icons-material/Article'
import LiveTv from '@mui/icons-material/LiveTv'
import LinkIcon from '@mui/icons-material/Link'
import LoadingComponent from '../../components/LoadingComponent.tsx'
import useUserState from '../../state.ts'

interface CourseWidgetProps {
    course: Course
}

function getOnClickLink(icon_shape: string, course: Course): string {
    switch (icon_shape) {
        case 'news':
            return `/course/${course.id}`
        case 'files':
            return `/course/${course.id}/files`
        default:
            return ''
    }
}

function buildNavigationButton(nav: Course['navigation'][number], course: Course, index: number) {
    const key = `${course.id}_${index}`

    if (nav === false) return <Box key={key} sx={{ width: 24, height: 24 }} />

    let icon_shape = nav.icon.shape

    // StudIP plugins hardcode icon URLs for... some reason
    // Un-hardcode them here
    if (icon_shape.includes('meetings.svg')) icon_shape = 'meetings'
    else if (icon_shape.includes('opencast')) icon_shape = 'opencast'
    else if (icon_shape.includes('vips')) icon_shape = 'vips'

    let innerIcon = null
    switch (icon_shape) {
        case 'news':
            innerIcon = <Newspaper />
            break
        case 'forum':
            innerIcon = <Message />
            break
        case 'persons':
            innerIcon = <RecentActors />
            break
        case 'files':
            innerIcon = <FileCopy />
            break
        case 'schedule':
            innerIcon = <CalendarMonth />
            break
        case 'vote':
            innerIcon = <BarChart />
            break
        case 'meetings':
            innerIcon = <PhotoCamera />
            break
        case 'opencast':
            innerIcon = <OndemandVideo />
            break
        case 'vips':
            innerIcon = <TaskAlt />
            break
        case 'courseware':
        case 'wiki':
            innerIcon = <Article />
            break
        case 'video2':
            innerIcon = <LiveTv />
            break
        case 'link-extern':
            innerIcon = <LinkIcon />
            break
    }

    if (!innerIcon) {
        console.warn('Missing icon for', icon_shape)
        return <Box key={key} sx={{ width: 24, height: 24 }} />
    }

    const link = getOnClickLink(icon_shape, course)

    return (
        <Paper
            elevation={3}
            key={key}
            sx={{
                width: 24,
                height: 24,
                color: nav.important ? 'red' : undefined
            }}
            title={nav.attr.title}
        >
            {link ? (
                <Link to={link} style={{ textDecoration: 'none' }}>
                    {innerIcon}
                </Link>
            ) : (
                innerIcon
            )}
        </Paper>
    )
}

const CourseWidget = React.memo(({ course }: CourseWidgetProps) => {
    return (
        <Card>
            <Stack direction='row' spacing={1}>
                <img src={course.avatar} width={30} height={30} alt='Course Avatar' />
                <Stack sx={{ width: '50%' }} direction='row' spacing={0.5}>
                    <Link to={`/course/${course.id}`} style={{ textDecoration: 'none' }}>
                        {course.name}
                    </Link>
                </Stack>
                <Stack direction='row'>
                    {course.navigation.map((navigation, index) => buildNavigationButton(navigation, course, index))}
                </Stack>
            </Stack>
        </Card>
    )
})

function CoursesPage() {
    const courses = useUserState((state) => state.courses)

    useEffect(() => {
        if (courses === undefined) useUserState.getState().fetch_courses()
    }, [courses])

    if (courses === undefined) return <LoadingComponent />

    if (courses === false) return <>Failed to fetch courses</>

    return (
        <Stack sx={{ margin: 3 }} spacing={2}>
            {courses.map((course) => (
                <CourseWidget key={course.id} course={course} />
            ))}
        </Stack>
    )
}

export default CoursesPage
