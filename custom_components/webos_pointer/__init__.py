"""LG webOS touchpad: Magic Remote pointer (move / click / scroll) services + the `custom:webos-touchpad` card.

Uses the client of the core webostv integration. Config (all optional):
    webos_pointer:
      side_channel: true   # low-latency wss side channel in its own thread (only when HA itself serves https)
      side_port: 8124
"""
from __future__ import annotations

import asyncio
import json
import logging
import ssl
import threading
from pathlib import Path

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig

from homeassistant.config_entries import SOURCE_IMPORT, ConfigEntry
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.storage import Store

from .channels import sort_by_number, zap_scan

_LOGGER = logging.getLogger(__name__)
DOMAIN = "webos_pointer"
CONF_SIDE, CONF_PORT = "side_channel", "side_port"
CONFIG_SCHEMA = vol.Schema(
    {DOMAIN: vol.Any(None, vol.Schema({vol.Optional(CONF_SIDE, default=True): cv.boolean,
                                       vol.Optional(CONF_PORT, default=8124): cv.port}))},
    extra=vol.ALLOW_EXTRA,
)
JS_URL = f"/{DOMAIN}/webos-touchpad.js"
LIVE_TV_APP_ID = "com.webos.app.livetv"
CHANNELS_MAX = 1000   # channels kept per TV (a cable box can have 300+ including radio)
EID = {vol.Optional("entity_id"): cv.entity_id}
XY = vol.Schema({vol.Required("dx"): vol.Coerce(int), vol.Required("dy"): vol.Coerce(int), **EID})
CLICK = vol.Schema(EID)


def _client(hass: HomeAssistant, entity_id: str | None = None):
    """The aiowebostv client of the webostv config entry that owns `entity_id` (default: the first loaded one)."""
    entries = hass.config_entries.async_entries("webostv")
    if entity_id:
        reg = er.async_get(hass).async_get(entity_id)
        if reg is None or reg.config_entry_id is None:
            raise HomeAssistantError(f"{entity_id} is not a known LG webOS TV entity")
        entries = [e for e in entries if e.entry_id == reg.config_entry_id]
    for entry in entries:
        data = getattr(entry, "runtime_data", None)   # the webostv coordinator; the aiowebostv client is its .client
        client = getattr(data, "client", data)
        if client is not None and hasattr(client, "move"):
            return client
    raise HomeAssistantError("LG webOS TV is not loaded")


def _start_side_server(hass: HomeAssistant, port: int) -> None:
    """wss://<ha-host>:8124/pointer in its own thread, with HA's own certificate, straight to the TV's pointer socket."""
    from aiohttp import ClientSession, WSMsgType, web

    cert = getattr(hass.http, "ssl_certificate", None) or "/ssl/fullchain.pem"
    key = getattr(hass.http, "ssl_key", None) or "/ssl/privkey.pem"

    def on_hass(coro):   # run something on HA's loop and wait for it (only used once per connection)
        return asyncio.wrap_future(asyncio.run_coroutine_threadsafe(coro, hass.loop))

    async def check_token(token):
        return hass.auth.async_validate_access_token(token) is not None

    async def sock_path(entity_id):
        res = await _client(hass, entity_id).request("com.webos.service.networkinput/getPointerInputSocket")
        return res["socketPath"]

    async def handler(request):
        ws = web.WebSocketResponse(heartbeat=20)
        await ws.prepare(request)
        tv = pump = None
        acc = [0, 0]

        async def run_pump():
            while True:
                await asyncio.sleep(0.016)
                dx, dy, acc[0], acc[1] = acc[0], acc[1], 0, 0
                if not (dx or dy):
                    continue
                n = max(1, -(-max(abs(dx), abs(dy)) // 30))
                for i in range(n):
                    sx = dx // n if i < n - 1 else dx - (dx // n) * (n - 1)
                    sy = dy // n if i < n - 1 else dy - (dy // n) * (n - 1)
                    await tv.send_str(f"type:move\ndx:{sx}\ndy:{sy}\ndown:0\n\n")

        try:
            first = await asyncio.wait_for(ws.receive_str(), 10)
            hello = json.loads(first)
            if not await on_hass(check_token(hello.get("auth", ""))):
                await ws.close()
                return ws
            tv = await request.app["session"].ws_connect(await on_hass(sock_path(hello.get("entity_id"))), ssl=False, max_msg_size=0)
            pump = asyncio.create_task(run_pump())
            await ws.send_str("ready")
            async for msg in ws:
                if msg.type != WSMsgType.TEXT:
                    continue
                if msg.data[:1] == "m":
                    _, dx, dy = msg.data.split(" ")
                    acc[0] += int(dx)
                    acc[1] += int(dy)
                elif msg.data == "c":
                    await tv.send_str("type:click\n\n")
        except Exception as err:  # noqa: BLE001
            _LOGGER.debug("pointer side channel closed: %s", err)
        finally:
            if pump:
                pump.cancel()
            if tv:
                await tv.close()
        return ws

    async def main():
        app = web.Application()
        app["session"] = ClientSession()
        app.router.add_get("/pointer", handler)
        runner = web.AppRunner(app)
        await runner.setup()
        ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ctx.load_cert_chain(cert, key)
        await web.TCPSite(runner, "0.0.0.0", port, ssl_context=ctx).start()
        await asyncio.Event().wait()

    def run():
        try:
            asyncio.run(main())
        except Exception:  # noqa: BLE001
            _LOGGER.exception("pointer side channel could not start (the card falls back to the HA connection)")

    threading.Thread(target=run, name="webos_pointer_side", daemon=True).start()


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Legacy YAML (`webos_pointer:` with optional side_channel / side_port): import it as a config entry once."""
    if DOMAIN in config and not hass.config_entries.async_entries(DOMAIN):
        hass.async_create_task(hass.config_entries.flow.async_init(
            DOMAIN, context={"source": SOURCE_IMPORT}, data=dict(config.get(DOMAIN) or {})))
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    # Services, websocket commands, the card script and the side server stay until the next restart.
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    if hass.data.get(DOMAIN):  # everything below is registered once per run
        return True
    hass.data[DOMAIN] = True

    async def move(call: ServiceCall) -> None:
        await _client(hass, call.data.get("entity_id")).move(call.data["dx"], call.data["dy"])

    async def click(call: ServiceCall) -> None:
        await _client(hass, call.data.get("entity_id")).click()

    async def scroll(call: ServiceCall) -> None:
        await _client(hass, call.data.get("entity_id")).scroll(call.data["dx"], call.data["dy"])

    # lightweight websocket commands for the card. Moves are summed and sent to the TV by ONE pump at a steady ~60 Hz,
    # so network jitter between phone and HA does not turn into a choppy cursor.
    st: dict[str | None, dict] = {}   # per TV: pending move + pump task

    async def pump(key, s_):
        try:
            while s_["dx"] or s_["dy"]:
                dx, dy, s_["dx"], s_["dy"] = s_["dx"], s_["dy"], 0, 0
                n = max(1, -(-max(abs(dx), abs(dy)) // 30))   # big moves in <=30 px steps, spread over frames
                for i in range(n):
                    sx, sy = dx // n, dy // n
                    if i == n - 1:
                        sx, sy = dx - (dx // n) * (n - 1), dy - (dy // n) * (n - 1)
                    try:
                        await _client(hass, key).move(sx, sy)
                    except Exception:  # noqa: BLE001 - a dropped cursor move is not worth an error
                        s_["dx"] = s_["dy"] = 0
                        return
                    await asyncio.sleep(0.016 / n)
                await asyncio.sleep(0)
        finally:
            s_["task"] = None

    @websocket_api.websocket_command({vol.Required("type"): "webos_pointer/move", vol.Required("dx"): vol.Coerce(int), vol.Required("dy"): vol.Coerce(int), **EID})
    @callback
    def ws_move(hass_, connection, msg):
        key = msg.get("entity_id")
        s_ = st.setdefault(key, {"dx": 0, "dy": 0, "task": None})
        s_["dx"] += msg["dx"]
        s_["dy"] += msg["dy"]
        if s_["task"] is None:
            s_["task"] = hass.async_create_background_task(pump(key, s_), "webos_pointer pump")

    @websocket_api.websocket_command({vol.Required("type"): "webos_pointer/click", **EID})
    @websocket_api.async_response
    async def ws_click(hass_, connection, msg):
        try:
            await _client(hass, msg.get("entity_id")).click()
        except Exception:  # noqa: BLE001
            pass

    # --- channels: the TV's own channel list, plus YOUR editable channel list per TV (filled by the scan, edited by you) ---
    # store: {entity_id: {"channels": [{"name": str, "number": str, "enabled": bool}]}}  (your order; never reordered automatically)
    store = Store(hass, 1, f"{DOMAIN}_channels")
    data: dict[str, dict] = {}
    raw = (await store.async_load()) or {}
    for key, val in raw.items():   # v1 stored plain name lists per TV (most recent first): keep their order
        if isinstance(val, list):
            data[key] = {"channels": [{"name": n, "number": "", "enabled": True} for n in val if isinstance(n, str)]}
        elif isinstance(val, dict):
            data[key] = {"channels": [{"name": c["name"], "number": str(c.get("number") or ""), "enabled": bool(c.get("enabled", True)), "manual": bool(c.get("manual", False))} for c in val.get("channels", []) if isinstance(c, dict) and c.get("name")]}

    def tv(entity_id: str) -> dict:
        return data.setdefault(entity_id, {"channels": []})

    def tv_channels(entity_id: str | None) -> list[dict]:
        """The channel list the TV itself reports (names + numbers), when it has one."""
        out: list[dict] = []
        try:
            for c in getattr(_client(hass, entity_id).tv_state, "channels", None) or []:
                if c.get("channelName"):
                    out.append({"name": c["channelName"], "number": str(c.get("channelNumber") or "")})
        except Exception:  # noqa: BLE001
            pass
        return out

    def save() -> None:
        store.async_delay_save(lambda: data, 10)

    def now_channel(entity_id: str) -> tuple[str, str]:
        st = hass.states.get(entity_id)
        title = (st.attributes.get("media_title") if st else None) or ""
        number = ""
        try:   # the client knows the number of the channel on screen
            cur = _client(hass, entity_id).tv_state.current_channel or {}
            if cur.get("channelName") == title:
                number = str(cur.get("channelNumber") or "")
        except Exception:  # noqa: BLE001
            pass
        return title, number

    @websocket_api.websocket_command({vol.Required("type"): "webos_pointer/channels", **EID})
    @websocket_api.async_response
    async def ws_channels(hass_, connection, msg):
        entity_id = msg.get("entity_id")
        conf = tv(entity_id) if entity_id else {"channels": []}
        connection.send_result(msg["id"], {"tv_channels": tv_channels(entity_id), "list": conf["channels"]})

    @websocket_api.websocket_command({
        vol.Required("type"): "webos_pointer/set_channels",
        vol.Required("entity_id"): cv.entity_id,
        vol.Optional("list"): [vol.Schema({vol.Required("name"): str, vol.Optional("number"): vol.Any(None, str, int), vol.Optional("enabled"): bool, vol.Optional("manual"): bool}, extra=vol.ALLOW_EXTRA)],
        vol.Optional("learn"): bool,   # no longer used (there is no automatic learning); accepted so that an older cached card keeps working
    })
    @websocket_api.async_response
    async def ws_set_channels(hass_, connection, msg):
        conf = tv(msg["entity_id"])
        if "list" in msg:
            edited = [{"name": c["name"].strip(), "number": "" if c.get("number") in (None, "") else str(c["number"]), "enabled": c.get("enabled", True) is not False, "manual": bool(c.get("manual", False))} for c in msg["list"] if c["name"].strip()]
            conf["channels"] = edited[:CHANNELS_MAX]   # exactly the order you edited
        save()
        connection.send_result(msg["id"], {"list": conf["channels"]})

    @websocket_api.websocket_command({vol.Required("type"): "webos_pointer/sort_channels", vol.Required("entity_id"): cv.entity_id})
    @websocket_api.async_response
    async def ws_sort(hass_, connection, msg):
        conf = tv(msg["entity_id"])
        conf["channels"] = sort_by_number(conf["channels"])
        save()
        connection.send_result(msg["id"], {"list": conf["channels"]})

    async def sort_channels(call: ServiceCall) -> None:
        """Sort the channel list by channel number, ascending (channels without a number last). The list is never sorted automatically."""
        targets = [call.data["entity_id"]] if call.data.get("entity_id") else list(data)
        for key in targets:
            if key in data:
                data[key]["channels"] = sort_by_number(data[key]["channels"])
        save()

    hass.services.async_register(DOMAIN, "sort_channels", sort_channels, schema=CLICK)
    websocket_api.async_register_command(hass, ws_sort)

    async def clear_channels(call: ServiceCall) -> None:
        """Empty the channel list of one TV (default: every TV) so it can be built up again (scan again)."""
        targets = [call.data["entity_id"]] if call.data.get("entity_id") else list(data)
        for key in targets:
            if key in data:
                data[key]["channels"] = []
        save()

    hass.services.async_register(DOMAIN, "clear_channels", clear_channels, schema=CLICK)
    # --- scan: zap through all channels once to learn them (or import the TV's own list when it has one) ---
    scans: dict[str, dict] = {}

    def add_found(entity_id: str, name: str, number: str) -> bool:
        conf = tv(entity_id)
        # the same channel = same name and same number (or one of them has no number); a name used on two numbers (SBS9 19 and 80) is two channels
        if not name or len(conf["channels"]) >= CHANNELS_MAX or any(c["name"].lower() == name.lower() and (not c.get("number") or not number or c["number"] == number) for c in conf["channels"]):
            return False
        conf["channels"].append({"name": name, "number": number, "enabled": True})
        return True

    async def go_to_first(entity_id: str) -> None:
        """Tune to channel 1: by number through the TV's channel list, else by typing 1 + OK on the remote."""
        try:
            await hass.services.async_call("media_player", "play_media", {"entity_id": entity_id, "media_content_type": "channel", "media_content_id": "1"}, blocking=True)
        except Exception:  # noqa: BLE001
            pass
        await asyncio.sleep(2)
        if now_channel(entity_id)[1] != "1":
            for key in ("1", "ENTER"):
                try:
                    await hass.services.async_call("webostv", "button", {"entity_id": entity_id, "button": key}, blocking=True)
                except Exception:  # noqa: BLE001
                    pass
                await asyncio.sleep(0.4)
            await asyncio.sleep(2.5)

    def tv_is_on(entity_id: str) -> bool:
        st = hass.states.get(entity_id)
        return st is not None and st.state not in ("off", "unavailable", "unknown")

    async def run_scan(entity_id: str) -> None:
        scan = scans[entity_id]
        scan.update(running=True, found=0, stop=False, error="")
        start = ("", "")
        orig = ("", "")   # the channel you were watching: the scan returns there
        orig_app = ""   # the app/input you were on when the scan had to switch to Live TV
        try:
            st = hass.states.get(entity_id)
            if not tv_is_on(entity_id):
                raise HomeAssistantError("The TV is off. Turn it on and try again")
            if st.attributes.get("app_id") == LIVE_TV_APP_ID:
                orig = now_channel(entity_id)
            else:
                orig_app = st.attributes.get("app_id") or ""
            listed = tv_channels(entity_id)
            if not listed and st.attributes.get("app_id") != LIVE_TV_APP_ID:
                # the TV only keeps its channel list loaded while it is on Live TV: switch there first, then look again
                await hass.services.async_call("webostv", "command", {"entity_id": entity_id, "command": "system.launcher/launch", "payload": {"id": LIVE_TV_APP_ID}}, blocking=True)
                for _ in range(40):
                    await asyncio.sleep(0.2)
                    cur = hass.states.get(entity_id)
                    if cur and cur.attributes.get("app_id") == LIVE_TV_APP_ID and cur.attributes.get("media_title"):
                        break
                for _ in range(12):   # up to 6 s for the channel list to arrive
                    listed = tv_channels(entity_id)
                    if listed:
                        break
                    await asyncio.sleep(0.5)
            if listed:   # the TV has its own channel list (radio included): no zapping needed
                for c in sort_by_number([{"name": c["name"], "number": c["number"]} for c in listed]):   # lowest number first
                    scan["found"] += add_found(entity_id, c["name"], c["number"])
                return
            await go_to_first(entity_id)   # a scan always starts at channel 1, so channels are learned in number order
            start = now_channel(entity_id)
            if not start[0]:
                raise HomeAssistantError("The TV shows no channel (no signal or no channels)")
            last = {"title": ""}

            async def press(button: str) -> None:
                await hass.services.async_call("webostv", "button", {"entity_id": entity_id, "button": button}, blocking=True)

            async def step() -> None:
                await press("CHANNELUP")

            async def read() -> tuple[str, str]:
                for _ in range(20):   # wait up to 4 s for the picture/title to change
                    await asyncio.sleep(0.2)
                    cur = now_channel(entity_id)
                    if cur[0] and cur[0] != last["title"]:
                        await asyncio.sleep(0.3)   # let the number settle
                        cur = now_channel(entity_id)
                        break
                else:
                    cur = now_channel(entity_id)
                last["title"] = cur[0]
                return cur

            def found(cur: tuple[str, str]) -> None:
                scan["found"] += add_found(entity_id, cur[0], cur[1])

            # find the LAST channel first: one step back from channel 1 wraps around to it. The scan then runs until it reaches that channel,
            # instead of guessing the end from repeated or missing names
            last["title"] = start[0]
            await press("CHANNELDOWN")
            end = await read()
            await go_to_first(entity_id)
            start = now_channel(entity_id)
            last["title"] = start[0]
            until = end[0] if end[0] and end[0].lower() != start[0].lower() else None
            await zap_scan(step, _first(start, read), should_stop=lambda: scan["stop"], on_found=found, until=until, dup_limit=25 if until else 4, max_steps=1500)
        except HomeAssistantError as err:
            scan["error"] = str(err)
        except Exception as err:  # noqa: BLE001
            _LOGGER.exception("channel scan failed")
            scan["error"] = str(err)
        finally:
            if orig_app and not orig[0] and scan.get("error") == "":   # the scan switched to Live TV: go back to where you were
                try:
                    await hass.services.async_call("webostv", "command", {"entity_id": entity_id, "command": "system.launcher/launch", "payload": {"id": orig_app}}, blocking=True)
                except Exception:  # noqa: BLE001
                    pass
            if orig[0]:   # back to the channel you were watching
                try:
                    await hass.services.async_call("media_player", "play_media", {"entity_id": entity_id, "media_content_type": "channel", "media_content_id": orig[1] or orig[0]}, blocking=True)
                except Exception:  # noqa: BLE001
                    pass
            save()
            scan["running"] = False

    def _first(start, read):
        """read(): the first call returns the channel the scan starts on, later calls wait for the next one."""
        state = {"first": True}

        async def wrapped():
            if state["first"]:
                state["first"] = False
                return start
            return await read()
        return wrapped

    def scan_status(entity_id: str) -> dict:
        s = scans.get(entity_id) or {}
        return {"running": bool(s.get("running")), "found": s.get("found", 0), "error": s.get("error", "")}

    @websocket_api.websocket_command({vol.Required("type"): "webos_pointer/scan", vol.Required("entity_id"): cv.entity_id, vol.Optional("action", default="status"): vol.In(["start", "stop", "status"])})
    @websocket_api.async_response
    async def ws_scan(hass_, connection, msg):
        entity_id = msg["entity_id"]
        if msg["action"] == "start" and not tv_is_on(entity_id):   # checked before anything starts
            scans[entity_id] = {"running": False, "found": 0, "stop": False, "error": "The TV is off. Turn it on and try again"}
        elif msg["action"] == "start" and not scans.get(entity_id, {}).get("running"):
            scans[entity_id] = {"running": True, "found": 0, "stop": False, "error": ""}
            hass.async_create_background_task(run_scan(entity_id), "webos_pointer channel scan")
        elif msg["action"] == "stop" and entity_id in scans:
            scans[entity_id]["stop"] = True
        connection.send_result(msg["id"], scan_status(entity_id))

    async def scan_service(call: ServiceCall) -> None:
        entity_id = call.data["entity_id"]
        if not tv_is_on(entity_id):
            raise HomeAssistantError("The TV is off. Turn it on and try again")
        if not scans.get(entity_id, {}).get("running"):
            scans[entity_id] = {"running": True, "found": 0, "stop": False, "error": ""}
            hass.async_create_background_task(run_scan(entity_id), "webos_pointer channel scan")

    hass.services.async_register(DOMAIN, "scan_channels", scan_service, schema=vol.Schema({vol.Required("entity_id"): cv.entity_id}))
    websocket_api.async_register_command(hass, ws_scan)
    websocket_api.async_register_command(hass, ws_channels)
    websocket_api.async_register_command(hass, ws_set_channels)
    websocket_api.async_register_command(hass, ws_move)
    websocket_api.async_register_command(hass, ws_click)
    hass.services.async_register(DOMAIN, "move", move, schema=XY)
    hass.services.async_register(DOMAIN, "click", click, schema=CLICK)
    hass.services.async_register(DOMAIN, "scroll", scroll, schema=XY)
    conf = {**entry.data, **entry.options}   # side channel settings (options win; apply after a restart)
    js = Path(__file__).parent / "frontend" / "webos-touchpad.js"
    await hass.http.async_register_static_paths([StaticPathConfig(JS_URL, str(js), cache_headers=False)])
    add_extra_js_url(hass, f"{JS_URL}?v={int(js.stat().st_mtime)}")   # mtime = cache buster, no dashboard resource needed
    if conf.get(CONF_SIDE, True) and getattr(hass.http, "ssl_certificate", None):
        _start_side_server(hass, conf.get(CONF_PORT, 8124))
    return True
