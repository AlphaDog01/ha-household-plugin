"""Constants for Hades Household Integration."""

DOMAIN = "hades_household"

# ── Chores ────────────────────────────────────────────────────────────────────
CONF_CHORES_HOST = "chores_host"
CONF_CHORES_API_KEY = "chores_api_key"
CONF_TRACKED_PEOPLE = "tracked_people"

CHORES_UPDATE_INTERVAL = 5  # minutes

# ── Calendars ─────────────────────────────────────────────────────────────────
CONF_CALENDARS = "calendars"
CONF_CALENDAR_NAME = "calendar_name"
CONF_CALENDAR_URL = "calendar_url"
CONF_CALENDAR_TYPE = "calendar_type"
CONF_CALENDAR_USERNAME = "calendar_username"
CONF_CALENDAR_PASSWORD = "calendar_password"

CALENDAR_TYPE_ICAL   = "ical"
CALENDAR_TYPE_CALDAV = "caldav"

CALENDAR_UPDATE_INTERVAL = 30  # minutes

# ── Coordinator keys ──────────────────────────────────────────────────────────
COORDINATOR_CHORES    = "chores"
COORDINATOR_CALENDARS = "calendars"
