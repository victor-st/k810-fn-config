/**
 * UI util functions for fn-config tool
 */

/** Elements getters */
const getAccessBtn = () => document.getElementById("access-btn");
const getPageContents = () => document.getElementById("contents");
const getEnableFnToggle = () => document.getElementById("enableFn-cb");
const getFnStateDiv = () => document.getElementById("fn-state");
const getReportValueDiv = () => document.getElementById("report-value");
const getMsgDiv = () => document.getElementById("msg-text");

/**
 * Toggle UI between dark and lite themes
 *
 * @param cb A checkbox element
 */
function toggleTheme(cb) {
  document.body.setAttribute("class", cb.checked ? "dark" : "");
}

/**
 * Set the innerHTML of the given element and the given class, only if it's not nullish.
 *
 * @param element
 * @param innerHTML
 * @param className  The class to set, or undefined to skip setting element's css class
 */
function innerHTML(element, innerHTML, className) {
  if (element) {
    element.innerHTML = innerHTML;

    if (className !== undefined) {
      element.setAttribute("class", className);
    }
  }
}

/**
 * Show a text or HTML msg in the element #msg-text with the given css class
 *
 * @param className The class to set
 * @param msg The msg to show
 */
function show(className, msg) {
  innerHTML(getMsgDiv(), msg, className);
}

/** Show a success, info, or error text/HTML msg in the element #msg-text */
const success = (msg) => show("success", msg);
const info = (msg) => show("info", msg);
const error = (msg) => show("error", msg);

/**
 * Set the K810 keyboard's F-keys to Fn functions or special systems/apps functions
 *
 * @param cb A checkbox element
 */
async function setFnEnable(cb) {
  return setFnKeysEnabled(cb.checked);
}

/**
 * Check if K810 keyboard device is already granted access.  If so, set up handlers and return it.
 *
 * @return Promise of the K810 keyboard device that has been granted access permissions.
 */
async function openKeyboardIfAlreadyGrantedAccess() {
  try {
    const keyboard = await getKeyboardDeviceWithAccessGranted();
    if (keyboard) {
      // no await means no report of errors keyboard setup (e.g. open error) for the init case
      return setupKeyboardDevice();
    }
  } catch (e) {
    error(e?.message);
  }
}

/**
 * Request permissions to access the K810 keyboard device and open it.
 * This function must be called from a user action, e.g. on Button click, as required
 * by the WebHID requestDevice() api call.
 *
 * @return Promise of the K810 keyboard device that has been granted access permissions.
 */
async function requestKeyboardAccess() {
  try {
    const keyboard = await requestKeyboardDeviceAccess();
    info("K810 keyboard access granted");

    return await setupKeyboardDevice();
  } catch (e) {
    error(e?.message);
  }
}

/**
 * Revoke permissions previously granted to access the K810 keyboard device and close it.
 *
 * @return Promise<undefined> once the K810 keyboard device access permission has been revoked.
 */
async function revokeKeyboardAccess() {
  try {
    await closeKeyboard();
    await revokeKeyboardDeviceAccess();

    k810Keyboard = undefined;
    info("K810 keyboard access revoked");

    getAccessBtn()?.removeAttribute("class");
    getPageContents()?.setAttribute("class", "hidden");

    // FIXME: below line reloads the tool page to work around an issue where WebHID requestDevice()
    // returns a previously forgotten device with the old forgotten state that cannot be opened again.
    window.location.href = "./fn-config.pro.html";
  } catch (e) {
    error(e?.message);
  }
}

/**
 * A callback to handle the K810 keyboard's input report events.
 * It will be called with parameter `{ isFnEnabled, reportId, reportData }`
 * for further processing as desired.
 *
 * @param `{ isFnEnabled, reportId, reportData }`
 */
function keyboardInputReportCallback({
  isFnEnabled = undefined,
  reportId = -1,
  reportData = new Uint8Array(),
}) {
  if (isFnEnabled !== undefined) {
    // if undefined, event is not for setting Fn keys
    isFnEnabled
      ? innerHTML(getFnStateDiv(), "Yes", "success")
      : innerHTML(getFnStateDiv(), "No", "info");

    const enableFnCB = getEnableFnToggle();
    if (enableFnCB) {
      // @ts-ignore TS2339
      enableFnCB.checked = isFnEnabled;
    }
  }

  const reportDataAsStr = `${reportId.toString(16)}: ${Object.values(reportData)
    .map((d) => ("00" + d.toString(16)).substr(-2).toUpperCase())
    .join(" ")}`;
  innerHTML(getReportValueDiv(), reportDataAsStr, undefined);
}

/**
 * A callback to handle the K810 keyboard's connect and disconnect events.
 * It will be called with parameter `{ isOnConnect, device }`
 * for further processing as desired.
 *
 * @param `{ isOnConnect, device }`
 */
async function keyboardConnDisconnCallback({ isOnConnect, device }) {
  info(`K810 keyboard ${isOnConnect ? "connected" : "disconnected"}`);
  if (isOnConnect) {
    setKeyboardInputReportCallback(keyboardInputReportCallback);
    await openKeyboard();
    // on keyboard connect event, restore the Fn setting from the current toggle state
    const enableFnCB = getEnableFnToggle();
    await setFnEnable(enableFnCB);
  }
}

/**
 * Set up keyboard callbacks and open keyboard.  It should be called at app startup time.
 *
 * @return Promise of the K810 keyboard device that has been granted access permissions and performed initial setup to run the config tool
 */
async function setupKeyboardDevice() {
  setKeyboardConnectDisconnectCallback(keyboardConnDisconnCallback);

  setKeyboardInputReportCallback(keyboardInputReportCallback);
  const keyboard = await openKeyboard();
  info("K810 keyboard access granted and opened");

  getAccessBtn()?.setAttribute("class", "hidden");
  getPageContents()?.removeAttribute("class");

  // by default, enable Fn keys on startup to get an initial state, as there is no
  // WebHID api to query input report.  See https://github.com/WICG/webhid/issues/94
  await setFnKeysEnabled(true);

  return keyboard;
}
