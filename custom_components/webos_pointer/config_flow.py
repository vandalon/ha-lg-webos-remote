"""Config flow: one click. Options: the optional low-latency side channel (apply after a restart)."""
from __future__ import annotations

from typing import Any

import voluptuous as vol
from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers.selector import BooleanSelector, NumberSelector, NumberSelectorConfig, NumberSelectorMode

from . import CONF_PORT, CONF_SIDE, DOMAIN


class WebosPointerConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return WebosPointerOptionsFlow()

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        if user_input is not None:
            return self.async_create_entry(title="LG webOS Remote", data={})
        return self.async_show_form(step_id="user")

    async def async_step_import(self, import_data: dict[str, Any] | None = None) -> ConfigFlowResult:
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        data = {k: v for k, v in (import_data or {}).items() if k in (CONF_SIDE, CONF_PORT)}
        return self.async_create_entry(title="LG webOS Remote", data=data)


class WebosPointerOptionsFlow(OptionsFlow):
    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(data={CONF_SIDE: bool(user_input[CONF_SIDE]), CONF_PORT: int(user_input[CONF_PORT])})
        cur = {**self.config_entry.data, **self.config_entry.options}
        return self.async_show_form(step_id="init", data_schema=vol.Schema({
            vol.Required(CONF_SIDE, default=cur.get(CONF_SIDE, True)): BooleanSelector(),
            vol.Required(CONF_PORT, default=cur.get(CONF_PORT, 8124)): NumberSelector(
                NumberSelectorConfig(min=1024, max=65535, step=1, mode=NumberSelectorMode.BOX)),
        }))
