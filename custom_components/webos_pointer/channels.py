"""Pure channel-list logic (no Home Assistant imports, unit tested).

The stored list is never reordered automatically: learned channels are appended, and your own order is kept. `sort_once` is only used by
the explicit "sort by channel number" action.
"""
from __future__ import annotations

from typing import Any


def num(entry: dict[str, Any]) -> float | None:
    """Channel number as a float, or None when the channel has no (numeric) number."""
    raw = str(entry.get("number") or "").strip().replace(",", ".")
    try:
        return float(raw) if raw else None
    except ValueError:
        return None


def sort_by_number(channels: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Stable sort for the "sort by channel number" button: numbered channels ascending, channels without a number after them in their existing order."""
    keyed = [(num(c), i, c) for i, c in enumerate(channels)]
    keyed.sort(key=lambda k: (k[0] is None, k[0] if k[0] is not None else 0, k[1]))
    return [c for _, _, c in keyed]


async def zap_scan(step, read, *, max_steps: int = 400, should_stop=lambda: False, dup_limit: int = 4, on_found=None, until: str | None = None):
    """Zap through the channels with `step()` (channel up) and collect what `read()` reports afterwards.

    read() returns (name, number) of the channel now on screen (it waits for the TV to switch). The scan ends when the first channel
    comes round again, when `dup_limit` already-seen channels in a row show up (the TV did not switch), or after `max_steps`. With `until`
    (the name of the last channel, found by stepping back from the first) the scan runs up to and including that channel.
    """
    first = await read()
    found: list[tuple[str, str]] = []
    seen: set[str] = set()
    if first and first[0]:
        found.append(first)
        seen.add(first[0].lower())
        if on_found:
            on_found(first)
    dups = 0
    for _ in range(max_steps):
        if should_stop():
            break
        await step()
        cur = await read()
        if not cur or not cur[0]:
            dups += 1
        elif first and first[0] and cur[0].lower() == first[0].lower():
            break   # the loop is complete
        elif cur[0].lower() in seen:
            dups += 1
        else:
            dups = 0
            seen.add(cur[0].lower())
            found.append(cur)
            if on_found:
                on_found(cur)
            if until and cur[0].lower() == until.lower():
                break   # that was the last channel
            continue
        if dups >= dup_limit:
            break
    return found
