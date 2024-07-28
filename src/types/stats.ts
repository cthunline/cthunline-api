export type SocketRoomStat = {
    sessionId: number;
    userCount: number;
};

export type InstanceStats = {
    runningSessions: number;
    totalSessions: number;
    playingUsers: number;
    userCharacterCount: number;
    totalCharacterCount: number;
};
