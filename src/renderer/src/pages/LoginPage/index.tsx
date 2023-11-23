import { useState, type FormEventHandler } from 'react'

import TextField from '@mui/material/TextField'
import Container from '@mui/material/Container'
import Stack from '@mui/material/Stack'
import Autocomplete from '@mui/material/Autocomplete'
import Snackbar from '@mui/material/Snackbar'
import LoadingButton from '@mui/lab/LoadingButton'
import useUserState from '../../state.ts'

const KNOWN_STUDIP_HOSTS = ['https://studip.uni-osnabrueck.de/']

function LoginPage() {
    const [loggingIn, setLoggingIn] = useState(false)
    const [successfullyLoggedIn, setSuccessfullyLoggedIn] = useState(false)

    const set_logged_in = useUserState((state) => state.set_logged_in)

    const login: FormEventHandler = (event) => {
        const target = event.target as EventTarget & Record<'username' | 'password' | 'server', HTMLInputElement>
        IPC.login(target.username.value, target.password.value, target.server.value).then((token_or_false) => {
            if (token_or_false) {
                window.localStorage.setItem('session_token', token_or_false)
                window.localStorage.setItem('session_server', target.server.value)
                window.localStorage.setItem('last_username', target.username.value)
                window.localStorage.setItem('last_server', target.server.value)
                set_logged_in(true)
                setSuccessfullyLoggedIn(true)
                setTimeout(() => setSuccessfullyLoggedIn(false), 5000)
            }
            setLoggingIn(false)
        })
        event.preventDefault()
    }

    return (
        <>
            <form onSubmit={login}>
                <Container>
                    <Stack spacing={2}>
                        <TextField
                            required
                            label='Username'
                            name='username'
                            defaultValue={window.localStorage.getItem('last_username')}
                        />
                        <TextField required type='password' label='Password' name='password' />
                        <Autocomplete
                            freeSolo
                            options={KNOWN_STUDIP_HOSTS}
                            defaultValue={window.localStorage.getItem('last_server')}
                            renderInput={(params) => <TextField {...params} label='Server' name='server' required />}
                        />
                        <LoadingButton loading={loggingIn} type='submit' variant='contained' color='success'>
                            Login
                        </LoadingButton>
                    </Stack>
                </Container>
            </form>
            <Snackbar
                open={successfullyLoggedIn}
                onClose={() => setSuccessfullyLoggedIn(false)}
                message='Successfully logged in'
            />
        </>
    )
}

export default LoginPage
