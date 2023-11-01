import { create } from 'zustand'
import type { Course } from '../../main/api/schemas.ts'
import type { CourseMetadata, Folder } from '../../main/api/interfaces.ts'

interface UserState {
    is_logged_in: boolean
    set_logged_in: (new_value: boolean) => void
    courses: Course[] | false | undefined
    fetch_courses: () => Promise<void>
    course_metadata: Record<string, CourseMetadata | false>
    fetch_course_metadata: (course_id: string) => Promise<void>
    course_files: Record<string, Folder['contents'] | false>
    fetch_course_files: (course_id: string) => Promise<void>
}

const useUserState = create<UserState>((set, get) => ({
    is_logged_in: false,
    set_logged_in: (val) => set({ is_logged_in: val }),

    courses: undefined,
    fetch_courses: async () => {
        const courses = await IPC.get_courses()
        set({ courses })
    },

    course_metadata: {},
    fetch_course_metadata: async (course_id) => {
        const course_meta = await IPC.get_course(course_id)
        set({
            course_metadata: {
                ...get().course_metadata,
                [course_id]: course_meta
            }
        })
    },

    course_files: {},
    fetch_course_files: async (course_id) => {
        const course_files = await IPC.get_course_files(course_id)
        set({
            course_files: { ...get().course_files, [course_id]: course_files }
        })
    }
}))

export default useUserState
