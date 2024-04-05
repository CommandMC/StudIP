import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Course } from '../../main/api/schemas.ts'
import type { CourseMetadata, Folder, Message, MessageDetails } from '../../main/api/interfaces.ts'

interface UserState {
    is_logged_in: boolean
    set_logged_in: (new_value: boolean) => void
    courses: Course[] | false | undefined
    fetch_courses: () => Promise<void>
    course_metadata: Record<string, CourseMetadata | false>
    fetch_course_metadata: (course_id: string) => Promise<void>
    course_files: Record<string, Folder['contents'] | false>
    fetch_course_files: (course_id: string) => Promise<void>
    messages: Message[] | false | undefined
    fetch_messages: () => Promise<void>
    message_details: Record<string, MessageDetails | false>
    fetch_message_details: (message_id: string) => Promise<void>
}

const useUserState = create<UserState>()(
    persist(
        (set, get) => ({
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
            },

            messages: undefined,
            fetch_messages: async () => {
                const messages = await IPC.get_messages()
                set({ messages })
            },

            message_details: {},
            fetch_message_details: async (message_id) => {
                const message_details = await IPC.get_message_details(message_id)
                set({
                    message_details: { ...get().message_details, [message_id]: message_details }
                })
            }
        }),
        { name: 'user-store', storage: createJSONStorage(() => sessionStorage) }
    )
)

export default useUserState
