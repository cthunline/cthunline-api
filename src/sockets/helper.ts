import DayJs from 'dayjs';

export const meta = (emitData: any) => ({
    dateTime: DayJs().toISOString(),
    ...emitData
});
