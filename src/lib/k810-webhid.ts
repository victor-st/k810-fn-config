/**
 * WebHID util functions for k810 keyboard device.
 * See WebHID API spec: https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API
 *
 * May be packaged as a module and published to npm as a library for general sharing.
 */

/** Logitech K810 keyboard device IDs.  Adjust for other Logitech keyboards for for other vendors. */
const k810Ids = {
  vendorId: 0x46d, // 1133 - Logitech
  productId: 0xb319, // 45849 - K810 keyboard device id
  usagePage: 0x01, // Generic Desktop page - see details in https://usb.org/document-library/hid-usage-tables-13
  usage: 0x06, // Keyboard type
};

/** A global var holding the K810 keyboard device that has been granted accesses */
let k810Keyboard;

/** misc util functions */
function ensureKeyboardRequested() {
  if (!k810Keyboard) {
    throw new Error("Keyboard is not granted access yet");
  }
}

function ensureKeyboardRequestedAndOpened() {
  ensureKeyboardRequested();
  if (!k810Keyboard.opened) {
    throw new Error("Keyboard is not opened yet");
  }
}

function getHID() {
  // @ts-ignore TS2339
  const hid = navigator?.hid;
  if (!hid) {
    throw new Error(
      "This web browser/version does support the WebHID api.<p>Please use a browser version that supports the WebHID api.  e.g. Chrome, Edge or Opera - <a href='https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API#browser_compatibility' target='_blank'>see here</a>"
    );
  }
  return hid;
}

/**
 * Get devices already granted accesses and return K810 keyboard if it's
 * in the granted access list.
 *
 * @return Promise of the K810 keyboard HIDDevice that already has access permission granted
 */
async function getKeyboardDeviceWithAccessGranted() {
  const hid = getHID();
  const devices = await hid.getDevices();
  const keyboard = devices?.find(
    ({ vendorId, productId }) =>
      vendorId === k810Ids.vendorId && productId === k810Ids.productId
  );
  k810Keyboard = keyboard;
  return keyboard;
}

/**
 * Locate the K810 keyboard device, if it exists, and have the web browser show a
 * connect permission dialog to ask the user to grant permission to access the device.
 *
 * This function must be called from a user action, e.g. on Button click, as required
 * by the WebHID requestDevice() api call.
 *
 * @return Promise of the K810 keyboard HIDDevice that is granted access permissions
 */
async function requestKeyboardDeviceAccess() {
  const hid = getHID();
  if (!k810Keyboard) {
    try {
      const devices = await hid.requestDevice({
        filters: [k810Ids],
      });

      // assume only one and pick the first K810 keyboard device
      k810Keyboard = devices?.[0];
    } catch (e) {
      throw new Error("Unable to request access to K810 keyboard device: " + e);
    }

    if (!k810Keyboard) {
      throw new Error("K810 keyboard not found or not granted access");
    }
  }
  return k810Keyboard;
}

/**
 * Open the connected K810 keyboard device
 *
 * @return Promise of the keyboard once the keyboard is opened
 */
async function openKeyboard() {
  ensureKeyboardRequested();

  if (!k810Keyboard.opened) {
    try {
      await k810Keyboard.open();
    } catch (e) {
      // FIXME: sometimes keyboard device fails to open again until browser process is restarted
      k810Keyboard = undefined;
      throw new Error("Unable to open K810 keyboard: " + e);
    }
  }
  return k810Keyboard;
}

/**
 * Close the opened K810 keyboard device
 *
 * @return Promise<undefined> once the keyboard has been closed
 */
async function closeKeyboard() {
  return k810Keyboard?.close();
}

/**
 * Set a callback to handle keyboard connect/disconnect events.
 * The callback function will be called the device as argument
 *
 * @param callback an external callback to call on keyboard connect and disconnect events
 */
function setKeyboardConnectDisconnectCallback(callback) {
  // @ts-ignore TS2339
  const hid = getHID();
  if (hid) {
    const wrapCallback =
      (cb, isOnConnect) =>
      ({ device }) => {
        if (device.productId === k810Ids.productId) {
          k810Keyboard = device;
          cb?.({ isOnConnect, device });
        }
      };

    hid.onconnect = wrapCallback(callback, true);
    hid.ondisconnect = wrapCallback(callback, false);
  }
}

/**
 * Set a callback to handle keyboard input report events.  The callback will be called
 * with parameter `{ isFnEnabled, reportId, reportData }` on an input report event.
 *
 * Details about HIDInputReportEvent and the inputreport_event structure are here:
 * https://developer.mozilla.org/en-US/docs/Web/API/HIDInputReportEvent
 * https://developer.mozilla.org/en-US/docs/Web/API/HIDDevice/inputreport_event
 *
 * @param callback the external callback to invoke on an inputReport event
 */
function setKeyboardInputReportCallback(callback) {
  ensureKeyboardRequested();

  if (!k810Keyboard.oninputreport) {
    k810Keyboard.oninputreport = (event) => {
      const reportId = event.reportId;
      const reportData = new Uint8Array(event.data.buffer);

      // data[3] is for Fn keys setting only when reportId === 0x11 and data[1] === 0x06
      // If not, set isFnEnabled to undefined to ignore the event
      const isFnEnabled =
        reportId === 0x11 && reportData[1] === 0x06
          ? !reportData[3]
          : undefined;
      callback?.({ isFnEnabled, reportId, reportData });
    };
  }
}

/**
 * A Promise that resolves to undefined once the report has been sent.
 *
 * @param isEnable true to enable Fn keys as default; false to use the F-keys for special systems and apps functions
 * @return Promise<undefined> once the report request has been sent.
 */
async function setFnKeysEnabled(isEnable) {
  ensureKeyboardRequestedAndOpened();

  const data = [0xff, 0x06, 0x15, isEnable ? 0x00 : 0x01, 0x00, 0x00];
  return k810Keyboard.sendReport(0x10, new Uint8Array(data));
}

/**
 * Revoke permission previously granted to access the K810 keyboard device
 *
 * @return Promise<undefined> once the keyboard access has been revoked.
 */
async function revokeKeyboardDeviceAccess() {
  await k810Keyboard?.forget?.();

  const hid = getHID();
  hid.onconnect = null;
  hid.ondisconnect = null;
}
