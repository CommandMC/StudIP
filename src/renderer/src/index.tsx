import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'

import LoadingComponent from './components/LoadingComponent.tsx'

import type { ComponentType } from 'react'

import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import './index.css'

async function lazyDefaultExport(importedFile: Promise<Record<'default', ComponentType>>) {
    const component = await importedFile
    return { Component: component.default }
}

const router = createHashRouter([
    {
        path: '/',
        hydrateFallbackElement: <LoadingComponent />,
        lazy: () => lazyDefaultExport(import('./pages/MainPage')),
        children: [
            {
                path: 'courses',
                lazy: () => lazyDefaultExport(import('./pages/CoursesPage'))
            },
            {
                path: 'login',
                lazy: () => lazyDefaultExport(import('./pages/LoginPage'))
            },
            {
                path: 'course/:course_id',
                lazy: () => lazyDefaultExport(import('./pages/CoursePage'))
            },
            {
                path: 'course/:course_id/forum',
                lazy: () => lazyDefaultExport(import('./pages/ForumPage'))
            },
            {
                path: 'course/:course_id/files',
                lazy: () => lazyDefaultExport(import('./pages/CourseFilesPage'))
            },
            {
                path: 'messages',
                lazy: () => lazyDefaultExport(import('./pages/MessagesPage'))
            },
            {
                path: 'message/:message_id',
                lazy: () => lazyDefaultExport(import('./pages/MessagePage'))
            }
        ]
    }
])

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing element with id "root" in HTML')
const root = createRoot(rootElement)
root.render(<RouterProvider router={router} />)
