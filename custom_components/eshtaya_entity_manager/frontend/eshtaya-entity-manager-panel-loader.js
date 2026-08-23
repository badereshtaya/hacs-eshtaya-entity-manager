import "./eshtaya-entity-manager-panel.js";

const DOMAIN = "eshtaya_entity_manager";

const panelClass = customElements.get("eshtaya-entity-manager-panel");

if (panelClass) {
  const originalBulkModal = panelClass.prototype._renderBulkModal;
  const originalRenderFile = panelClass.prototype._renderFile;
  const originalOnClick = panelClass.prototype._onClick;
  const originalOnChange = panelClass.prototype._onChange;

  // Compatibility fixes for v1.0.0 base panel.
  panelClass.prototype._renderBulkModal = function () {
    const html = originalBulkModal.call(this);
    return html.replace('value="llow"', 'value="allow"');
  };

  panelClass.prototype._callAndReload = async function (message, success, includeFile = false) {
    if (!this._hass) return;
    this._loading = true;
    this._render();
    try {
      await this._hass.callWS(message);
      this._loading = false;
      await this._load(includeFile || this._tab === "file");
      this._toast(success);
    } catch (err) {
      this._loading = false;
      this._render();
      this._toast(this._errorText(err), true);
    }
  };

  panelClass.prototype._renderFile = function () {
    const original = originalRenderFile.call(this);
    const ar = this._lang() === "ar";
    const file = this._data?.file || {};
    const preview = this._rulesImportPreview;
    const previewHtml = preview
      ? `<div class="yamlMeta" style="margin-top:12px">
          <div class="metaBox"><div class="label">${ar ? "الملف" : "File"}</div><code>${this._esc(preview.name)}</code></div>
          <div class="metaBox"><div class="label">Domains</div><code>${preview.domains}</code></div>
          <div class="metaBox"><div class="label">Force Allow</div><code>${preview.allow}</code></div>
          <div class="metaBox"><div class="label">Force Exclude</div><code>${preview.exclude}</code></div>
        </div>`
      : "";

    return `${original}
      <section class="sectionCard">
        <div class="sectionTitle">${ar ? "استيراد / تصدير قواعد Alexa" : "Import / export Alexa rules"}</div>
        <div class="sectionDesc">${ar
          ? "ارفع alexa_rules.json من النظام القديم لاسترجاع Domains وForce Allow وForce Exclude وقواعد Auto-exclude. يتم حفظ نسخة احتياطية من القواعد الحالية قبل الاستيراد."
          : "Upload alexa_rules.json from the legacy manager to restore domains, Force Allow, Force Exclude and automatic exclusion rules. Current rules are backed up before import."}</div>
        <div class="formGrid">
          <div class="field">
            <label>${ar ? "ملف القواعد" : "Rules file"}</label>
            <input class="textInput" style="width:100%;padding:9px" type="file" accept=".json,application/json" data-rules-import-file>
            <div class="fieldHint">alexa_rules.json</div>
          </div>
          <div class="field">
            <label>${ar ? "ملفات الإخراج المتزامنة" : "Synchronized output files"}</label>
            <div class="metaBox"><code>${this._esc(file.path || "/config/hidden_entities.yaml")}</code></div>
            <div class="metaBox" style="margin-top:6px"><code>${this._esc(file.public_path || "/config/www/hidden_entities.yaml")}</code></div>
          </div>
        </div>
        ${previewHtml}
        <div class="heroActions" style="margin-top:14px">
          <button class="btn primary" data-action="import-rules" ${this._pendingRulesImport ? "" : "disabled"}>${ar ? "استيراد واستبدال القواعد" : "Import and replace rules"}</button>
          <button class="btn ghost" data-action="export-rules">${ar ? "تنزيل نسخة احتياطية JSON" : "Download JSON backup"}</button>
        </div>
        <div class="fieldHint" style="margin-top:10px">${ar
          ? `نسخة القواعد السابقة: ${this._esc(file.rules_backup_path || "/config/eshtaya_entity_manager_rules_backup.json")}`
          : `Previous-rules backup: ${this._esc(file.rules_backup_path || "/config/eshtaya_entity_manager_rules_backup.json")}`}</div>
      </section>`;
  };

  panelClass.prototype._onChange = async function (ev) {
    const target = ev.target;
    if (target.matches("[data-rules-import-file]")) {
      const file = target.files?.[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid JSON object");
        if (!("domains" in parsed) && !("entities" in parsed) && !("defaults" in parsed)) {
          throw new Error("Not an alexa_rules.json file");
        }
        const entities = parsed.entities && typeof parsed.entities === "object" ? parsed.entities : {};
        let allow = 0;
        let exclude = 0;
        Object.values(entities).forEach((value) => {
          const enabled = value && typeof value === "object" ? value.enabled : null;
          if (enabled === true) allow += 1;
          if (enabled === false) exclude += 1;
        });
        this._pendingRulesImport = parsed;
        this._rulesImportPreview = {
          name: file.name,
          domains: Object.keys(parsed.domains || {}).length,
          allow,
          exclude,
        };
        this._render();
      } catch (err) {
        this._pendingRulesImport = null;
        this._rulesImportPreview = null;
        this._render();
        this._toast(this._errorText(err), true);
      }
      return;
    }
    return originalOnChange.call(this, ev);
  };

  panelClass.prototype._onClick = async function (ev) {
    const target = ev.target.closest("[data-action]");
    const action = target?.dataset?.action;
    const ar = this._lang() === "ar";

    if (action === "import-rules") {
      if (!this._pendingRulesImport) return;
      this._loading = true;
      this._render();
      try {
        const result = await this._hass.callWS({
          type: `${DOMAIN}/import_rules`,
          rules: this._pendingRulesImport,
        });
        this._pendingRulesImport = null;
        this._rulesImportPreview = null;
        this._loading = false;
        await this._load(true);
        this._toast(ar
          ? `تم الاستيراد: ${result.force_exclude} مستثنى و ${result.force_allow} مسموح إجباريًا`
          : `Imported: ${result.force_exclude} excluded and ${result.force_allow} force-allowed`);
      } catch (err) {
        this._loading = false;
        this._render();
        this._toast(this._errorText(err), true);
      }
      return;
    }

    if (action === "export-rules") {
      try {
        const rules = await this._hass.callWS({ type: `${DOMAIN}/export_rules` });
        const blob = new Blob([JSON.stringify(rules, null, 2) + "\n"], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "alexa_rules.json";
        anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        this._toast(ar ? "تم تجهيز نسخة القواعد" : "Rules backup downloaded");
      } catch (err) {
        this._toast(this._errorText(err), true);
      }
      return;
    }

    return originalOnClick.call(this, ev);
  };
}
