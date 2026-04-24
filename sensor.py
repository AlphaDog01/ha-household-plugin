"""Sensor platform for Hades Chores."""
from __future__ import annotations

import logging
from typing import Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from . import HadesChoresCoordinator
from .const import (
    DOMAIN,
    CONF_TRACKED_PEOPLE,
    CONF_ENABLE_TODAY,
    CONF_ENABLE_LEADERBOARD,
    CONF_ENABLE_UPCOMING,
    CONF_ENABLE_COMPLETION_RATE,
    DEFAULT_ENABLE_TODAY,
    DEFAULT_ENABLE_LEADERBOARD,
    DEFAULT_ENABLE_UPCOMING,
    DEFAULT_ENABLE_COMPLETION_RATE,
)

_LOGGER = logging.getLogger(__name__)


def _get_option(entry: ConfigEntry, key: str, default: Any) -> Any:
    """Get value from options first, then data, then default."""
    return entry.options.get(key, entry.data.get(key, default))


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Hades Chores sensors."""
    coordinator: HadesChoresCoordinator = hass.data[DOMAIN][entry.entry_id]

    tracked_ids = set(_get_option(entry, CONF_TRACKED_PEOPLE, []))
    enable_today = _get_option(entry, CONF_ENABLE_TODAY, DEFAULT_ENABLE_TODAY)
    enable_leaderboard = _get_option(entry, CONF_ENABLE_LEADERBOARD, DEFAULT_ENABLE_LEADERBOARD)
    enable_upcoming = _get_option(entry, CONF_ENABLE_UPCOMING, DEFAULT_ENABLE_UPCOMING)
    enable_completion = _get_option(entry, CONF_ENABLE_COMPLETION_RATE, DEFAULT_ENABLE_COMPLETION_RATE)

    people = coordinator.data.get("people", [])
    # Filter to only tracked people
    tracked_people = [
        p for p in people if str(p["id"]) in tracked_ids
    ]

    entities: list[SensorEntity] = []

    for person in tracked_people:
        pid = person["id"]
        name = person.get("display_name") or person["name"]

        if enable_today:
            entities.append(HadesPersonTodaySensor(coordinator, entry, person))

        if enable_completion:
            entities.append(HadesPersonCompletionSensor(coordinator, entry, person))

        if enable_upcoming:
            entities.append(HadesPersonUpcomingSensor(coordinator, entry, person))

    if enable_leaderboard:
        entities.append(HadesLeaderboardSensor(coordinator, entry))

    # Global today summary sensor (always added)
    entities.append(HadesTodaySummarySensor(coordinator, entry))

    async_add_entities(entities)


# ---------------------------------------------------------------------------
# Base class
# ---------------------------------------------------------------------------

class HadesBaseSensor(CoordinatorEntity, SensorEntity):
    """Base class for all Hades sensors."""

    def __init__(self, coordinator: HadesChoresCoordinator, entry: ConfigEntry) -> None:
        super().__init__(coordinator)
        self._entry = entry

    @property
    def device_info(self):
        return {
            "identifiers": {(DOMAIN, self._entry.entry_id)},
            "name": "Hades Chores",
            "manufacturer": "Hades",
            "model": "Chore Manager",
            "entry_type": "service",
        }


# ---------------------------------------------------------------------------
# Per-person: Today's chores
# ---------------------------------------------------------------------------

class HadesPersonTodaySensor(HadesBaseSensor):
    """Number of pending chores today for a person."""

    def __init__(self, coordinator, entry, person: dict) -> None:
        super().__init__(coordinator, entry)
        self._person = person
        self._pid = person["id"]
        self._pname = person.get("display_name") or person["name"]
        self._attr_unique_id = f"{entry.entry_id}_today_{self._pid}"
        self._attr_name = f"Hades {self._pname} Chores Today"
        self._attr_icon = "mdi:broom"
        self._attr_native_unit_of_measurement = "chores"

    @property
    def native_value(self) -> int:
        today_by_person = self.coordinator.data.get("today_by_person", {})
        chores = today_by_person.get(self._pid, [])
        return sum(1 for c in chores if c.get("status") == "pending")

    @property
    def extra_state_attributes(self) -> dict:
        today_by_person = self.coordinator.data.get("today_by_person", {})
        chores = today_by_person.get(self._pid, [])
        return {
            "person_id": self._pid,
            "person_name": self._pname,
            "total_chores": len(chores),
            "pending": [
                {
                    "id": c["id"],
                    "name": c["chore_name"],
                    "due_time": c.get("due_time"),
                    "points": c.get("points"),
                }
                for c in chores if c.get("status") == "pending"
            ],
            "completed": [
                {
                    "id": c["id"],
                    "name": c["chore_name"],
                    "completed_at": c.get("completed_at"),
                    "points": c.get("points"),
                }
                for c in chores if c.get("status") == "completed"
            ],
            "skipped": [
                c["chore_name"]
                for c in chores if c.get("status") == "skipped"
            ],
        }


# ---------------------------------------------------------------------------
# Per-person: Completion rate
# ---------------------------------------------------------------------------

class HadesPersonCompletionSensor(HadesBaseSensor):
    """Completion rate today for a person (0-100%)."""

    def __init__(self, coordinator, entry, person: dict) -> None:
        super().__init__(coordinator, entry)
        self._person = person
        self._pid = person["id"]
        self._pname = person.get("display_name") or person["name"]
        self._attr_unique_id = f"{entry.entry_id}_completion_{self._pid}"
        self._attr_name = f"Hades {self._pname} Completion Rate"
        self._attr_icon = "mdi:percent"
        self._attr_native_unit_of_measurement = "%"

    @property
    def native_value(self) -> float:
        rates = self.coordinator.data.get("completion_rates", {})
        return rates.get(self._pid, 0.0)

    @property
    def extra_state_attributes(self) -> dict:
        people = self.coordinator.data.get("people", [])
        person_data = next((p for p in people if p["id"] == self._pid), {})
        return {
            "person_id": self._pid,
            "points_total": person_data.get("points_total", 0),
        }


# ---------------------------------------------------------------------------
# Per-person: Upcoming chores
# ---------------------------------------------------------------------------

class HadesPersonUpcomingSensor(HadesBaseSensor):
    """Upcoming chores in the next 7 days for a person."""

    def __init__(self, coordinator, entry, person: dict) -> None:
        super().__init__(coordinator, entry)
        self._person = person
        self._pid = person["id"]
        self._pname = person.get("display_name") or person["name"]
        self._attr_unique_id = f"{entry.entry_id}_upcoming_{self._pid}"
        self._attr_name = f"Hades {self._pname} Upcoming Chores"
        self._attr_icon = "mdi:calendar-clock"
        self._attr_native_unit_of_measurement = "chores"

    @property
    def native_value(self) -> int:
        upcoming = self.coordinator.data.get("upcoming_by_person", {})
        return len(upcoming.get(self._pid, []))

    @property
    def extra_state_attributes(self) -> dict:
        upcoming = self.coordinator.data.get("upcoming_by_person", {})
        chores = upcoming.get(self._pid, [])
        return {
            "person_id": self._pid,
            "person_name": self._pname,
            "upcoming": [
                {
                    "name": c["chore_name"],
                    "due_date": c.get("due_date"),
                    "points": c.get("points"),
                }
                for c in chores
            ],
        }


# ---------------------------------------------------------------------------
# Global: Leaderboard
# ---------------------------------------------------------------------------

class HadesLeaderboardSensor(HadesBaseSensor):
    """Points leaderboard — state is the current leader's name."""

    def __init__(self, coordinator, entry) -> None:
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_leaderboard"
        self._attr_name = "Hades Points Leaderboard"
        self._attr_icon = "mdi:trophy"

    @property
    def native_value(self) -> str | None:
        leaderboard = self.coordinator.data.get("leaderboard", [])
        if not leaderboard:
            return None
        leader = leaderboard[0]
        return leader.get("display_name") or leader.get("name", "Unknown")

    @property
    def extra_state_attributes(self) -> dict:
        leaderboard = self.coordinator.data.get("leaderboard", [])
        return {
            "rankings": [
                {
                    "rank": i + 1,
                    "name": p.get("display_name") or p.get("name"),
                    "points": p.get("points_total", 0),
                }
                for i, p in enumerate(leaderboard)
            ]
        }


# ---------------------------------------------------------------------------
# Global: Today summary
# ---------------------------------------------------------------------------

class HadesTodaySummarySensor(HadesBaseSensor):
    """Overall summary of today — total pending chores across everyone."""

    def __init__(self, coordinator, entry) -> None:
        super().__init__(coordinator, entry)
        self._attr_unique_id = f"{entry.entry_id}_today_summary"
        self._attr_name = "Hades Today Summary"
        self._attr_icon = "mdi:clipboard-list"
        self._attr_native_unit_of_measurement = "chores"

    @property
    def native_value(self) -> int:
        today = self.coordinator.data.get("today", [])
        return sum(1 for c in today if c.get("status") == "pending")

    @property
    def extra_state_attributes(self) -> dict:
        today = self.coordinator.data.get("today", [])
        total = len(today)
        completed = sum(1 for c in today if c.get("status") == "completed")
        pending = sum(1 for c in today if c.get("status") == "pending")
        skipped = sum(1 for c in today if c.get("status") == "skipped")
        return {
            "total": total,
            "completed": completed,
            "pending": pending,
            "skipped": skipped,
            "completion_percent": round((completed / total) * 100, 1) if total else 0,
            "all_done": pending == 0 and total > 0,
        }
