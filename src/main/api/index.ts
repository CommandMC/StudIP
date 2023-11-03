import { Course, MyCoursesResponse, RawFile, RawFolder } from './schemas.ts'
import type { CourseMetadata, File, Folder } from './interfaces.ts'

const SECURITY_TOKEN_REGEX = /input type="hidden" name="security_token" value="(.*?)"/
const LOGIN_TICKET_REGEX = /input type="hidden" name="login_ticket" value="(.*?)"/
const COURSES_DATA_REGEX = /window.STUDIP.MyCoursesData = (.*?);/m
const COURSE_TITLE_REGEX = /<div id="context-title">\s*<img .*?>\s*(.*)/m
const COURSE_TIMESLOTS_REGEX = /<dt>Zeit \/ Veranstaltungsort<\/dt>\s*<dd>\s*(.*?)\s*<\/dd>/m
const COURSE_FILES_SUPPORTED_REGEX = /dispatch.php\/course\/files/m
const TIMESLOT_DATA_REGEX = /(.*?): (\d*?):(\d*?) - (\d*?):(\d*?),.*<em>(.*?)<\/em>/m
const TIMESLOT_LOCATIONS_REGEX = /.*?index\/(.*?)\?.*?">(.*?)</g
const TIMESLOT_SIMPLE_LOCATION_REGEX = /Ort: (.*)/
const COURSE_ANNOUNCEMENTS_REGEX = /(<article.*news[\s\S]*?<\/article>)/gm
const ANNOUNCEMENT_TITLE_REGEX = /<img .*news\.svg.*?>\s*(.*?)\s*<\/a>/m
const ANNOUNCEMENT_AUTHOR_REGEX = /news_user.*username=(.*)".*\s*(.*?)\s*</m
const ANNOUNCEMENT_DATE_REGEX = /news_date.*\s*(\d*)\.(\d*)\.(\d*)/m
const ANNOUNCEMENT_VISITS_REGEX = /news_visits.*\s*(\d*)/m
const ANNOUNCEMENT_COMMENTS_REGEX = /news_comments.*\s.*?>\s*(\d*)/m
const ANNOUNCEMENT_DESCRIPTION_REGEX = /formatted-content.*?>(.*?)<\/div/m
const FILES_FILE_DATA_REGEX = /data-files="(\[.*])"/m
const FILES_FOLDER_DATA_REGEX = /data-folders="(\[.*])"/m
const FILE_AUTHOR_USERNAME_REGEX = /username=(.*)/

const WEEKDAY_TO_INDEX_MAP: Record<string, CourseMetadata['timeslots'][number]['day']> = {
    Montag: 0,
    Dienstag: 1,
    Mittwoch: 2,
    Donnerstag: 3,
    Freitag: 4,
    Samstag: 5,
    Sonntag: 6
}

class StudIPApi {
    private m_token: string | null
    private readonly m_host: string

    public constructor(host: string, token: string | null = null) {
        this.m_host = host
        this.m_token = token
    }

    private get_request_headers() {
        const headers: HeadersInit = {}
        if (this.m_token) headers.Cookie = `Seminar_Session=${this.m_token}`
        return headers
    }

    private async _get(url: string, include_host = true): Promise<Response> {
        const full_url = include_host ? this.m_host + url : url
        console.log('GET', full_url)
        const headers = this.get_request_headers()
        return fetch(full_url, {
            headers
        })
    }

    private async _post(url: string, data: unknown, include_host = true): Promise<Response> {
        const full_url = include_host ? this.m_host + url : url
        console.log('POST', full_url, data)
        const headers = this.get_request_headers()
        return fetch(full_url, {
            headers,
            method: 'POST',
            body: JSON.stringify(data)
        })
    }

    public async verify_token(): Promise<boolean> {
        const profile_res = await this._get('dispatch.php/profile')
        const profile_text = await profile_res.text()
        return !profile_text.includes('<form name="login"')
    }

    public get token() {
        return this.m_token
    }

    public async login_with_token(token: string): Promise<boolean> {
        this.m_token = token

        const login_success = await this.verify_token()
        if (login_success) return true

        this.m_token = null
        return false
    }

    public async login(username: string, password: string): Promise<boolean> {
        const root_response = await this._get('index.php')
        const response_text = await root_response.text()
        const security_token = response_text.match(SECURITY_TOKEN_REGEX)?.[1]
        const login_ticket = response_text.match(LOGIN_TICKET_REGEX)?.[1]
        if (!security_token || !login_ticket) return false

        const post_response = await this._post('index.php', {
            security_token,
            login_ticket,
            resolution: '1920x1080',
            loginname: username,
            password,
            login: ''
        })

        const set_cookie_header = post_response.headers.get('set-cookie')
        if (!set_cookie_header) return false
        let login_token: string | null = null
        for (const set_cookie_str of set_cookie_header) {
            const maybe_token = set_cookie_str.match(/Seminar_Session=(.*?);/)?.[1]
            if (maybe_token) {
                login_token = maybe_token
                break
            }
        }

        if (!login_token) return false

        this.m_token = login_token
        return true
    }

    public async get_courses(): Promise<Course[] | false> {
        const courses_res = await this._get('dispatch.php/my_courses')
        const courses_text = await courses_res.text()
        const courses_json = courses_text.match(COURSES_DATA_REGEX)?.[1]
        if (!courses_json) return false
        try {
            const courses_response_parsed = MyCoursesResponse.parse(JSON.parse(courses_json))
            return Object.values(courses_response_parsed.courses)
        } catch (e) {
            console.log(e)
            return false
        }
    }

    public async get_course(course_id: string): Promise<CourseMetadata | false> {
        const course_res = await this._get(`dispatch.php/course/overview?cid=${course_id}`)
        const course_text = await course_res.text()

        let course_title = course_text.match(COURSE_TITLE_REGEX)?.[1]
        if (!course_title) return false
        course_title = course_title.split(' ').filter(Boolean).join(' ')

        const timeslots_match = course_text.match(COURSE_TIMESLOTS_REGEX)?.[1]
        if (!timeslots_match) return false

        const timeslots: CourseMetadata['timeslots'] = []
        for (const timeslot of timeslots_match.split('<br>')) {
            const timeslot_data_match = timeslot.match(TIMESLOT_DATA_REGEX)
            if (!timeslot_data_match) continue
            const [, weekday_name, start_hour_str, start_minute_str, end_hour_str, end_minute_str, description] =
                timeslot_data_match
            if (
                !weekday_name ||
                !start_hour_str ||
                !start_minute_str ||
                !end_hour_str ||
                !end_minute_str ||
                !description
            )
                continue
            const weekday_id = WEEKDAY_TO_INDEX_MAP[weekday_name]
            if (weekday_id === undefined) continue

            const start_hour = Number(start_hour_str)
            const start_minute = Number(start_minute_str)
            const end_hour = Number(end_hour_str)
            const end_minute = Number(end_minute_str)

            const location_matches = timeslot.matchAll(TIMESLOT_LOCATIONS_REGEX)
            const locations: CourseMetadata['timeslots'][number]['locations'] = []
            for (const location_match of location_matches) {
                const [, location_id, location_name] = location_match
                if (!location_id || !location_name) continue
                locations.push({
                    id: location_id,
                    name: location_name
                })
            }

            if (!locations.length) {
                const simple_match = timeslot.match(TIMESLOT_SIMPLE_LOCATION_REGEX)?.[1]
                if (simple_match)
                    locations.push({
                        name: simple_match
                    })
            }

            timeslots.push({
                day: weekday_id,
                start_time: {
                    hour: start_hour,
                    minute: start_minute
                },
                end_time: {
                    hour: end_hour,
                    minute: end_minute
                },
                description,
                locations
            })
        }

        const announcements_matches = course_text.matchAll(COURSE_ANNOUNCEMENTS_REGEX)
        const announcements: CourseMetadata['announcements'] = []
        for (const match of announcements_matches) {
            const content = match[1]
            if (!content) continue
            const title = content.match(ANNOUNCEMENT_TITLE_REGEX)?.[1]?.replaceAll('&quot;', '"')
            const [, author_username, author_full_name] = content.match(ANNOUNCEMENT_AUTHOR_REGEX) ?? []
            const [, published_day, published_month, published_year] = content.match(ANNOUNCEMENT_DATE_REGEX) ?? []
            const visits_str = content.match(ANNOUNCEMENT_VISITS_REGEX)?.[1]
            const comments_str = content.match(ANNOUNCEMENT_COMMENTS_REGEX)?.[1]
            const description = content.match(ANNOUNCEMENT_DESCRIPTION_REGEX)?.[1]

            if (
                !title ||
                !author_username ||
                !author_full_name ||
                !published_day ||
                !published_month ||
                !published_year ||
                !visits_str ||
                !description
            )
                continue

            const publish_date = new Date(
                Number(published_year),
                Number(published_month) - 1,
                Number(published_day)
            ).valueOf()
            const visits = Number(visits_str)
            const comments = Number(comments_str ?? 0)

            description.replaceAll('<br />', '\n')
            announcements.push({
                title,
                description,
                publish_date,
                visits,
                author: {
                    username: author_username,
                    full_name: author_full_name
                },
                comments
            })
        }

        const files_supported = !!course_text.match(COURSE_FILES_SUPPORTED_REGEX)

        return {
            title: course_title,
            timeslots,
            announcements,
            supports: {
                files: files_supported
            }
        }
    }

    public async get_course_files(course_id: string): Promise<false | Folder['contents']> {
        return this.fetch_folder_contents('', course_id)
    }

    private async fetch_folder_contents(folder_id: string, course_id: string): Promise<false | Folder['contents']> {
        const files_response = await this._get(`dispatch.php/course/files/index/${folder_id}?cid=${course_id}`)
        const files_text = await files_response.text()
        let files_data = files_text.match(FILES_FILE_DATA_REGEX)?.[1]
        let folder_data = files_text.match(FILES_FOLDER_DATA_REGEX)?.[1]

        if (!files_data || !folder_data) return false

        files_data = files_data
            .replaceAll('&quot;', '"')
            .replaceAll('&lt;', '<')
            .replaceAll('&gt;', '>')
            .replaceAll('&amp;', '&')
        folder_data = folder_data
            .replaceAll('&quot;', '"')
            .replaceAll('&lt;', '<')
            .replaceAll('&gt;', '>')
            .replaceAll('&amp;', '&')

        const files: File[] = []
        let raw_files: RawFile[] = []
        try {
            raw_files = RawFile.array().parse(JSON.parse(files_data))
        } catch {}
        for (const raw_file of raw_files) {
            const file_author_username = raw_file.author_url.match(FILE_AUTHOR_USERNAME_REGEX)?.[1]
            if (!file_author_username) continue

            files.push({
                id: raw_file.id,
                name: raw_file.name,
                download_url: raw_file.download_url,
                download_count: raw_file.downloads,
                size: raw_file.size,
                date_modified: raw_file.chdate,
                author: {
                    username: file_author_username,
                    full_name: raw_file.author_name
                }
            })
        }

        const folders: Folder[] = []
        const promises: Promise<unknown>[] = []
        let raw_folders: RawFolder[] = []
        try {
            raw_folders = RawFolder.array().parse(JSON.parse(folder_data))
        } catch {}
        for (const raw_folder of raw_folders) {
            const folder_author_username = raw_folder.author_url.match(FILE_AUTHOR_USERNAME_REGEX)?.[1]
            if (!folder_author_username) continue

            promises.push(
                this.fetch_folder_contents(raw_folder.id, course_id).then((folder_contents) => {
                    if (!folder_contents) return
                    folders.push({
                        id: raw_folder.id,
                        name: raw_folder.name,
                        date_created: raw_folder.chdate,
                        author: {
                            username: folder_author_username,
                            full_name: raw_folder.author_name
                        },
                        contents: folder_contents
                    })
                })
            )
        }
        await Promise.all(promises)

        folders.sort((a, b) => a.name.localeCompare(b.name))
        files.sort((a, b) => a.name.localeCompare(b.name))

        return {
            files,
            folders
        }
    }

    public async get_file_contents(download_url: string) {
        return this._get(download_url, false).then((res) => res.arrayBuffer())
    }
}

export { StudIPApi }
