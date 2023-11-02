function fuzzy_date(date_in_the_past: Date | number): string {
    if (typeof date_in_the_past === 'number') date_in_the_past = new Date(date_in_the_past * 1000)
    const now = new Date()
    const time_difference = (now.valueOf() - date_in_the_past.valueOf()) / 1000
    if (time_difference < 5) return 'A moment ago'
    if (time_difference < 60) return `${time_difference} seconds ago`
    if (time_difference < 60 * 60) return `${Math.round(time_difference / 60)} minutes ago`
    if (time_difference < 60 * 60 * 24) return `${Math.round(time_difference / 60 / 60)} hours ago`

    const difference_in_months =
        now.getMonth() - date_in_the_past.getMonth() + (now.getFullYear() - date_in_the_past.getFullYear()) * 12
    if (difference_in_months < 2) return `${Math.round(time_difference / 60 / 60 / 24)} days ago`
    const difference_in_years = Math.round(difference_in_months / 12)
    if (difference_in_years < 1) return `${difference_in_months} months ago`
    return `${difference_in_years} years ago`
}

export { fuzzy_date }
