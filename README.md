# Eshtaya Entity Manager

A Home Assistant custom integration that moves entity-name management and Alexa exclusion management into Home Assistant itself.

## What it does

- Adds an **Entity Manager** panel to the Home Assistant sidebar.
- Renames entities through Home Assistant's **Entity Registry** (no external token or PHP page).
- Manages Alexa exposure with three entity rules: **Inherit**, **Force Allow**, and **Force Exclude**.
- Supports per-domain enable/disable rules.
- Supports automatic exclusion by `entity_category` and keywords.
- Supports search, filters, domain tabs, device grouping, area visibility, and bulk edits.
- Generates and keeps **both** `/config/hidden_entities.yaml` and `/config/www/hidden_entities.yaml` synchronized atomically.
- Creates both YAML files automatically on a fresh installation; an empty ruleset is written as a valid YAML list (`[]`).
- Imports and exports the legacy `alexa_rules.json` format, including domains, entity overrides, and automatic exclusion defaults.
- Imports an existing `hidden_entities.yaml` on first installation and creates `/config/hidden_entities.yaml.pre_eshtaya_backup` (and the equivalent backup under `/config/www/` when that copy already existed) before taking over the file.
- Admin-only panel and WebSocket commands.
- Arabic and English UI.

## Rule priority

The effective Alexa rule uses this order:

1. Force Allow
2. Force Exclude
3. Domain disabled
4. Automatic category/keyword exclusion
5. Included

## HACS installation

Until the repository is included in the HACS default store:

1. HACS → Integrations → three-dot menu → **Custom repositories**.
2. Add `https://github.com/badereshtaya/hacs-eshtaya-entity-manager` as **Integration**.
3. Install **Eshtaya Entity Manager**.
4. Restart Home Assistant.
5. Settings → Devices & services → Add integration → **Eshtaya Entity Manager**.
6. Open **Entity Manager** from the sidebar.

No `configuration.yaml` changes are required.

## Legacy alexa_rules.json migration

Open **Entity Manager → Alexa file** and choose an `alexa_rules.json` file exported by the old PHP manager. The panel previews the number of domains, Force Allow entries and Force Exclude entries before import. Import replaces the current rules and immediately regenerates both synchronized YAML files.

Before a JSON import, the current rules are backed up to:

`/config/eshtaya_entity_manager_rules_backup.json`

The same panel can export the current configuration back to `alexa_rules.json` for migration to another Home Assistant instance.

## Existing hidden_entities.yaml

On first setup, if an existing hidden YAML copy is found, the integration imports its YAML list as **Force Exclude** and starts with automatic/domain exclusions neutralized so the existing effective list is preserved. One-time backups are created for copies that already existed:

- `/config/hidden_entities.yaml.pre_eshtaya_backup`
- `/config/www/hidden_entities.yaml.pre_eshtaya_backup`

After migration, manage the generated files through the panel. Manual edits can be overwritten.

## Development

Repository layout:

```text
custom_components/
  eshtaya_entity_manager/
    __init__.py
    config_flow.py
    const.py
    manager.py
    manager_v11.py
    panel.py
    websocket.py
    websocket_v11.py
    manifest.json
    strings.json
    translations/
    frontend/
```

The frontend is plain JavaScript and requires no npm build step.

## Security

The integration does not store Home Assistant long-lived access tokens. All operations run inside the authenticated Home Assistant instance, and the panel/API require an administrator account.

## License

MIT
