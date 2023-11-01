import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider} from "react-router-dom";

import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import './index.css'

import MainPage from './pages/MainPage'
import CoursesPage from './pages/CoursesPage'
import LoginPage from './pages/LoginPage'
import CoursePage from './pages/CoursePage'
import ForumPage from './pages/ForumPage'

const router = createHashRouter([
    {
        path: "/",
        element: <MainPage />,
        children: [
            {
                path: "courses",
                element: <CoursesPage />
            },
            {
                path: 'login',
                element: <LoginPage />
            },
            {
                path: 'course/:course_id',
                element: <CoursePage />
            },
            {
                path: 'course/:course_id/forum',
                element: <ForumPage />
            }
        ]
    }
])

const root = createRoot(document.getElementById('root')!)
root.render(<RouterProvider router={router} />)
