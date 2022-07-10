# k810-fn-config

This project offers a web-based UI tool for configuring the Logitech K810 keyboard's F-keys to either the F1-12 Fn keys or the systems and apps special function keys as the default.

# Installation and Usages

No installation or build is required, other than running the tool with a compatible web browser that supports the WebHID api, e.g. Chrome 89, Edge 89 and Opera 75. Also see `Tech Notes` section at the end for other info.

## Web-based Usage

No installation or build is required. Simply use a compatible web browser which supports the WebHID api to point to this project's GitHub Pages website at https://victor-st.github.io/k810-fn-config/pages/fn-config.html and then follow the on screen instructions.

## Local Usage

Clone the repo or download the files under https://github.com/victor-st/k810-fn-config/src to a local directory. Then use a web browser which supports the WebHID api to point to the local file in `<your_local_dir>/pages/fn-config.html` and follow the on screen instructions.

# Why Another K810 Fn Keys Config Tool

The Logitech K810 is a nice bluetooth keyboard for Windows that also works on Mac, ChromeOS and other platforms and devices. It has a set of F-keys which by default run special systems and applications functions.

While there were various tools to swap the F-keys back to their Fn functions without needing to press the additional FN key, the tools eventually did not run due to OS and platform differences and restrictions. (See the `Background` section next for details.)

As a result, this "web-based" cross-platform tool was created, and it lets me happily use my trusted K810 keyboard with the Fn keys as the default.

Since I searched for some time but could not find a solution, I'd think other people may also hit the wall and gave up to look for a solution. Rather than continuing using the nice keyboard without the default Fn keys, I'm very happy to have this tool so that I don't have to give up the nice keyboard or to live with the nuisance of pressing the FN key all the time.

Originally the tool was a very simple HTML with a few lines of JavaScript to make the necessary WebHID calls for my casual use. Since I only worked on it during spare time, it took me until now to finally document, clean up and publish the tool for sharing. Better late than never, I hope owners of the nice little K810 keyboard will soon find this tool and will be happy to be able to set the default Fn function keys again.

If you find this tool useful, drop me a comment or star the project to let me know.

# Background

The Logitech K810 is a nice keyboard that has an adjustable backlight and can remember up to three bluetooth pairings. While it's specifically designed for Windows, it may be used on Mac, Linux, ChromeOS, as well as on phones and tablets that support a bluetooth connection.

By default, the F-keys are for special systems and application functions, such as sound volume and keyboard lighting, etc. In order to use the F1 - F12 Fn functions, the FN key must be pressed together with a F-key. Logitech used to have an companion software `SetPoint` to config the keyboard's default Fn keys behavior on Windows and on Macs. However, the K810 keyboard was not supported by the Logitech software on newer OS versions.

Since this is a very nice keyboard that can be used for Windows, Macs and Linux, some people don't want to give it up but continue to use it without the ability to set the default Fn behavior. For many software developers, the default Fn key behavior is the normal preferred use-case, and it is rather inconvenient and a nuisance to press the FN key along with the F-keys for daily usages.

## Previous Tools

In order to use the default Fn keys without pressing the FN key, several utilities used to be able to do so. For examples,

- `k810-811-fn-keys-configurator` (Ianis Lallemand - https://github.com/ianisl/k810-811-fn-keys-configurator.git)
- `k811fn` (Julian Eberius - https://github.com/JulianEberius/k811fn)
- `k810fn` (Keigh Rim - https://github.com/keighrim/k810fn.git)
- `k810_conf` (Mario Scholz - https://github.com/orpiske/k810_conf ,
  https://www.spinics.net/lists/linux-input/msg24280.html , and
  http://web.archive.org/web/20210513180410/http://www.trial-n-error.de/posts/2012/12/31/logitech-k810-keyboard-configurator )

Some of the JS cli tools were based on the `node-hid` package (https://github.com/node-hid/node-hid.git). I used to use the first one in the list on my Mac Book Pro, and it worked fine when ran in super user mode.

Unfortunately, these tools also eventually failed to run with newer Windows and Mac OS 12.x versions due to stricter OS security to disallow mouse and keyboard accesses via the `node-hide` library (https://github.com/node-hid/node-hid#devices-node-hid-cannot-read) or `hidapi` (https://github.com/libusb/hidapi#linuxhidraw-linuxhidc).

## WebHID API Hope

Persistent searches on the Internet yielded no working tools to configure the Logitech K810 keyboard's Fn keys. When all hopes were almost out and it was about time to give up, I came across this article (https://web.dev/hid/). It talked about the `webhid` Incubator project (https://github.com/WICG/webhid), which provides the experimental WebHID api (https://wicg.github.io/webhid/) on web browsers to control HID devices (e.g. see Matt Reynolds' `webhid-explorer` https://nondebug.github.io/webhid-explorer/ ).

After looking into the WebHID api and playing around with it, I could connect and open my Logitech K810 keyboard within a Chrome web browser app. That's after it prompted me for permissions to access the device and I responded with an explicit access grant. By combining the WebHID api and knowledge from prior K810 tools, eventually I successfully configured my K810 keyboard's F-keys to their Fn functions as the default.

Since the WebHID API is available on newer Chrome 89, Edge 89 and Opera 75 web browsers (see https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API), it's a solution available everywhere for all platforms where an Internet connection and a compatible browser are available. And that's how this project was started initially.

# Tech Notes

After looking further in the WebHID API, I enhanced the initial POC to restore the keyboard's Fn setting. It works even after cycling the power of the keyboard, provided that the tool is up in at least one browser session. The tool attempts to sync the on-screen setting across different browser sessions via event notifications, too. Although it may not be as convenient as the CLI tools (when they used to work) that could run automatically on system startup in the background, this is a rather simple solution I've found so far to get the job done when I need to set the Fn keys as the default.

## The Files

The tool shows a simple html web page by default. I wanted it to be simple without needing any lib dependencies, heavy UI frameworks like React, or complicated build and deployment. (The simple tool still grew a lot from what I hoped to be very simple, though.) It has an option to switch to the "pro" version for fun. That version includes UI styling and dark theme via the `src/styles/index.css` stylesheet, and it also displays additional keyboard event data for debugging. Both simple and pro html pages are under the `src/pages/` directory.

The tool runs with a couple of JavaScript files:

- `src/lib/k810-webhid.ts` provides non-UI related util functions that call the WebHID API for the K810 keyboard device
- `src/scripts/index.ts` contains UI util functions to show messages and to hide/show elements, etc., and it calls functions in `k810-webhid.ts`

Even though the files have a `.ts` extension, they contain plain JavaScript and not TypeScript at the moment to keep things simple. The `.ts` extension is used only to help with better type checking and auto-complete/suggest in VSCode IDE.

### Safari Browser

Since Safari web browser does not support the WebHID api, the tool cannot set the K810 Fn keys as default at all. However, if you still run the tool in Safari, it likely won't show nicely. You'll need to turn on JavaScript first. And if the tool is run from local files, the UI layout and styles and JavaScript still may not work properly, as Safari seems to disallow loading local script and style files. One workaround is to turn on Safari Develop Menu:

- Open the Safari menu
- Select `Preferences...` > `Advanced` tab
- Check the `Show Develop menu in menu bar` checkbox
- Start a new Safari browser session to load the local tool files

## What Else

One of the "goals" of the tool/project is that it should be simple and does not need any installation or build for sharing. The current requirement to run the html/js files is a compatible web browser that supports the WebHID api, i.e. Chrome 89, Edge 89 and Opera 75 (see https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API).

Another good part of the tool is that it does not require any installation and it can work anywhere on different OS and machines, as long as a supported browser and an Internet connection are available to point to the project's GitHub Pages site. If desired, the tool can also be copied to a local file system and then use a browser to run from the file locally without requiring an Internet connection.

Even though this tool was specifically coded for the K810 keyboard just because I have the keyboard, the tool should be relatively easy to modify for other HID keyboards by specifying and sending the proper device's IDs and commands. These info should be available on the Internet from prior work (e.g. K811).

For WebHID debugging, Chromium browsers understand the `about://device-log` URL to show more WebHID diagnostic logs. (Tried adding an anchor link with the URL in the tool, but it could not bring up the log page, as the browser seemed to block the URL if it's not manually entered into the browser's URL input field.)

One more note is about the `Enable Fn` toggle being always set to "Enabled" on initial startup. It's done that way because the current WebHID api does not have a way to query input report data from the keyboard initially (see https://github.com/WICG/webhid/issues/94). The Enable Fn toggle state does get updated accordingly if an input report event arrives when the keyboard is sent the corresponding output report request (e.g. clicking the Enable Fn toggle) in any web browser session. And the tool also sets the keyboard automatically (based on the current toggle value) when the keyboard is switched on or reconnects. However, if the Enable Fn toggle is changed while the keyboard is disconnected and multiple tool browser sessions are opened, the toggles in different web browser sessions can get out of sync. And since the tool has no way to query the current Fn state from the keyboard when it is reconnected, the tool may set the keyboard's Fn state to an unexpected value based on the toggle value of a random session.

### Issues

1. Sometimes the `Access K810 Keyboard` button may fail to open the device. I've not tracked down if this is an issue with the tool or the WebHID API. Once the device open error happens, the browser process must be restarted in order to work around and clear the error. `Tip:` Since the tool also works in Edge browser and I don't usually use Edge for browsing or for work, I run the tool mainly in Edge and can restart Edge any time in case the error happens without loosing my browsing tabs in Chrome and Firefox.

2. The `Revoke Keyboard Access` button in the "pro" tool is for revoking keyboard access that was previously granted to the browser. However, the WebHID api seems to have an issue that it continues to remember the device's forgotten state and fails the open call, even though a new device object is requested and granted new access permissions. The current workaround reloads the pro tool page to clear the device state.

---
