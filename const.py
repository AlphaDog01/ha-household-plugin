"""Constants for Hades Household Integration."""

DOMAIN = "hades_household"

# ── Chores ────────────────────────────────────────────────────────────────────
CONF_CHORES_HOST = "chores_host"
CONF_CHORES_API_KEY = "chores_api_key"
CONF_TRACKED_PEOPLE = "tracked_people"

CHORES_PEOPLE = ["Caleb", "Cameron", "Courtney", "Dad", "Mom"]

CHORES_UPDATE_INTERVAL = 5  # minutes

# ── Calendars ─────────────────────────────────────────────────────────────────
CONF_CALENDARS = "calendars"
CONF_CALENDAR_NAME = "calendar_name"
CONF_CALENDAR_URL = "calendar_url"

CALENDAR_UPDATE_INTERVAL = 30  # minutes

# ── Coordinator keys ──────────────────────────────────────────────────────────
COORDINATOR_CHORES = "chores"
COORDINATOR_CALENDARS = "calendars"
