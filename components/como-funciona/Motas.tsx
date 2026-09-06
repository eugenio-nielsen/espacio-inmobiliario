/**
 * Polvo suspendido sobre las escenas oscuras.
 *
 * Las posiciones son una lista fija y no `Math.random()`: al ser un
 * Server Component, valores aleatorios darían un HTML distinto en el
 * servidor y en el cliente, y React marcaría error de hidratación.
 */
const MOTAS = [
  { l: "8%",  t: "72%", d: "0s",   dur: "15s" },
  { l: "19%", t: "44%", d: "2.4s", dur: "12s" },
  { l: "31%", t: "83%", d: "5.1s", dur: "17s" },
  { l: "44%", t: "31%", d: "1.2s", dur: "13s" },
  { l: "56%", t: "67%", d: "6.8s", dur: "16s" },
  { l: "68%", t: "23%", d: "3.6s", dur: "14s" },
  { l: "77%", t: "78%", d: "8.2s", dur: "12s" },
  { l: "88%", t: "52%", d: "4.4s", dur: "18s" },
  { l: "94%", t: "34%", d: "7.1s", dur: "15s" },
];

export default function Motas() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {MOTAS.map((m, i) => (
        <span
          key={i}
          className="cf-mote"
          style={{ left: m.l, top: m.t, animationDelay: m.d, animationDuration: m.dur }}
        />
      ))}
    </div>
  );
}
