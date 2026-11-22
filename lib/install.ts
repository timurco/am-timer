export const INSTALL_EVENT = 'timer-install';
export const INSTALL_DISMISS_KEY = 'timer-install-dismissed';
export const INSTALL_SCRIPT = `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__timerInstall=e;window.dispatchEvent(new Event('${INSTALL_EVENT}'))});window.addEventListener('appinstalled',function(){window.__timerInstall=null})`;
