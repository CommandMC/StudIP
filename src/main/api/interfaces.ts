interface HourAndMinute {
    hour: number
    minute: number
}

interface Location {
    id?: string
    name: string
}

interface Timeslot {
    // Weekday index (starting at Monday)
    day: 0 | 1 | 2 | 3 | 4 | 5 | 6
    start_time: HourAndMinute
    end_time: HourAndMinute
    description: string
    locations: Location[]
}

interface User {
    username: string
    full_name: string
}

interface Announcement {
    title: string
    description: string
    author: User
    publish_date: number
    visits: number
    comments: number
}

interface CourseMetadata {
    title: string
    timeslots: Timeslot[]
    announcements: Announcement[]
    supports: Record<'files', boolean>
}

interface FilesObjectBase {
    name: string
    id: string
    author: User
}
interface File extends FilesObjectBase {
    date_modified: number
    download_url: string
    download_count: number
    size: number
}

interface Folder extends FilesObjectBase {
    date_created: number
    contents: { files: File[]; folders: Folder[] }
}

export { CourseMetadata, File, Folder }
