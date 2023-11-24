import { useEffect } from 'react'

import useUserState from '../state.ts'
import type { CourseMetadata, Folder } from '../../../main/api/interfaces.ts'

interface CourseData {
    course_info: CourseMetadata | false | undefined
    course_files: Folder['contents'] | false | undefined
}

/**
 * Fetches course data
 * @param course_id The course's id
 * @returns
 * - course_info: {@link CourseMetadata}, `false` if fetching data failed, or `undefined` if data is still being fetched
 * - course_files: {@link Folder#contents}, `false` if fetching files failed, or `undefined` if files are being fetched or aren't supported by this course
 */
function useCourseData(course_id: string): CourseData {
    const course_info = useUserState((state) => state.course_metadata[course_id])
    const course_files = useUserState((state) => state.course_files[course_id])

    useEffect(() => {
        if (course_info === undefined) useUserState.getState().fetch_course_metadata(course_id)
    }, [course_info])

    useEffect(() => {
        if (course_info && course_info.supports.files && course_files === undefined)
            useUserState.getState().fetch_course_files(course_id)
    }, [course_info, course_files])

    return { course_info, course_files }
}

export default useCourseData
