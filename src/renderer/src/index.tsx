import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'

import type { ComponentType } from 'react'

import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import './index.css'

function makeLazyFunc(importedFile: Promise<Record<'default', ComponentType>>) {
    return async () => {
        const component = await importedFile
        return { Component: component.default }
    }
}

const router = createHashRouter([
    {
        path: '/',
        lazy: makeLazyFunc(import('./pages/MainPage')),
        children: [
            {
                path: 'courses',
                lazy: makeLazyFunc(import('./pages/CoursesPage'))
            },
            {
                path: 'login',
                lazy: makeLazyFunc(import('./pages/LoginPage'))
            },
            {
                path: 'course/:course_id',
                lazy: makeLazyFunc(import('./pages/CoursePage'))
            },
            {
                path: 'course/:course_id/forum',
                lazy: makeLazyFunc(import('./pages/ForumPage'))
            },
            {
                path: 'course/:course_id/files',
                lazy: makeLazyFunc(import('./pages/CourseFilesPage'))
            },
            {
                path: 'messages',
                lazy: makeLazyFunc(import('./pages/MessagesPage'))
            },
            {
                path: 'message/:message_id',
                lazy: makeLazyFunc(import('./pages/MessagePage'))
            }
        ]
    }
])

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Missing element with id "root" in HTML')
const root = createRoot(rootElement)
root.render(<RouterProvider router={router} />)
