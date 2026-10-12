// Télécharge les planches d'images clés (storyboards YouTube) de chaque vidéo pour l'ambilight en direct.
// Usage : node storyboards.js <dossier du site> <id1> <id2> ...
// Écrit <site>/ambi/<id>/M<n>.webp (YouTube sert du WebP) et affiche les données à reporter dans AMBI (index.html).
const fs = require("fs"), path = require("path");
const [site, ...ids] = process.argv.slice(2);
const H = { "Accept-Language": "fr-FR,fr;q=0.9", "Cookie": "CONSENT=YES+1; SOCS=CAI",
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36" };

(async () => {
  const out = {};
  for (const id of ids) {
    const page = await (await fetch("https://www.youtube.com/watch?v=" + id, { headers: H })).text();
    const m = page.match(/"playerStoryboardSpecRenderer":\{"spec":"([^"]+)"/);
    if (!m) { console.error(id, ": pas de storyboard"); continue; }
    const [base, ...levels] = m[1].replace(/\\u0026/g, "&").split("|");
    // niveau le plus fin dont les images font au moins 80 px de large (largement assez une fois floutées)
    const parsed = levels.map((l, i) => { const [w, h, n, cols, rows, ms, name, sigh] = l.split("#"); return { L: i, w: +w, h: +h, n: +n, cols: +cols, rows: +rows, ms: +ms, name, sigh }; });
    const lv = parsed.find(p => p.ms > 0 && p.w >= 80) || parsed.find(p => p.ms > 0);
    if (!lv) { console.error(id, ": niveau introuvable"); continue; }
    const sheets = Math.ceil(lv.n / (lv.cols * lv.rows));
    fs.mkdirSync(path.join(site, "ambi", id), { recursive: true });
    for (let s = 0; s < sheets; s++) {
      const url = base.replace("$L", lv.L).replace("$N", lv.name.replace("$M", s)) + "&sigh=" + lv.sigh;
      const r = await fetch(url, { headers: H });
      if (!r.ok) throw new Error(`${id} planche ${s} : HTTP ${r.status}`);
      fs.writeFileSync(path.join(site, "ambi", id, `M${s}.webp`), Buffer.from(await r.arrayBuffer()));
    }
    out[id] = { n: lv.n, cols: lv.cols, rows: lv.rows, ms: lv.ms, sheets };
    out[id].ar = `${lv.w}/${lv.h}`;
    // chaîne YouTube de la vidéo (nom, lien, photo de profil) pour CHAINES
    try {
      const o = await (await fetch("https://www.youtube.com/oembed?format=json&url=https://www.youtube.com/watch?v=" + id)).json();
      const cp = await (await fetch(o.author_url, { headers: H })).text();
      const pp = (cp.match(/<meta property="og:image" content="([^"]+)"/) || [])[1];
      out[id].chaine = { nom: o.author_name, url: o.author_url, pp: pp && pp.replace(/=s\d+.*$/, "=s176-c-k-c0x00ffffff-no-rj") };
    } catch (e) { console.error(id, ": chaîne introuvable"); }
    console.error(id, `: ${sheets} planche(s), ${lv.n} images ${lv.w}x${lv.h}, une toutes les ${lv.ms} ms`);
  }
  console.log(JSON.stringify(out));
})();
