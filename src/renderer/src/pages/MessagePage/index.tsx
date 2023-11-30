import { Link, useParams } from 'react-router-dom'
import useUserState from '../../state.ts'
import { useEffect } from 'react'
import LoadingComponent from '../../components/LoadingComponent.tsx'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'

import PersonIcon from '@mui/icons-material/Person'
import ReplyIcon from '@mui/icons-material/Reply'

function MessagePage() {
    const { message_id } = useParams()
    if (!message_id) return <></>

    const messages = useUserState(({ messages }) => messages)
    if (!Array.isArray(messages)) return <></>
    const this_message = messages.find((message) => message.id === message_id)
    if (!this_message) return <></>

    const message_details = useUserState(({ message_details }) => message_details[message_id])

    useEffect(() => {
        if (message_details === undefined) useUserState.getState().fetch_message_details(message_id)
    }, [message_details])

    if (message_details === undefined) return <LoadingComponent />
    if (message_details === false) return <>Failed to fetch message details</>

    return (
        <Card sx={{ padding: 1, margin: 2 }}>
            <Stack direction='row' spacing={2}>
                <Typography variant='h5'>{this_message.title}</Typography>
                <Box flexGrow={1} />
                <Stack direction='row'>
                    <PersonIcon />
                    <Link to={`/user/${this_message.author.username}`}>{this_message.author.full_name}</Link>
                </Stack>
                <Stack direction='row'>
                    <ReplyIcon />
                    {message_details.recipients}
                </Stack>
            </Stack>
            <div dangerouslySetInnerHTML={{ __html: message_details.content }}></div>
        </Card>
    )
}

export default MessagePage
