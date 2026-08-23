# Eshtaya Entity Manager

A Home Assistant custom integration that moves entity-name management and Alexa exclusion management into Home Assistant itself.

## What it does

- Adds an **Entity Manager** panel to the Home Assistant sidebar.
- Renames entities through Home Assistant's **Entity Registry** (no external token or PHP page).
- Manages Alexa exposure with three entity rules: **Inherit**, **Force Allow**, and **Force Exclude**.
- Supports per-domain enable/disable rules.
- Supports automatic exclusion by `entity_category` and keywords.
- Supports search, filters, domain tabs, device grouping, area visibility, and bulk edits.
- Generates `/config/hidden_entities.yaml` atomically.
- Imports an existing `hidden_entities.yaml` on first installation and creates `/config/hidden_entities.yaml.pre_eshtaya_backup` before taking over the file.
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

## Existing hidden_entities.yaml

On first setup, if `/config/hidden_entities.yaml` already contains a YAML list, the integration imports those entries as **Force Exclude** and starts with automatic/domain exclusions neutralized so the existing effective list is preserved. A one-time backup is created at:

`/config/hidden_entities.yaml.pre_eshtaya_backup`

After migration, manage the generated file through the panel. Manual edits to `hidden_entities.yaml` can be overwritten.

## Development

Repository layout:

```text
custom_components/
  eshtaya_entity_manager/
    __init__.py
    config_flow.py
    const.py
    manager.py
    panel.py
    websocket.py
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
