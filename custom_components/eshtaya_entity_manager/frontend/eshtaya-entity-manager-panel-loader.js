import "./eshtaya-entity-manager-panel.js";

const panelClass = customElements.get("eshtaya-entity-manager-panel");

if (panelClass) {
  const originalBulkModal = panelClass.prototype._renderBulkModal;

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
}
