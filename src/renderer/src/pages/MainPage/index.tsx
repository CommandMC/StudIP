import React, { useState, useEffect, useMemo } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'
import CssBaseline from '@mui/material/CssBaseline'

import AccountCircle from '@mui/icons-material/AccountCircle'

import LoadingComponent from '../../components/LoadingComponent'
import useUserState from '../../state.ts'

function MainPage() {
    const navigate = useNavigate()

    const is_logged_in = useUserState((state) => state.is_logged_in)
    const set_logged_in = useUserState((state) => state.set_logged_in)

    const [loading, setLoading] = useState(false)

    // Log in with session token if one's stored
    useEffect(() => {
        if (is_logged_in) return
        const session_token = window.localStorage.getItem('session_token')
        const session_host = window.localStorage.getItem('session_server')
        if (session_token && session_host) {
            setLoading(true)
            IPC.login_with_token(session_token, session_host).then((success) => {
                if (success) {
                    set_logged_in(true)
                } else {
                    window.localStorage.removeItem('session_token')
                    window.localStorage.removeItem('session_server')

                    // Try to automatically log in with stored credentials
                    IPC.decrypt_password().then((password_or_false) => {
                        const username = window.localStorage.getItem('last_username')
                        const server = window.localStorage.getItem('last_server')
                        if (!password_or_false || !username || !server) {
                            navigate('/login')
                            return
                        }
                        IPC.login(username, password_or_false, server).then((token_or_false) => {
                            if (!token_or_false) {
                                navigate('/login')
                                return
                            }
                            window.localStorage.setItem('session_token', token_or_false)
                            window.localStorage.setItem('session_server', server)
                            set_logged_in(true)
                        })
                    })
                }
                setLoading(false)
            })
        }
    }, [])

    // Switch between light/dark theme depending on user preference
    // TODO: Make this configurable
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
    const theme = useMemo(() => {
        return createTheme({
            palette: {
                mode: prefersDarkMode ? 'dark' : 'light'
            }
        })
    }, [prefersDarkMode])

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppBar position='sticky' sx={{ marginBottom: 3 }}>
                <Toolbar>
                    {is_logged_in && (
                        <Button
                            variant='contained'
                            color='success'
                            onClick={() => {
                                navigate('/courses')
                            }}
                        >
                            Courses
                        </Button>
                    )}
                    <Box sx={{ flexGrow: 1 }} />
                    <IconButton
                        onClick={() => {
                            navigate('/login')
                        }}
                    >
                        {' '}
                        <AccountCircle />{' '}
                    </IconButton>
                </Toolbar>
            </AppBar>
            <Outlet />
            {loading && <LoadingComponent />}
        </ThemeProvider>
    )
}

export default MainPage
