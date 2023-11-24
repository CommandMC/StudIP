import { useParams } from 'react-router-dom'

import useCourseData from '../../helpers/useCourseData.ts'
import CourseFilesWidget from '../../components/CourseFilesWidget.tsx'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

function CourseFilesPage() {
    const { course_id } = useParams()
    if (!course_id) return <></>

    const { course_files } = useCourseData(course_id)
    return (
        <Box margin={1}>
            <Typography variant='h5'>Course Files:</Typography>
            <CourseFilesWidget files={course_files} course_id={course_id} />
        </Box>
    )
}

export default CourseFilesPage
