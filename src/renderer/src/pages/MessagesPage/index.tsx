import { useEffect } from 'react'

import Stack from '@mui/material/Stack'
import Card from '@mui/material/Card'
import Box from '@mui/material/Box'

import useUserState from '../../state.ts'
import LoadingComponent from '../../components/LoadingComponent.tsx'

import type { Message } from '../../../../main/api/interfaces.ts'
import { Link } from 'react-router-dom'
import { fuzzy_date } from '../../helpers/fuzzy_date.ts'

interface MessageWidgetProps {
    message: Message
}
function MessageWidget({ message }: MessageWidgetProps) {
    return (
        <Card>
            <Stack direction='row' spacing={1}>
                <Box width='60%'>
                    <Link to={`/message/${message.id}`}>{message.title}</Link>
                </Box>
                <Box width='20%'>
                    <Link to={`/user/${message.author.username}`}>{message.author.full_name}</Link>
                </Box>
                <Box width='20%'>{fuzzy_date(new Date(message.send_time))}</Box>
            </Stack>
        </Card>
    )
}

function MessagesPage() {
    const messages = useUserState(({ messages }) => messages)

    useEffect(() => {
        if (messages === undefined) useUserState.getState().fetch_messages()
    }, [messages])

    if (messages === undefined) return <LoadingComponent />
    if (messages === false) return <>Failed to fetch messages</>

    return (
        <Stack sx={{ margin: 3 }} spacing={2}>
            {messages.map((message, index) => (
                <MessageWidget key={index} message={message} />
            ))}
        </Stack>
    )
}

export default MessagesPage
