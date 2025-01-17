import { useState, useEffect } from 'react';

const DEFAULT_ACTIVITY_EVENTS = [
    'click',
    'keydown',
    'DOMMouseScroll',
    'mousewheel',
    'mousedown',
    'touchstart',
    'touchmove',
    'focus',
];

const LOCAL_STORAGE_KEYS = {
    SIGNOUT_TIMER: 1,
}

const storeLastActivityIntoStorage = time => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.SIGNOUT_TIMER, time);
};

const getLastActivityFromStorage = () => {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.SIGNOUT_TIMER);
};

const getCurrentTime = () => new Date().getTime();

let scheduledSignoutTimeout, activityEventInterval;

const ActivityDetector =({ activityEvents, timeout, isActive, signOut, onIdle, onActive }) => {
    const [timeoutScheduled, setTimeoutScheduled] = useState(false);

    const scheduleSignout = time => {

        clearTimeout(scheduledSignoutTimeout);

        scheduledSignoutTimeout = setTimeout(() => {
            const scheduledInactivityCheck = getLastActivityFromStorage();
            const currentTime = getCurrentTime();

            if (currentTime >= scheduledInactivityCheck) {
                // if already passed scheduled time, do signout
                if (signOut)
                    signOut("User has loged out due to inactivity");
                if (onIdle) {
                    onIdle();
                }
            }
        }, time);
    };

    const resetTimer = () => {
        clearTimeout(activityEventInterval);
        activityEventInterval = setTimeout(() => setTimeoutScheduled(false), 200);
    };

    const handleUserActivityEvent = () => {
        resetTimer();
        if (onActive)
            onActive();
    };

    const handleStorageChangeEvent = ({ key, newValue }) => {
        if (key === LOCAL_STORAGE_KEYS.SIGNOUT_TIMER) {
            scheduleSignout(newValue - getCurrentTime());
        }
    };

    const stop = () => {
        detachListeners();
        clearTimeout(scheduledSignoutTimeout);
        clearTimeout(activityEventInterval);
    };

    const attachListeners = () => {
        activityEvents.forEach(eventName =>
            window.addEventListener(eventName, handleUserActivityEvent)
        );

        window.addEventListener('storage', handleStorageChangeEvent);
    };

    const detachListeners = () => {
        activityEvents.forEach(eventName =>
            window.removeEventListener(eventName, handleUserActivityEvent)
        );

        window.removeEventListener('storage', handleStorageChangeEvent);
    };

    useEffect(() => {
        //user loged in
        if (isActive) {
            attachListeners();
            // schedule initial timeout
            setTimeoutScheduled(false);
        }
        return () => {
            stop();
        };
    }, [isActive]);

    useEffect(() => {
        if (!timeoutScheduled) {
            // on every user activity schedule a new signout
            scheduleSignout(timeout);

            // store scheduled time for other clients
            storeLastActivityIntoStorage(getCurrentTime() + timeout);
        }
        setTimeoutScheduled(true);
    }, [timeoutScheduled, timeout]);

    return timeoutScheduled;
}

ActivityDetector.defaultProps = {
    activityEvents: DEFAULT_ACTIVITY_EVENTS,
    timeout: 5 * 60 * 1000,
    isActive: false
}

export default ActivityDetector;
