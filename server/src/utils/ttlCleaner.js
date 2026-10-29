// TTL Seat Lock Expiration Manager

export const cleanExpiredLocksForShow = (show) => {
  if (!show || !show.tickets) return false;
  let modified = false;
  const now = Date.now();

  Object.keys(show.tickets).forEach((seatId) => {
    const seat = show.tickets[seatId];
    if (seat.status === 'locked') {
      const lockTime = new Date(seat.lockedUntil).getTime();
      if (!lockTime || lockTime <= now) {
        seat.status = 'available';
        seat.lockedBy = null;
        seat.lockedUntil = null;
        modified = true;
      }
    }
  });

  return modified;
};

// Periodic cleaner for MongoDB and In-Memory store
export const startTTLWatchdog = (ShowModel, isMongo, memoryDB) => {
  setInterval(async () => {
    try {
      if (isMongo()) {
        const shows = await ShowModel.find({});
        for (const show of shows) {
          const changed = cleanExpiredLocksForShow(show);
          if (changed) {
            show.markModified('tickets');
            await show.save();
          }
        }
      } else {
        memoryDB.shows.forEach((show) => {
          cleanExpiredLocksForShow(show);
        });
      }
    } catch (err) {
      console.error('[TTL Watchdog Error]', err.message);
    }
  }, 15000); // Check every 15 seconds
};
