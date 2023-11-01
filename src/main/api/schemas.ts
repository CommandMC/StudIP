import { z } from 'zod'

const CourseNavigation = z.union([
    z.literal(false),
    z.object({
        attr: z.object({
            title: z.string()
        }),
        icon: z.object({
            role: z.string(),
            shape: z.string()
        }),
        important: z.boolean(),
        url: z.string()
    })
])

const CourseBase = z.object({
    admission_binding: z.boolean(),
    avatar: z.string(),
    children: z.array(z.unknown()),
    extra_navigation: z.boolean(),
    format: z.string(),
    group: z.number().int(),
    id: z.string(),
    is_deputy: z.boolean(),
    is_group: z.boolean(),
    is_hidden: z.boolean(),
    is_studygroup: z.boolean(),
    is_teacher: z.boolean(),
    name: z.string(),
    navigation: z.array(CourseNavigation),
    number: z.string()
})
type Course = z.infer<typeof CourseBase> & {
    parent: Course | null
}

const Course: z.ZodType<Course> = CourseBase.extend({
    parent: z.lazy(() => z.union([Course, z.null()]))
})

const MyCoursesResponse = z.object({
    courses: z.record(z.string(), Course)
})

const FilesObjectBase = z.object({
    id: z.string(),
    name: z.string(),
    author_name: z.string(),
    author_url: z.string(),
    chdate: z.number()
})

const RawFile = FilesObjectBase.extend({
    size: z.string().transform(Number),
    download_url: z.string(),
    downloads: z.string().transform(Number)
})
type RawFile = z.infer<typeof RawFile>

const RawFolder = FilesObjectBase
type RawFolder = z.infer<typeof RawFolder>

export { Course, MyCoursesResponse, RawFile, RawFolder }
