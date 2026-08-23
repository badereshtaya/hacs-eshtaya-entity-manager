"""Eshtaya Entity Manager integration."""

from __future__ import annotations

import logging

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from .const import DOMAIN
from .manager_v11 import EntityManagerV11
from .panel import async_register_panel, async_unregister_panel
from .websocket_v11 import async_register_websocket_commands

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Eshtaya Entity Manager from a config entry."""
    manager = EntityManagerV11(hass)
    await manager.async_initialize()

    hass.data.setdefault(DOMAIN, {})["manager"] = manager

    async_register_websocket_commands(hass)
    await async_register_panel(hass)

    async def _regenerate_on_registry_change(event) -> None:
        # Registry changes are comparatively rare and include new/removed/renamed entities.
        try:
            await manager.async_handle_registry_event(dict(event.data))
        except Exception:  # noqa: BLE001 - keep HA running if file I/O fails
            _LOGGER.exception("Failed to regenerate hidden_entities.yaml after registry change")

    entry.async_on_unload(
        hass.bus.async_listen(er.EVENT_ENTITY_REGISTRY_UPDATED, _regenerate_on_registry_change)
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload Eshtaya Entity Manager."""
    async_unregister_panel(hass)
    hass.data.pop(DOMAIN, None)
    return True
