export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      return reg;
    } catch (err) {
      console.warn('Service worker registration failed:', err.message);
    }
  }
  return null;
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }
  return permission;
}

export async function showNativeNotification({ title, body, icon = '/favicon.png', url = '/dashboard', tag = null }) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const options = {
      body,
      icon,
      badge: icon,
      tag: tag || `sjdb-${Date.now()}`,
      data: { url },
      renotify: true,
      vibrate: [100, 50, 100]
    };

    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title || "St. John de Britto's Church ⛪", options);
        return true;
      }
    }

    const n = new Notification(title || "St. John de Britto's Church ⛪", options);
    n.onclick = (e) => {
      e.preventDefault();
      window.focus();
      if (url) window.location.href = url;
      n.close();
    };
    return true;
  } catch (err) {
    console.warn('Native notification error:', err.message);
    return false;
  }
}
