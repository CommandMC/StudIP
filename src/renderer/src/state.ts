import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Course } from '../../main/api/schemas.ts'
import type { CourseMetadata, Folder, Message, MessageDetails } from '../../main/api/interfaces.ts'

interface UserState {
    is_logged_in: boolean | undefined
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

type CacheState = Pick<UserState, 'courses' | 'course_metadata' | 'course_files' | 'messages' | 'message_details'>

const useUserState = create<UserState>()(
    persist(
        (set, get) => ({
            is_logged_in: undefined,
            set_logged_in: (val) => set({ is_logged_in: val }),

            courses: undefined,
            fetch_courses: async () => {
                const cached_courses = cached_user_data.getState().courses
                set({ courses: cached_courses })

                const courses = await IPC.get_courses()
                cached_user_data.setState({ courses })
                set({ courses })
            },

            course_metadata: {},
            fetch_course_metadata: async (course_id) => {
                const cached_metadata = cached_user_data.getState().course_metadata[course_id]
                if (cached_metadata)
                    set({
                        course_metadata: {
                            ...get().course_metadata,
                            [course_id]: cached_metadata
                        }
                    })

                const course_meta = await IPC.get_course(course_id)
                set({
                    course_metadata: {
                        ...get().course_metadata,
                        [course_id]: course_meta
                    }
                })
                cached_user_data.setState((state) => ({
                    course_metadata: { ...state.course_metadata, [course_id]: course_meta }
                }))
            },

            course_files: {},
            fetch_course_files: async (course_id) => {
                const cached_files = cached_user_data.getState().course_files[course_id]
                if (cached_files)
                    set({
                        course_files: {
                            ...get().course_files,
                            [course_id]: cached_files
                        }
                    })

                const course_files = await IPC.get_course_files(course_id)
                set({
                    course_files: { ...get().course_files, [course_id]: course_files }
                })
                cached_user_data.setState((state) => ({
                    course_files: { ...state.course_files, [course_id]: course_files }
                }))
            },

            messages: undefined,
            fetch_messages: async () => {
                const cached_messages = cached_user_data.getState().messages
                set({ messages: cached_messages })

                const messages = await IPC.get_messages()
                set({ messages })
                cached_user_data.setState({ messages })
            },

            message_details: {},
            fetch_message_details: async (message_id) => {
                const cached_details = cached_user_data.getState().message_details[message_id]
                if (cached_details)
                    set({
                        message_details: {
                            ...get().message_details,
                            [message_id]: cached_details
                        }
                    })

                const message_details = await IPC.get_message_details(message_id)
                set({
                    message_details: { ...get().message_details, [message_id]: message_details }
                })
                cached_user_data.setState((state) => ({
                    message_details: { ...state.message_details, [message_id]: message_details }
                }))
            }
        }),
        { name: 'user-store', storage: createJSONStorage(() => sessionStorage) }
    )
)

const cached_user_data = create<CacheState>()(
    persist(
        (_set) => ({
            courses: undefined,
            course_metadata: {},
            course_files: {},
            messages: undefined,
            message_details: {}
        }),
        { name: 'user-store', storage: createJSONStorage(() => localStorage) }
    )
)

export default useUserState
