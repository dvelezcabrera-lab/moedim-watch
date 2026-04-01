import { useState, useEffect } from "react";

/* ── constants ── */
const SYN = 29.530588853;
const LAT = 18.5, LNG = -67.02;

/* ── astronomy ── */
function moonAge(d) {
  const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1;
  const day = d.getUTCDate() + d.getUTCHours() / 24 + d.getUTCMinutes() / 1440;
  const a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
  const jd = day + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  const age = ((jd - 2451550.1) / SYN % 1) * SYN;
  return age < 0 ? age + SYN : age;
}
function illum(age) { return (1 - Math.cos(age / SYN * 2 * Math.PI)) / 2; }
function bibDay(a) { const d = Math.floor(a - 1.5) + 1; return d < 1 ? d + 30 : d > 30 ? d - 30 : d; }

function sunsetHour(date) {
  const doy = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 864e5);
  const decl = 23.45 * Math.sin((2 * Math.PI / 365) * (doy - 81));
  const dR = decl * Math.PI / 180, lR = LAT * Math.PI / 180;
  const ha = Math.acos(Math.max(-1, Math.min(1, -Math.tan(lR) * Math.tan(dR)))) * 180 / Math.PI;
  const noonUTC = 12 - LNG / 15;
  return noonUTC + ha / 15 - 4;
}
function fmtTime(h) {
  let hr = Math.floor(h), mn = Math.round((h - hr) * 60);
  if (mn === 60) { hr++; mn = 0; }
  const ap = hr >= 12 ? "PM" : "AM";
  let h12 = hr % 12; if (h12 === 0) h12 = 12;
  return h12 + ":" + String(mn).padStart(2, "0") + " " + ap;
}
function afterSunset(d) { return d.getHours() + d.getMinutes() / 60 >= sunsetHour(d); }

/* ── phase labels ── */
function phaseInfo(a, s) {
  const P = [
    [1.5, "New Moon", "Luna Nueva", "Chodesh · חֹדֶשׁ", s ? "La luna está oscura — observa el creciente al atardecer." : "The moon is dark — watch for the crescent at sunset."],
    [3.5, "New Crescent", "Creciente Nuevo", "Chodesh · חֹדֶשׁ", s ? "Si el creciente fue avistado, un nuevo mes comienza." : "If the crescent was sighted, a new month begins."],
    [7.4, "Waxing Crescent", "Creciente", "", s ? "La luna crece en el cielo oeste al atardecer." : "The moon grows in the western sky after sunset."],
    [8.4, "First Quarter", "Cuarto Creciente", "", s ? "Mitad iluminada — aprox. el 7mo del mes." : "Half lit — about the 7th of the month."],
    [14, "Waxing Gibbous", "Gibosa Creciente", "", s ? "La luna se acerca a su plenitud." : "The moon approaches fullness."],
    [16, "Full Moon", "Luna Llena", "", s ? "Luna llena — el 14to–15to. Muchos moedim caen aquí." : "Full moon — the 14th–15th. Many moedim fall here."],
    [22, "Waning Gibbous", "Gibosa Menguante", "", s ? "Segunda mitad del mes — la luna disminuye." : "Second half of the month — the moon diminishes."],
    [23.5, "Last Quarter", "Cuarto Menguante", "", s ? "Mitad iluminada al amanecer — aprox. el 22do." : "Half lit at dawn — about the 22nd."],
    [28, "Waning Crescent", "Menguante", "", s ? "La luna vieja se desvanece." : "The old moon fades. New crescent comes soon."],
    [99, "Dark Moon", "Luna Oscura", "", s ? "Luna no visible." : "Moon not visible."]
  ];
  for (const [th, en, sp, hb, desc] of P) if (a < th) return { name: s ? sp : en, heb: hb, desc };
  return { name: "—", heb: "", desc: "" };
}

/* ── moedim data (fully bilingual) ── */
const MOEDIM = [
  { n:"Rosh Chodesh Aviv", ne:"New Year · Aviv 1", d:"2026-03-21", h:"Aviv 1",
    ve:"Éx. 12:2", vn:"Ex. 12:2",
    te:"Este mes os será principio de los meses; para vosotros será éste el primero en los meses del año.",
    tn:"This month shall be unto you the beginning of months; it shall be the first month of the year to you.",
    re:"2 Co. 5:17", rn:"2 Cor. 5:17",
    se:"Si alguno está en Cristo, nueva criatura es; las cosas viejas pasaron; he aquí todas son hechas nuevas.",
    sn:"If anyone is in Christ, he is a new creation; the old has passed away; behold, the new has come.",
    me:"El año comienza cuando la tierra misma da testimonio — la cebada madura, la luna se renueva. Dios no cuenta el tiempo desde el cielo solamente; lo ancla en la creación que Él habita.",
    mn:"The year begins when the earth itself bears witness — the barley ripens, the moon renews. God does not count time from heaven alone; He anchors it in the creation He inhabits." },
  { n:"Selección del Cordero", ne:"Lamb Selection · Aviv 10", d:"2026-03-30", h:"Aviv 10",
    ve:"Éx. 12:3", vn:"Ex. 12:3",
    te:"En el diez de este mes tómese cada uno un cordero según las familias de los padres, un cordero por familia.",
    tn:"On the tenth day of this month every man shall take a lamb, according to the house of their fathers, a lamb for a household.",
    re:"Juan 1:29", rn:"John 1:29",
    se:"He aquí el Cordero de Dios, que quita el pecado del mundo.",
    sn:"Behold the Lamb of God, who takes away the sin of the world.",
    me:"El cordero entra en la casa cuatro días antes de morir. Vive donde la familia vive. La ofrenda no viene de afuera — habita primero, y después se entrega.",
    mn:"The lamb enters the house four days before it dies. It lives where the family lives. The offering does not come from outside — it dwells first, then gives itself." },
  { n:"Pesach", ne:"Passover · Aviv 14", d:"2026-04-03", h:"Aviv 14",
    ve:"Lv. 23:5", vn:"Lev. 23:5",
    te:"En el mes primero, a los catorce del mes, entre las dos tardes, satisfacción es de YHWH.",
    tn:"In the fourteenth day of the first month at twilight is YHWH's passover.",
    re:"1 Co. 5:7", rn:"1 Cor. 5:7",
    se:"Porque nuestra satisfacción, que es Cristo, ya fue sacrificada por nosotros.",
    sn:"For Christ, our Passover lamb, has been sacrificed.",
    me:"La sangre en los postes de la puerta convierte una casa común en espacio sagrado. Donde hay sangre aplicada, Dios pasa — no de largo, sino a través. El hogar se vuelve morada.",
    mn:"Blood on the doorposts turns an ordinary house into sacred space. Where blood is applied, God passes — not by, but through. The home becomes a dwelling." },
  { n:"Matzot", ne:"Unleavened Bread · Aviv 15–21", d:"2026-04-04", h:"Aviv 15",
    ve:"Lv. 23:6", vn:"Lev. 23:6",
    te:"Y a los quince días de este mes es la fiesta solemne de los panes sin levadura a YHWH.",
    tn:"On the fifteenth day of the same month is the feast of unleavened bread unto YHWH.",
    re:"1 Co. 5:8", rn:"1 Cor. 5:8",
    se:"Así que celebremos la fiesta con panes sin levadura, de sinceridad y de verdad.",
    sn:"Let us keep the feast with the unleavened bread of sincerity and truth.",
    me:"Salir de Egipto es salir de un espacio que no te pertenece. La levadura es lo que queda del lugar viejo. Limpiar la casa es preparar la nueva morada.",
    mn:"Leaving Egypt is leaving a space that was never yours. Leaven is what remains of the old place. Cleaning house is preparing the new dwelling." },
  { n:"Primicias", ne:"First Fruits · Aviv 16", d:"2026-04-05", h:"Aviv 16",
    ve:"Lv. 23:10–11", vn:"Lev. 23:10–11",
    te:"Cuando hayáis entrado en la tierra que yo os doy, traeréis al sacerdote una gavilla por primicia.",
    tn:"When ye are come into the land which I give unto you, ye shall bring a sheaf of the firstfruits of your harvest unto the priest.",
    re:"1 Co. 15:20", rn:"1 Cor. 15:20",
    se:"Mas ahora Cristo ha resucitado de los muertos; primicias de los que durmieron es hecho.",
    sn:"But now Christ is risen from the dead, and has become the firstfruits of those who have fallen asleep.",
    me:"Destruyan este templo y en tres días lo levantaré. Lo levantó. El templo que los hombres construyeron fue reemplazado por el templo que Dios resucitó.",
    mn:"Destroy this temple and in three days I will raise it up. He raised it. The temple men built was replaced by the temple God resurrected." },
  { n:"Shavuot", ne:"Pentecost · Sivan 6", d:"2026-05-24", h:"Sivan 6",
    ve:"Lv. 23:15–16", vn:"Lev. 23:15–16",
    te:"Y contaréis desde el día que sigue al día de reposo… siete semanas cumplidas serán.",
    tn:"And ye shall count from the morrow after the sabbath… seven sabbaths shall be complete.",
    re:"Hch. 2:1–4", rn:"Acts 2:1–4",
    se:"Cuando llegó el día de Pentecostés, fueron todos llenos del Espíritu Santo.",
    sn:"When the day of Pentecost had fully come, they were all filled with the Holy Spirit.",
    me:"La gloria que llenó el tabernáculo, que llenó el templo, ahora llena personas. El Espíritu no desciende sobre un edificio — desciende sobre ti. Tú eres la morada.",
    mn:"The glory that filled the tabernacle, that filled the temple, now fills persons. The Spirit does not descend on a building — He descends on you. You are the dwelling." },
  { n:"Yom Teruah", ne:"Day of Trumpets · Tishri 1", d:"2026-09-13", h:"Tishri 1",
    ve:"Lv. 23:24", vn:"Lev. 23:24",
    te:"En el mes séptimo, al primero del mes tendréis día de reposo, una satisfacción al son de trompetas.",
    tn:"In the seventh month, in the first day of the month, ye shall have a sabbath, a memorial of blowing of trumpets.",
    re:"1 Ts. 4:16", rn:"1 Thess. 4:16",
    se:"Porque el Señor mismo descenderá del cielo con voz de mando, con voz de arcángel, y con trompeta de Dios.",
    sn:"For the Lord himself shall descend from heaven with a shout, with the voice of the archangel, and with the trump of God.",
    me:"El sonido del shofar siempre acompaña la llegada de Dios a Su espacio. Sinaí tembló con trompeta. El Rey anuncia que se acerca a Su morada.",
    mn:"The shofar always accompanies God's arrival at His space. Sinai trembled with a trumpet. The King announces He approaches His dwelling." },
  { n:"Yom Kippur", ne:"Day of Atonement · Tishri 10", d:"2026-09-22", h:"Tishri 10",
    ve:"Lv. 23:27", vn:"Lev. 23:27",
    te:"A los diez días de este mes séptimo será el día de expiación.",
    tn:"On the tenth day of this seventh month there shall be a day of atonement.",
    re:"He. 9:11–12", rn:"Heb. 9:11–12",
    se:"Por su propia sangre, entró una vez para siempre en el Lugar Santísimo, habiendo obtenido eterna redención.",
    sn:"By his own blood he entered in once into the holy place, having obtained eternal redemption for us.",
    me:"Solo un día al año, un solo hombre entraba donde cielo y tierra se tocan. El velo se rasgó. El acceso al espacio sagrado ya no tiene restricción.",
    mn:"One day a year, one man entered where heaven and earth touch. The veil was torn. Access to sacred space is no longer restricted." },
  { n:"Sukkot", ne:"Tabernacles · Tishri 15–21", d:"2026-09-27", h:"Tishri 15",
    ve:"Lv. 23:34", vn:"Lev. 23:34",
    te:"A los quince días de este mes séptimo será la fiesta solemne de los tabernáculos a YHWH por siete días.",
    tn:"The fifteenth day of this seventh month shall be the feast of tabernacles for seven days unto YHWH.",
    re:"Juan 7:37–38", rn:"John 7:37–38",
    se:"Si alguno tiene sed, venga a mí y beba. De su interior correrán ríos de agua viva.",
    sn:"If anyone thirsts, let him come to me and drink. Out of his heart will flow rivers of living water.",
    me:"Dios le pidió a Israel que viviera en estructuras frágiles para recordar que Él es la estructura. La suká no protege — quien habita en ella protege.",
    mn:"God asked Israel to live in fragile structures to remember that He is the structure. The sukkah does not protect — the One who dwells in it does." },
  { n:"Shemini Atzeret", ne:"Eighth Day · Tishri 22", d:"2026-10-04", h:"Tishri 22",
    ve:"Lv. 23:36", vn:"Lev. 23:36",
    te:"El octavo día tendréis satisfacción santa.",
    tn:"On the eighth day shall be a holy convocation unto you.",
    re:"Ap. 21:3", rn:"Rev. 21:3",
    se:"He aquí el tabernáculo de Dios con los hombres, y él morará con ellos.",
    sn:"Behold, the tabernacle of God is with men, and he will dwell with them.",
    me:"El octavo día es el día después del ciclo completo — nueva creación. La última morada no es un lugar que visitamos. Es donde Dios y el hombre ya no se separan.",
    mn:"The eighth day is the day after the complete cycle — new creation. The final dwelling is not a place we visit. It is where God and man no longer part." }
];

/* ── omer ── */
const FF = new Date(2026, 3, 5);
function getOmer(now, isAfter) {
  const e = new Date(now);
  if (isAfter) e.setDate(e.getDate() + 1);
  const day = Math.floor((e - FF) / 864e5);
  if (day < 1 || day > 49) return null;
  return { day, w: Math.floor(day / 7), r: day % 7 };
}

/* ── month name ── */
function monthName(now, s) {
  const m = now.getMonth();
  const en = ["11th Month (Shevat)","12th Month (Adar)","1st Month (Aviv)","1st Month (Aviv)","2nd Month (Iyyar)","3rd Month (Sivan)","4th Month (Tammuz)","5th Month (Av)","6th Month (Elul)","7th Month (Tishri)","8th Month (Cheshvan)","9th Month (Kislev)"];
  const sp = ["11° Mes (Shevat)","12° Mes (Adar)","1er Mes (Aviv)","1er Mes (Aviv)","2° Mes (Iyyar)","3er Mes (Siván)","4° Mes (Tamuz)","5° Mes (Av)","6° Mes (Elul)","7° Mes (Tishri)","8° Mes (Jeshván)","9° Mes (Kislev)"];
  return s ? sp[m] : en[m];
}

/* ── daily verses (bilingual, curated pairs) ── */
function dailyVerse(age, shab, s) {
  const d = new Date().getDate();
  if (shab) {
    const v = [
      { ov:s?"Gn. 2:2–3":"Gen. 2:2–3", ot:s?"Y reposó el día séptimo de toda la obra que hizo.":"And he rested on the seventh day from all his work.",
        nv:s?"He. 4:9–10":"Heb. 4:9–10", nt:s?"Queda un reposo para el pueblo de Dios. El que ha entrado en su reposo, también ha reposado de sus obras.":"There remains a rest for the people of God. Whoever has entered God's rest has also rested from his works." },
      { ov:s?"Éx. 31:13":"Ex. 31:13", ot:s?"Mis días de reposo guardaréis, porque es señal entre mí y vosotros.":"You shall keep my sabbaths, for it is a sign between me and you.",
        nv:s?"Mr. 2:27–28":"Mark 2:27–28", nt:s?"El día de reposo fue hecho por causa del hombre. El Hijo del Hombre es Señor aun del día de reposo.":"The sabbath was made for man. The Son of Man is Lord even of the sabbath." },
      { ov:s?"Is. 58:13–14":"Isa. 58:13–14", ot:s?"Si retrajeres del día de reposo tu pie, yo te haré subir sobre las alturas de la tierra.":"If you turn back your foot from the sabbath, I will make you ride on the heights of the earth.",
        nv:s?"Mt. 11:28–29":"Matt. 11:28–29", nt:s?"Venid a mí todos los que estáis trabajados, y yo os haré descansar.":"Come to me, all who labor, and I will give you rest." }
    ];
    return v[d % v.length];
  }
  if (age < 3) return { ov:s?"Sal. 81:3":"Ps. 81:3", ot:s?"Tocad la trompeta en la nueva luna, en el día señalado.":"Blow the trumpet at the new moon, at the appointed time.",
    nv:s?"Ap. 22:2":"Rev. 22:2", nt:s?"El árbol de vida produce doce frutos, dando cada mes su fruto.":"The tree of life yielded twelve fruits, each tree yielding its fruit every month." };
  if (age > 13 && age < 16) return { ov:s?"Sal. 136:7–9":"Ps. 136:7–9", ot:s?"Al que hizo las grandes lumbreras — la luna para señorear en la noche.":"To him who made great lights — the moon to rule by night.",
    nv:s?"Ap. 21:23":"Rev. 21:23", nt:s?"La ciudad no tiene necesidad de sol ni de luna, porque la gloria de Dios la ilumina.":"The city has no need of sun or moon, for the glory of God gives it light." };
  const v = [
    { ov:s?"Gn. 1:14":"Gen. 1:14", ot:s?"Haya lumbreras en la expansión de los cielos para señales y para estaciones.":"Let there be lights in the firmament for signs and for seasons.",
      nv:s?"Gá. 4:4":"Gal. 4:4", nt:s?"Cuando vino el cumplimiento del tiempo, Dios envió a su Hijo.":"When the fullness of time had come, God sent forth his Son." },
    { ov:s?"Sal. 104:19":"Ps. 104:19", ot:s?"Hizo la luna para los tiempos; el sol conoce su ocaso.":"He appointed the moon for seasons; the sun knows its going down.",
      nv:s?"Juan 1:14":"John 1:14", nt:s?"Aquel Verbo fue hecho carne, y habitó entre nosotros.":"The Word became flesh and dwelt among us." },
    { ov:s?"Sal. 90:12":"Ps. 90:12", ot:s?"Enséñanos a contar nuestros días, que traigamos al corazón sabiduría.":"Teach us to number our days, that we may gain a heart of wisdom.",
      nv:s?"Ef. 5:15–16":"Eph. 5:15–16", nt:s?"Mirad con diligencia cómo andéis, aprovechando bien el tiempo.":"Look carefully how you walk, making the best use of the time." },
    { ov:s?"Dt. 16:1":"Deut. 16:1", ot:s?"Guardarás el mes de Aviv, y harás satisfacción a YHWH tu Dios.":"Observe the month of Aviv and keep the Passover to YHWH your God.",
      nv:s?"1 Co. 11:26":"1 Cor. 11:26", nt:s?"Todas las veces que comiereis este pan y bebiereis esta copa, la muerte del Señor anunciáis.":"As often as you eat this bread and drink this cup, you proclaim the Lord's death until he comes." },
    { ov:s?"Jer. 31:35":"Jer. 31:35", ot:s?"El que da el sol para luz del día, las leyes de la luna y las estrellas para luz de la noche.":"He who gives the sun for a light by day, the ordinances of the moon and stars for a light by night.",
      nv:s?"He. 1:2–3":"Heb. 1:2–3", nt:s?"En estos postreros días nos ha hablado por el Hijo, por quien hizo el universo.":"In these last days he has spoken to us by his Son, through whom he made the universe." }
  ];
  return v[d % v.length];
}

/* ── moon SVG (point-by-point, no arc flags) ── */
function MoonVis({ age }) {
  const sz = 130, r = 58, cx = sz / 2, cy = sz / 2, N = 48;
  const ph = (age / SYN) % 1;
  const k = Math.cos(ph * 2 * Math.PI);
  let pts = "";
  if (ph <= 0.5) {
    for (let i = 0; i <= N; i++) { const a = Math.PI * i / N; pts += (i ? "L" : "M") + (cx + r * Math.sin(a)).toFixed(1) + "," + (cy - r * Math.cos(a)).toFixed(1); }
    for (let i = N; i >= 0; i--) { const a = Math.PI * i / N; pts += "L" + (cx + k * r * Math.sin(a)).toFixed(1) + "," + (cy - r * Math.cos(a)).toFixed(1); }
  } else {
    for (let i = 0; i <= N; i++) { const a = Math.PI * i / N; pts += (i ? "L" : "M") + (cx - k * r * Math.sin(a)).toFixed(1) + "," + (cy - r * Math.cos(a)).toFixed(1); }
    for (let i = N; i >= 0; i--) { const a = Math.PI * i / N; pts += "L" + (cx - r * Math.sin(a)).toFixed(1) + "," + (cy - r * Math.cos(a)).toFixed(1); }
  }
  pts += "Z";
  return (
    <svg width={sz} height={sz} viewBox={"0 0 " + sz + " " + sz} style={{ filter: "drop-shadow(0 0 20px rgba(245,230,184,.12))" }}>
      <defs>
        <radialGradient id="gl" cx="45%" cy="40%"><stop offset="0%" stopColor="#FFFAE8"/><stop offset="45%" stopColor="#F5E6B8"/><stop offset="100%" stopColor="#C8A84E"/></radialGradient>
        <radialGradient id="gd" cx="55%" cy="40%"><stop offset="0%" stopColor="#1a1a2e"/><stop offset="100%" stopColor="#0a0a1a"/></radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="url(#gd)"/>
      <circle cx={cx - 18} cy={cy - 15} r={5} fill="rgba(255,255,255,.03)"/>
      <circle cx={cx + 8} cy={cy + 5} r={3.5} fill="rgba(255,255,255,.03)"/>
      <circle cx={cx - 10} cy={cy + 20} r={4} fill="rgba(255,255,255,.03)"/>
      <path d={pts} fill="url(#gl)"/>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(245,230,184,.08)" strokeWidth="1"/>
    </svg>
  );
}

/* ── animated header moon ── */
const MOON_ICONS = ["\uD83C\uDF11","\uD83C\uDF12","\uD83C\uDF13","\uD83C\uDF14","\uD83C\uDF15","\uD83C\uDF16","\uD83C\uDF17","\uD83C\uDF18"];
function MoonAnim() {
  const [f, setF] = useState(0);
  useEffect(() => { const t = setInterval(() => setF(x => (x + 1) % 80), 140); return () => clearInterval(t); }, []);
  return <span style={{ fontSize: 14 }}>{MOON_ICONS[Math.floor((f / 80) * 8)]}</span>;
}

/* ── share card builder ── */
function buildCard(m, s) {
  const dt = new Date(m.d + "T12:00:00").toLocaleDateString(s ? "es-PR" : "en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  if (s) return "\u2726 " + m.n + " \u2014 " + m.h + "\n\uD83D\uDCC5 " + dt + " al atardecer\n\n\uD83D\uDCDC \u201C" + m.te + "\u201D\n\u2014 " + m.ve + "\n\n\u271D \u201C" + m.se + "\u201D\n\u2014 " + m.re + "\n\n\uD83D\uDD4A " + m.me + "\n\n\u2014 Moedim Watch";
  return "\u2726 " + m.ne + "\n\uD83D\uDCC5 " + dt + " at sunset\n\n\uD83D\uDCDC \u201C" + m.tn + "\u201D\n\u2014 " + m.vn + "\n\n\u271D \u201C" + m.sn + "\u201D\n\u2014 " + m.rn + "\n\n\uD83D\uDD4A " + m.mn + "\n\n\u2014 Moedim Watch";
}

/* ── clipboard (sandbox-safe) ── */
function copyToClip(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;left:-9999px;top:-9999px;opacity:0";
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, 999999);
  document.execCommand("copy");
  document.body.removeChild(ta);
}

/* ── styles ── */
const CARD = { background: "linear-gradient(135deg,rgba(25,22,15,.75),rgba(18,15,10,.85))", border: "1px solid rgba(245,230,184,.08)", borderRadius: 14, padding: "20px 22px", marginBottom: 16 };
const LABEL = { fontSize: 9, fontWeight: 600, letterSpacing: 2.5, textTransform: "uppercase", color: "#8B7D6B", margin: "0 0 8px", fontFamily: "system-ui,-apple-system,sans-serif" };

/* ══════════════════════════════════════════ */
/*                MAIN COMPONENT              */
/* ══════════════════════════════════════════ */
export default function MoedimWatch() {
  const [now, setNow] = useState(new Date());
  const [es, setEs] = useState(true);
  const [exp, setExp] = useState(null);
  const [shareText, setShareText] = useState(null);
  const [didCopy, setDidCopy] = useState(false);

  useEffect(() => { const t = setInterval(() => setNow(new Date()), 60000); return () => clearInterval(t); }, []);

  const age = moonAge(now), pct = illum(age), bD = bibDay(age), dN = Math.ceil(SYN - age);
  const ph = phaseInfo(age, es), isAS = afterSunset(now);
  const isShab = now.getDay() === 6 || (now.getDay() === 5 && isAS);
  const sun = fmtTime(sunsetHour(now)), moN = monthName(now, es);
  const om = getOmer(now, isAS), dv = dailyVerse(age, isShab, es);
  const nxt = MOEDIM.find(m => new Date(m.d + "T18:00:00") > now);
  const dTo = nxt ? Math.ceil((new Date(nxt.d + "T18:00:00") - now) / 864e5) : null;

  function handleShare(m, e) {
    e.stopPropagation();
    setShareText(buildCard(m, es));
    setDidCopy(false);
  }
  function handleCopy() {
    copyToClip(shareText);
    setDidCopy(true);
    setTimeout(() => setDidCopy(false), 2500);
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(170deg,#0a0a1a,#121225 30%,#0d1117 60%,#0a0a1a)", fontFamily: "'Cormorant Garamond','Palatino Linotype','Book Antiqua',Palatino,serif", color: "#e8e0d0", position: "relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap" rel="stylesheet"/>
      <style>{`
        *{box-sizing:border-box}
        .row{transition:all .35s cubic-bezier(.4,0,.2,1);cursor:pointer;border-radius:10px}
        .row:hover{background:rgba(245,230,184,.04)}
        .det{overflow:hidden;transition:max-height .45s cubic-bezier(.4,0,.2,1),opacity .35s ease,padding .35s ease}
        .det.open{max-height:600px;opacity:1;padding-top:12px}
        .det.shut{max-height:0;opacity:0;padding-top:0}
        .sharebtn{display:flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:10px;opacity:.5;flex-shrink:0;cursor:pointer;-webkit-tap-highlight-color:transparent}
        .sharebtn:active{opacity:1;background:rgba(245,230,184,.1)}
        .langbtn{transition:all .2s ease;-webkit-tap-highlight-color:transparent}
        .langbtn:active{background:rgba(245,230,184,.12)!important}
        .copybtn{-webkit-tap-highlight-color:transparent}
        .copybtn:active{opacity:.7}
      `}</style>

      {/* stars */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", background: "radial-gradient(1px 1px at 20% 30%,rgba(255,255,255,.4),transparent),radial-gradient(1px 1px at 40% 70%,rgba(255,255,255,.3),transparent),radial-gradient(1px 1px at 80% 50%,rgba(255,255,255,.5),transparent),radial-gradient(1px 1px at 55% 15%,rgba(255,255,255,.25),transparent)" }}/>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 620, margin: "0 auto", padding: "34px 20px 48px" }}>

        {/* header */}
        <header style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <MoonAnim/>
            <button className="langbtn" onClick={() => setEs(!es)} style={{ background: "rgba(245,230,184,.06)", border: "1px solid rgba(245,230,184,.12)", borderRadius: 8, padding: "6px 16px", color: "#8B7D6B", fontSize: 11, cursor: "pointer", fontFamily: "system-ui,sans-serif", letterSpacing: 1.5 }}>{es ? "ENGLISH" : "ESPAÑOL"}</button>
          </div>
          <p style={{ ...LABEL, letterSpacing: 4, marginBottom: 8 }}>{es ? "Calendario Bíblico Observable" : "Observable Biblical Calendar"}</p>
          <h1 style={{ fontSize: 34, fontWeight: 300, lineHeight: 1.15, margin: 0, color: "#F5E6B8", textShadow: "0 0 40px rgba(245,230,184,.12)" }}>Moedim Watch</h1>
          <p style={{ fontSize: 13, color: "#7a7060", marginTop: 6, fontStyle: "italic" }}>{es ? "Hizo la luna para los tiempos \u2014 Salmo 104:19" : "He appointed the moon for seasons \u2014 Psalm 104:19"}</p>
        </header>

        {/* moon phase */}
        <div style={{ ...CARD, textAlign: "center", padding: "26px 22px" }}>
          <MoonVis age={age}/>
          <h2 style={{ fontSize: 21, fontWeight: 400, color: "#F5E6B8", margin: "10px 0 2px" }}>{ph.name}</h2>
          {ph.heb && <p style={{ fontSize: 11, color: "#D4AF37", margin: "0 0 4px", letterSpacing: 1 }}>{ph.heb}</p>}
          <p style={{ fontSize: 13, color: "#7a7060", margin: "0 0 14px", lineHeight: 1.6, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>{ph.desc}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, borderTop: "1px solid rgba(245,230,184,.06)", paddingTop: 14 }}>
            {[[Math.round(pct * 100) + "%", es ? "Iluminada" : "Illuminated"], ["~" + bD, es ? "Día del Mes" : "Day of Month"], [dN + "d", es ? "Luna Nueva" : "New Moon"]].map(([v, l], i) => (
              <div key={i}><div style={{ fontSize: 20, fontWeight: 600, color: "#F5E6B8" }}>{v}</div><div style={{ fontSize: 9, color: "#7a7060", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "system-ui,sans-serif" }}>{l}</div></div>
            ))}
          </div>
        </div>

        {/* date + sunset */}
        <div style={CARD}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
            <div>
              <p style={LABEL}>{es ? "Fecha Bíblica Actual" : "Current Biblical Date"}</p>
              <h3 style={{ fontSize: 17, fontWeight: 400, color: "#F5E6B8", margin: "0 0 2px" }}>{moN}, {es ? "Día" : "Day"} ~{bD}</h3>
              <p style={{ fontSize: 12, color: "#7a7060", margin: "2px 0 0", fontStyle: "italic" }}>{now.toLocaleDateString(es ? "es-PR" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
            </div>
            {isShab && <div style={{ background: "rgba(212,175,55,.1)", border: "1px solid rgba(212,175,55,.2)", borderRadius: 8, padding: "6px 12px", fontSize: 13, color: "#D4AF37" }}>{"\u05E9\u05C1\u05B7\u05D1\u05B8\u05BC\u05EA \u05E9\u05C1\u05B8\u05DC\u05D5\u05B9\u05DD"}</div>}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 12, color: "#8B7D6B", fontFamily: "system-ui,sans-serif" }}>{"\u2600"} {es ? "Atardecer" : "Sunset"}: <span style={{ color: "#D4AF37" }}>{sun}</span> <span style={{ fontSize: 10, color: "#5a5040" }}>(Isabela, PR)</span></div>
            <div style={{ fontSize: 12, color: "#8B7D6B", fontFamily: "system-ui,sans-serif" }}>{isAS ? (es ? "\uD83C\uDF19 Nuevo día bíblico" : "\uD83C\uDF19 New biblical day") : (es ? "\u2600 Antes del atardecer" : "\u2600 Before sunset")}</div>
          </div>
          <p style={{ fontSize: 9, color: "#4a4030", marginTop: 6, marginBottom: 0, fontFamily: "system-ui,sans-serif" }}>{es ? "Aprox. \u2014 depende del avistamiento del creciente." : "Approximate \u2014 depends on crescent sighting."}</p>
        </div>

        {/* omer */}
        {om && <div style={{ ...CARD, borderColor: "rgba(180,140,60,.15)", background: "linear-gradient(135deg,rgba(30,25,12,.7),rgba(22,18,8,.8))" }}>
          <p style={LABEL}>{es ? "Cuenta del Ómer" : "Omer Count"} \u2014 Lv. 23:15\u201316</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <span style={{ fontSize: 30, fontWeight: 300, color: "#D4AF37" }}>{om.day}</span>
            <span style={{ fontSize: 13, color: "#b8a880" }}>
              {es ? (om.w > 0 ? om.w + (om.w === 1 ? " semana" : " semanas") : "") + (om.w > 0 && om.r > 0 ? " y " : "") + (om.r > 0 ? om.r + (om.r === 1 ? " día" : " días") : "")
                : (om.w > 0 ? om.w + (om.w === 1 ? " week" : " weeks") : "") + (om.w > 0 && om.r > 0 ? " and " : "") + (om.r > 0 ? om.r + (om.r === 1 ? " day" : " days") : "")}
            </span>
          </div>
        </div>}

        {/* daily scripture */}
        <div style={CARD}>
          <p style={LABEL}>{es ? "Escritura del Día" : "Daily Scripture"}</p>
          <p style={{ fontSize: 15, color: "#e8e0d0", margin: "0 0 4px", lineHeight: 1.7, fontStyle: "italic" }}>{"\u201C"}{dv.ot}{"\u201D"}</p>
          <p style={{ fontSize: 11, color: "#D4AF37", margin: "2px 0 0" }}>{"\uD83D\uDCDC"} {dv.ov}</p>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(245,230,184,.05)" }}>
            <p style={{ fontSize: 14, color: "#c8c0b0", margin: "0 0 4px", lineHeight: 1.7, fontStyle: "italic" }}>{"\u201C"}{dv.nt}{"\u201D"}</p>
            <p style={{ fontSize: 11, color: "#7B9EC4", margin: "2px 0 0" }}>{"\u271D"} {dv.nv}</p>
          </div>
        </div>

        {/* next moed */}
        {nxt && <div style={CARD}>
          <p style={LABEL}>{es ? "Próximo Tiempo Señalado" : "Next Appointed Time"}</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 400, color: "#F5E6B8", margin: 0 }}>{es ? nxt.n : nxt.ne}</h3>
              <p style={{ fontSize: 12, color: "#7a7060", margin: "2px 0 0" }}>{new Date(nxt.d + "T12:00:00").toLocaleDateString(es ? "es-PR" : "en-US", { month: "long", day: "numeric" })} {es ? "al atardecer" : "at sunset"}</p>
            </div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 26, fontWeight: 300, color: "#D4AF37" }}>{dTo}</div><div style={{ fontSize: 9, color: "#7a7060", letterSpacing: 1.5, textTransform: "uppercase", fontFamily: "system-ui,sans-serif" }}>{es ? "días" : "days"}</div></div>
          </div>
        </div>}

        {/* timeline */}
        <div style={CARD}>
          <p style={LABEL}>{es ? "Tiempos Señalados 2026" : "Appointed Times 2026"} \u2014 Lv. 23</p>
          {MOEDIM.map((m, i) => {
            const past = new Date(m.d + "T18:00:00") < now;
            const isN = nxt && m.d === nxt.d;
            const open = exp === i;
            return (
              <div key={i} className="row" onClick={() => setExp(open ? null : i)}
                style={{ padding: "12px 14px", borderLeft: isN ? "3px solid #D4AF37" : "3px solid transparent", opacity: past ? .4 : 1, marginBottom: 2 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 15, color: isN ? "#F5E6B8" : "#c8c0b0", fontWeight: isN ? 500 : 400 }}>{es ? m.n : m.ne}</span>
                    <span style={{ fontSize: 11, color: "#5a5040", marginLeft: 10, fontFamily: "system-ui,sans-serif" }}>{m.h}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <div className="sharebtn" onClick={e => handleShare(m, e)}>
                      <span style={{ fontSize: 16 }}>{"\uD83D\uDCE4"}</span>
                    </div>
                    <span style={{ fontSize: 10, color: "#5a5040", fontFamily: "system-ui,sans-serif", transition: "transform .35s cubic-bezier(.4,0,.2,1)", transform: open ? "rotate(180deg)" : "rotate(0)", display: "inline-block", width: 16, textAlign: "center" }}>{"\u25BC"}</span>
                  </div>
                </div>
                <div className={"det " + (open ? "open" : "shut")}>
                  <p style={{ fontSize: 12, color: "#7a7060", margin: "0 0 8px", fontFamily: "system-ui,sans-serif" }}>{new Date(m.d + "T12:00:00").toLocaleDateString(es ? "es-PR" : "en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} {es ? "al atardecer" : "at sunset"}</p>
                  <p style={{ fontSize: 14, color: "#e8e0d0", margin: "0 0 3px", fontStyle: "italic", lineHeight: 1.6 }}>{"\u201C"}{es ? m.te : m.tn}{"\u201D"}</p>
                  <p style={{ fontSize: 11, color: "#D4AF37", margin: "2px 0 10px" }}>{"\uD83D\uDCDC"} {es ? m.ve : m.vn}</p>
                  <p style={{ fontSize: 13, color: "#c8c0b0", margin: "0 0 3px", fontStyle: "italic", lineHeight: 1.6 }}>{"\u201C"}{es ? m.se : m.sn}{"\u201D"}</p>
                  <p style={{ fontSize: 11, color: "#7B9EC4", margin: "2px 0 0" }}>{"\u271D"} {es ? m.re : m.rn}</p>
                  <div style={{ borderLeft: "2px solid rgba(212,175,55,.25)", paddingLeft: 12, marginTop: 12 }}>
                    <p style={{ fontSize: 12, color: "#a09070", margin: 0, lineHeight: 1.65, fontStyle: "italic" }}>{es ? m.me : m.mn}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* methodology */}
        <div style={{ ...CARD, opacity: .8 }}>
          <p style={LABEL}>{es ? "Metodología" : "Methodology"}</p>
          <p style={{ fontSize: 11, color: "#6a6050", margin: 0, lineHeight: 1.6, fontFamily: "system-ui,sans-serif" }}>{es ? "Método observable: meses al avistar creciente lunar; año cuando cebada está aviv en Israel (Éx. 9:31, 12:2, Dt. 16:1). Fechas 2026: cebada aviv confirmada, primer creciente ~19\u201320 marzo. Día comienza al atardecer. Hora calculada para Isabela, PR." : "Observable method: months begin at crescent sighting, year when barley is aviv in Israel (Ex. 9:31, 12:2, Deut. 16:1). 2026: aviv confirmed, first crescent ~March 19\u201320. Day begins at sunset. Time calculated for Isabela, PR."}</p>
        </div>

        <footer style={{ textAlign: "center", paddingTop: 8 }}>
          <p style={{ fontSize: 11, color: "#3a3535", fontStyle: "italic" }}>{"\u201C"}{es ? "Estas son las fiestas solemnes de YHWH, las convocaciones santas, a las cuales convocaréis en sus tiempos." : "These are the feasts of YHWH, holy convocations, which ye shall proclaim in their seasons."}{"\u201D"} \u2014 Lv. 23:4</p>
        </footer>
      </div>

      {/* ── share overlay ── */}
      {shareText !== null && (
        <div onClick={() => { setShareText(null); setDidCopy(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,.8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: "#1c1a15", border: "1px solid rgba(245,230,184,.15)", borderRadius: 16, padding: "24px 20px", maxWidth: 400, width: "100%", maxHeight: "80vh", overflowY: "auto" }}>
            <p style={{ ...LABEL, marginBottom: 14 }}>{es ? "Tarjeta para compartir" : "Share card"}</p>
            <div style={{ background: "rgba(0,0,0,.3)", borderRadius: 10, padding: "16px 14px", marginBottom: 16 }}>
              <pre style={{ fontSize: 13, color: "#d8d0c0", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.65, margin: 0, fontFamily: "'Cormorant Garamond',serif" }}>{shareText}</pre>
            </div>
            <button className="copybtn" onClick={handleCopy}
              style={{ width: "100%", padding: "14px 16px", fontSize: 15, fontWeight: 600, fontFamily: "system-ui,sans-serif", borderRadius: 10, border: "none", cursor: "pointer",
                background: didCopy ? "rgba(80,180,80,.2)" : "rgba(212,175,55,.2)", color: didCopy ? "#80c080" : "#D4AF37", letterSpacing: .5 }}>
              {didCopy ? (es ? "\u2713 Copiado \u2014 pega en WhatsApp" : "\u2713 Copied \u2014 paste in WhatsApp") : (es ? "Copiar texto" : "Copy text")}
            </button>
            <button className="copybtn" onClick={() => { setShareText(null); setDidCopy(false); }}
              style={{ width: "100%", marginTop: 8, padding: "12px 16px", fontSize: 13, fontFamily: "system-ui,sans-serif", borderRadius: 10, border: "1px solid rgba(245,230,184,.1)", cursor: "pointer", background: "transparent", color: "#8B7D6B" }}>
              {es ? "Cerrar" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
