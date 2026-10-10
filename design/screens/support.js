// Stand-in for the design canvas runtime, so these .dc.html screens open in
// any browser (and render-previews.mjs can screenshot them). It renders the
// starting state: {{holes}}, <sc-for>, <sc-if> and the component's
// renderVals(). Clicks do nothing here; the interactive version lives on the
// design canvas. ?props={"startStep":"wallet"} overrides a screen's props.
(function () {
  class DCLogic {
    constructor(props) {
      this.props = props || {};
      this.state = {};
    }
    setState(patch) {
      Object.assign(this.state, typeof patch === "function" ? patch(this.state) : patch);
    }
    forceUpdate() {}
  }
  window.DCLogic = DCLogic;

  const HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  const whole = (s) => {
    const m = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/.exec(s);
    return m ? m[1] : null;
  };
  function lookup(scope, path) {
    if (path === "true") return true;
    if (path === "false") return false;
    if (/^-?\d+(\.\d+)?$/.test(path)) return Number(path);
    if (/^'.*'$|^".*"$/.test(path)) return path.slice(1, -1);
    return path.split(".").reduce((v, k) => (v == null ? undefined : v[k]), scope);
  }
  const interp = (s, scope) =>
    s.replace(HOLE, (_, p) => {
      const v = lookup(scope, p);
      return v == null ? "" : String(v);
    });

  function render(node, scope) {
    if (node.nodeType === 3) {
      if (node.nodeValue.includes("{{")) node.nodeValue = interp(node.nodeValue, scope);
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();
    if (tag === "sc-for") {
      const path = whole(node.getAttribute("list") || "");
      const list = (path && lookup(scope, path)) || [];
      const as = node.getAttribute("as") || "item";
      const out = document.createDocumentFragment();
      list.forEach((item, i) => {
        const copy = node.cloneNode(true);
        const sub = Object.assign(Object.create(scope), { [as]: item, $index: i });
        [...copy.childNodes].forEach((c) => {
          out.appendChild(c);
          render(c, sub);
        });
      });
      node.replaceWith(out);
      return;
    }
    if (tag === "sc-if") {
      const path = whole(node.getAttribute("value") || "");
      if (!(path && lookup(scope, path))) {
        node.remove();
        return;
      }
      const kids = [...node.childNodes];
      node.replaceWith(...kids);
      kids.forEach((c) => render(c, scope));
      return;
    }
    for (const a of [...node.attributes]) {
      if (/^on/i.test(a.name)) {
        node.removeAttribute(a.name);
        continue;
      }
      if (!a.value.includes("{{")) continue;
      const path = whole(a.value);
      const v = path ? lookup(scope, path) : interp(a.value, scope);
      if (v === false || v == null) node.removeAttribute(a.name);
      else node.setAttribute(a.name, v === true ? "" : String(v));
    }
    if (tag === "textarea" && node.hasAttribute("value")) node.value = node.getAttribute("value");
    [...node.childNodes].forEach((c) => render(c, scope));
  }

  document.addEventListener("DOMContentLoaded", () => {
    const host = document.querySelector("x-dc");
    if (!host) return;
    const helmet = host.querySelector("helmet");
    if (helmet) {
      [...helmet.children].forEach((el) => document.head.appendChild(el));
      helmet.remove();
    }
    let vals = {};
    const script = document.querySelector("script[data-dc-script]");
    if (script) {
      const defs = JSON.parse(script.getAttribute("data-props") || "{}");
      const props = {};
      for (const [k, d] of Object.entries(defs)) if (k[0] !== "$" && d && "default" in d) props[k] = d.default;
      const override = new URLSearchParams(location.search).get("props");
      if (override) Object.assign(props, JSON.parse(override));
      const Component = new Function("DCLogic", `${script.textContent}\nreturn Component;`)(DCLogic);
      vals = new Component(props).renderVals() || {};
    }
    const kids = [...host.childNodes];
    host.replaceWith(...kids);
    kids.forEach((n) => render(n, vals));
    document.documentElement.dataset.rendered = "1";
  });
})();
