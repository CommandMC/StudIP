import Paper from "@mui/material/Paper";
import CircularProgress from "@mui/material/CircularProgress";

function LoadingComponent() {
    return <Paper
        elevation={3}
        sx={{ width: '100%', minHeight: '100px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
    >
        <CircularProgress />
    </Paper>
}

export default LoadingComponent
