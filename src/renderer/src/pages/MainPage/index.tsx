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
import ButtonGroup from '@mui/material/ButtonGroup'

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
        if (is_logged_in !== undefined) return
        const session_token = localStorage.getItem('session_token')
        const session_host = localStorage.getItem('session_server')
        if (session_token && session_host) {
            setLoading(true)
            IPC.login_with_token(session_token, session_host).then((success) => {
                if (success) {
                    set_logged_in(true)
                } else {
                    localStorage.removeItem('session_token')
                    localStorage.removeItem('session_server')

                    // Try to automatically log in with stored credentials
                    IPC.decrypt_password().then((password_or_false) => {
                        const username = localStorage.getItem('last_username')
                        const server = localStorage.getItem('last_server')
                        if (!password_or_false || !username || !server) {
                            navigate('/login')
                            return
                        }
                        IPC.login(username, password_or_false, server).then((token_or_false) => {
                            if (!token_or_false) {
                                navigate('/login')
                                return
                            }
                            localStorage.setItem('session_token', token_or_false)
                            localStorage.setItem('session_server', server)
                            set_logged_in(true)
                        })
                    })
                }
                setLoading(false)
            })
        }
    }, [is_logged_in])

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

    // Send signal to Backend to let it know we're done loading
    useEffect(() => {
        IPC.ready()
    }, [])

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <AppBar position='sticky' sx={{ marginBottom: 3 }}>
                <Toolbar>
                    {is_logged_in !== false && (
                        <ButtonGroup>
                            <Button
                                variant='contained'
                                color='success'
                                onClick={() => {
                                    navigate('/courses')
                                }}
                            >
                                Courses
                            </Button>
                            <Button
                                variant='contained'
                                color='success'
                                onClick={() => {
                                    navigate('/messages')
                                }}
                            >
                                Messages
                            </Button>
                        </ButtonGroup>
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
